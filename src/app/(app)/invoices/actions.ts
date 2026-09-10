"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices, settings } from "@/db/schema/tables";
import { type ActionResult, runAction } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/session";
import { deriveStatus } from "@/lib/invoice-status";
import {
  maxSequenceIn,
  getNextInvoiceNumber as nextNumber,
} from "@/lib/numbering";
import { rowsToSettings } from "@/lib/settings";
import type { InvoiceListRow, InvoiceWithDetails } from "@/lib/types";

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
