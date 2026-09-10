"use server";

import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  invoiceItems,
  invoiceItemTaxes,
  invoiceStatusHistory,
  invoices,
  invoiceTaxes,
  settings,
} from "@/db/schema/tables";
import { ActionError, type ActionResult, runAction } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/session";
import {
  canDeleteInvoice,
  canEditInvoice,
  deriveStatus,
} from "@/lib/invoice-status";
import {
  calculateInvoiceTotals,
  calculatePerLineTotals,
  type InvoiceTotals,
  type PerLineTotals,
  r2,
} from "@/lib/money";
import {
  maxSequenceIn,
  getNextInvoiceNumber as nextNumber,
} from "@/lib/numbering";
import { rowsToSettings } from "@/lib/settings";
import {
  INVOICE_STATUSES,
  type Invoice,
  type InvoiceListRow,
  type InvoiceStatus,
  type InvoiceWithDetails,
  ROUNDING_MODES,
  TAX_MODES,
} from "@/lib/types";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const optionalText = z
  .string()
  .trim()
  .default("")
  .transform((value) => value || null);

/** Numeric columns take strings; the editor sends strings anyway. */
const decimal = (label: string, fallback?: string) =>
  z
    .union([z.string(), z.number()])
    .transform((value) => String(value).trim())
    .transform((value) => (value === "" && fallback ? fallback : value))
    .refine((value) => value !== "", `${label} is required`)
    .refine(
      (value) => Number.isFinite(Number(value)),
      `${label} must be a number`,
    )
    .refine((value) => Number(value) >= 0, `${label} must be 0 or more`)
    .default(fallback ?? "");

/**
 * §4.5 — the most recent `paid` row's payment method. The history is append
 * only, so "most recent" is the last one written.
 */
function paidWith(
  history: readonly { status: string; paymentMethod: string | null }[],
) {
  return (
    [...history].reverse().find((row) => row.status === "paid")
      ?.paymentMethod ?? null
  );
}

const itemInput = z.object({
  productId: optionalText,
  description: z.string().trim().min(1, "Description is required"),
  quantity: decimal("Quantity"),
  unit: optionalText,
  unitPrice: decimal("Unit price"),
  taxPercent: decimal("Tax %", "0"),
  notes: optionalText,
});

const invoiceInput = z.object({
  customerId: z.string().trim().min(1, "Customer is required"),
  /** Omitted by the editor on create so the server allocates it (§4.4). */
  invoiceNumber: optionalText,
  currency: z
    .string()
    .trim()
    .default("EUR")
    .transform((v) => v || "EUR"),
  status: z.enum(INVOICE_STATUSES).default("draft"),
  issueDate: z.string().trim().min(1, "Issue date is required"),
  dueDate: optionalText,
  taxMode: z.enum(TAX_MODES).default("invoice"),
  taxRate: decimal("Tax rate", "0"),
  pricesIncludeTax: z
    .union([z.boolean(), z.literal("yes"), z.literal("no")])
    .default(false)
    .transform((v) => v === true || v === "yes"),
  roundingMode: z.enum(ROUNDING_MODES).default("line"),
  discountAmount: decimal("Discount", "0"),
  discountPercentage: decimal("Discount %", "0"),
  paymentTerms: optionalText,
  notes: optionalText,
  items: z.array(itemInput).min(1, "Add at least one item"),
});

export type InvoiceInput = z.input<typeof invoiceInput>;
type ParsedInvoice = z.output<typeof invoiceInput>;

/**
 * §4.5 — `overdue` is derived on read and must never reach a column, or the
 * invoice would stay overdue after its due date moved.
 */
const storableStatus = (status: InvoiceStatus): InvoiceStatus =>
  status === "overdue" ? "sent" : status;

type ComputedTotals = InvoiceTotals | PerLineTotals;

/** §4.2 vs §4.3: a per-line tax mode totals each line at its own rate. */
function totalsFor(input: ParsedInvoice): ComputedTotals {
  const lines = input.items.map((item) => ({
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
  }));

  const shared = {
    discountAmount: Number(input.discountAmount),
    discountPercentage: Number(input.discountPercentage),
    pricesIncludeTax: input.pricesIncludeTax,
  };

  if (input.taxMode === "line") {
    return calculatePerLineTotals({
      ...shared,
      items: lines.map((line, i) => ({
        ...line,
        taxes: [{ percent: Number(input.items[i].taxPercent) }],
      })),
    });
  }

  return calculateInvoiceTotals({
    ...shared,
    items: lines,
    taxRate: Number(input.taxRate),
    roundingMode: input.roundingMode,
  });
}

/** Everything below the invoice row, rewritten from scratch on every save. */
async function writeLines(
  tx: Transaction,
  invoiceId: string,
  input: ParsedInvoice,
  totals: ComputedTotals,
) {
  await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  await tx.delete(invoiceTaxes).where(eq(invoiceTaxes.invoiceId, invoiceId));

  const perItem = "perItem" in totals ? totals.perItem : undefined;

  for (const [index, item] of input.items.entries()) {
    const [row] = await tx
      .insert(invoiceItems)
      .values({
        invoiceId,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        lineTotal: r2(Number(item.quantity) * Number(item.unitPrice)).toFixed(
          2,
        ),
        notes: item.notes,
        sortOrder: index,
      })
      .returning({ id: invoiceItems.id });

    // §4.3 — only the per-line mode produces these; the single-rate mode has
    // nothing to say about an individual line.
    for (const [sequence, tax] of (perItem?.[index].taxes ?? []).entries()) {
      await tx.insert(invoiceItemTaxes).values({
        invoiceItemId: row.id,
        percent: tax.percent.toFixed(3),
        taxableAmount: perItem?.[index].taxable.toFixed(2) ?? "0",
        amount: tax.amount.toFixed(2),
        included: input.pricesIncludeTax,
        sequence,
      });
    }
  }

  const summary =
    "summary" in totals
      ? totals.summary
      : Number(input.taxRate) > 0
        ? [
            {
              percent: Number(input.taxRate),
              taxable: totals.subtotal - totals.discountAmount,
              amount: totals.taxAmount,
            },
          ]
        : [];

  for (const group of summary) {
    await tx.insert(invoiceTaxes).values({
      invoiceId,
      percent: group.percent.toFixed(3),
      taxableAmount: r2(group.taxable).toFixed(2),
      taxAmount: group.amount.toFixed(2),
    });
  }
}

/** The invoice row's own columns, derived from the input and the totals. */
const invoiceValues = (input: ParsedInvoice, totals: ComputedTotals) => ({
  customerId: input.customerId,
  issueDate: input.issueDate,
  dueDate: input.dueDate,
  currency: input.currency,
  status: storableStatus(input.status),
  subtotal: totals.subtotal.toFixed(2),
  discountAmount: totals.discountAmount.toFixed(2),
  discountPercentage: Number(input.discountPercentage).toFixed(3),
  taxRate: Number(input.taxRate).toFixed(3),
  taxAmount: totals.taxAmount.toFixed(2),
  total: totals.total.toFixed(2),
  pricesIncludeTax: input.pricesIncludeTax,
  roundingMode: input.roundingMode,
  paymentTerms: input.paymentTerms,
  notes: input.notes,
});

export async function listInvoices(): Promise<ActionResult<InvoiceListRow[]>> {
  return runAction(async () => {
    await requirePermission("invoices", "read");

    const rows = await db.query.invoices.findMany({
      with: {
        customer: { columns: { id: true, name: true } },
        statusHistory: {
          columns: { status: true, paymentMethod: true },
          orderBy: (history, { asc: ascending }) => [
            ascending(history.createdAt),
          ],
        },
      },
      orderBy: [desc(invoices.issueDate), desc(invoices.createdAt)],
    });

    // The derivation happens once, here, so the list, the detail page and the
    // renderer cannot disagree about what is overdue (§4.5).
    const now = new Date();
    return rows.map(({ statusHistory, ...invoice }) => ({
      ...invoice,
      status: deriveStatus(invoice.status, invoice.dueDate, now),
      paidWith: paidWith(statusHistory),
    }));
  });
}

export async function getInvoice(
  id: string,
): Promise<ActionResult<InvoiceWithDetails | null>> {
  return runAction(async () => {
    await requirePermission("invoices", "read");

    const row = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: {
        customer: true,
        items: { with: { taxes: true } },
        taxes: true,
        statusHistory: {
          orderBy: (history, { asc: ascending }) => [
            ascending(history.createdAt),
          ],
        },
      },
    });

    if (!row) return null;

    return {
      ...row,
      status: deriveStatus(row.status, row.dueDate, new Date()),
      paidWith: paidWith(row.statusHistory),
    };
  });
}

/** §4.6 reads this before every edit and delete. */
async function allowsProtectedChanges() {
  return rowsToSettings(await db.select().from(settings))
    .allowProtectedInvoiceChanges;
}

async function requireUnusedNumber(number: string, excludeId?: string) {
  const clash = await db.query.invoices.findFirst({
    columns: { id: true },
    where: (invoice, { and, eq: equals, ne }) =>
      excludeId
        ? and(equals(invoice.invoiceNumber, number), ne(invoice.id, excludeId))
        : equals(invoice.invoiceNumber, number),
  });

  if (clash) throw new ActionError("Invoice number already exists");
}

export async function createInvoice(
  input: InvoiceInput,
): Promise<ActionResult<Invoice>> {
  return runAction(async () => {
    await requirePermission("invoices", "create");
    const values = invoiceInput.parse(input);
    const totals = totalsFor(values);

    // §4.4 — a number the client chose is honoured once it is free; otherwise
    // a real one is allocated here, where the scan and the insert are adjacent.
    let invoiceNumber = values.invoiceNumber;
    if (invoiceNumber) {
      await requireUnusedNumber(invoiceNumber);
    } else {
      const next = await getNextInvoiceNumber(values.customerId);
      if (!next.ok) throw new ActionError(next.error);
      invoiceNumber = next.data;
    }

    return db.transaction(async (tx) => {
      const [invoice] = await tx
        .insert(invoices)
        .values({
          ...invoiceValues(values, totals),
          invoiceNumber,
          // §10.16 — the public page needs one from the start, and the column
          // is not nullable; publishing only guarantees it, never mints it.
          shareToken: randomUUID(),
        })
        .returning();

      await writeLines(tx, invoice.id, values, totals);
      await tx.insert(invoiceStatusHistory).values({
        invoiceId: invoice.id,
        status: invoice.status,
        note: "Created",
      });

      return invoice;
    });
  });
}

export async function updateInvoice(
  id: string,
  input: InvoiceInput,
): Promise<ActionResult<Invoice>> {
  return runAction(async () => {
    await requirePermission("invoices", "update");

    const current = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
    });
    if (!current) throw new ActionError("Invoice not found");

    // §4.6 — the stored status is not enough: an invoice that has quietly gone
    // overdue is protected too, so the check runs on the derived one.
    const status = deriveStatus(current.status, current.dueDate);
    if (!canEditInvoice(status, await allowsProtectedChanges())) {
      throw new ActionError(
        "This invoice has been sent and cannot be edited. Enable protected invoice changes in settings to override.",
      );
    }

    const values = invoiceInput.parse(input);
    const totals = totalsFor(values);
    if (values.invoiceNumber)
      await requireUnusedNumber(values.invoiceNumber, id);

    return db.transaction(async (tx) => {
      const [invoice] = await tx
        .update(invoices)
        .set({
          ...invoiceValues(values, totals),
          ...(values.invoiceNumber
            ? { invoiceNumber: values.invoiceNumber }
            : {}),
        })
        .where(eq(invoices.id, id))
        .returning();

      await writeLines(tx, id, values, totals);

      // §4.5 — every status write is an event, including one made by editing.
      if (invoice.status !== current.status) {
        await tx.insert(invoiceStatusHistory).values({
          invoiceId: id,
          status: invoice.status,
          note: "Changed while editing",
        });
      }

      return invoice;
    });
  });
}

export async function deleteInvoice(id: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    await requirePermission("invoices", "delete");

    const current = await db.query.invoices.findFirst({
      columns: { status: true, dueDate: true },
      where: eq(invoices.id, id),
    });
    if (!current) throw new ActionError("Invoice not found");

    const status = deriveStatus(current.status, current.dueDate);
    if (!canDeleteInvoice(status, await allowsProtectedChanges())) {
      throw new ActionError(
        "This invoice has been sent and cannot be deleted. Enable protected invoice changes in settings to override.",
      );
    }

    // Items, taxes, history and attachments all cascade from here.
    await db.delete(invoices).where(eq(invoices.id, id));
    return null;
  });
}

/**
 * §4.4 preview for the editor. The number the invoice actually keeps is
 * allocated server-side at creation — two people previewing at once would
 * otherwise both be promised the same one.
 */
export async function getNextInvoiceNumber(
  customerId?: string,
): Promise<ActionResult<string>> {
  return runAction(async () => {
    await requirePermission("invoices", "create");

    const config = rowsToSettings(await db.select().from(settings));
    const customer = customerId
      ? await db.query.customers.findFirst({
          where: (rows, { eq: equals }) => equals(rows.id, customerId),
          columns: { customerNumber: true },
        })
      : undefined;

    return nextNumber(config, findMaxSequence, {
      customerId,
      customerNumber: customer?.customerNumber,
    });
  });
}

const escapeLike = (value: string) =>
  value.replace(/[\\%_]/g, (char) => `\\${char}`);

/**
 * The counter §4.4 scans with: every issued number under `likePrefix`, then the
 * highest run of digits straight after it.
 */
async function findMaxSequence(likePrefix: string, customerId?: string) {
  const rows = await db.query.invoices.findMany({
    columns: { invoiceNumber: true },
    where: (invoice, { and, like, eq: equals }) => {
      // `like` treats _ and % as wildcards and invoice numbers are full of
      // separators, so the literal prefix has to be escaped first.
      const prefix = like(invoice.invoiceNumber, `${escapeLike(likePrefix)}%`);
      return customerId
        ? and(prefix, equals(invoice.customerId, customerId))
        : prefix;
    },
  });

  return maxSequenceIn(
    rows.map((row) => row.invoiceNumber),
    likePrefix,
  );
}
