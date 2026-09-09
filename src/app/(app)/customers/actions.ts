"use server";

import { asc, count, eq, max } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { customers, invoices } from "@/db/schema/tables";
import { ActionError, type ActionResult, runAction } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/session";
import type { Customer } from "@/lib/types";

/** A cleared field means "no value", not the empty string the detail page prints. */
const optionalText = z
  .string()
  .trim()
  .default("")
  .transform((value) => value || null);

const customerInput = z.object({
  name: z.string().trim().min(1, "Name is required"),
  contactName: optionalText,
  email: optionalText,
  phone: optionalText,
  address: optionalText,
  city: optionalText,
  postalCode: optionalText,
  taxId: optionalText,
  countryCode: optionalText.transform((v) => v?.toUpperCase() ?? null),
});

export type CustomerInput = z.input<typeof customerInput>;

export async function listCustomers(): Promise<ActionResult<Customer[]>> {
  return runAction(async () => {
    await requirePermission("customers", "read");
    return db.select().from(customers).orderBy(asc(customers.name));
  });
}

export async function getCustomer(
  id: string,
): Promise<ActionResult<Customer | null>> {
  return runAction(async () => {
    await requirePermission("customers", "read");
    const row = await db.query.customers.findFirst({
      where: eq(customers.id, id),
    });
    return row ?? null;
  });
}

export async function createCustomer(
  input: CustomerInput,
): Promise<ActionResult<Customer>> {
  return runAction(async () => {
    await requirePermission("customers", "create");
    const values = customerInput.parse(input);

    // §4.4 — {CNUM} is permanent and never reused, so it comes off the
    // high-water mark rather than the row count.
    const [{ highest }] = await db
      .select({ highest: max(customers.customerNumber) })
      .from(customers);

    const [row] = await db
      .insert(customers)
      .values({ ...values, customerNumber: (highest ?? 0) + 1 })
      .returning();

    return row;
  });
}

export async function updateCustomer(
  id: string,
  input: CustomerInput,
): Promise<ActionResult<Customer>> {
  return runAction(async () => {
    await requirePermission("customers", "update");
    const values = customerInput.parse(input);

    // customerNumber is deliberately not in the update set: it is the customer's
    // permanent identity, and moving it would rewrite past invoice numbers.
    const [row] = await db
      .update(customers)
      .set(values)
      .where(eq(customers.id, id))
      .returning();

    if (!row) throw new ActionError("Customer not found");
    return row;
  });
}

export async function deleteCustomer(id: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    await requirePermission("customers", "delete");

    // The invoice FK has no cascade, so without this the user would see a raw
    // constraint violation instead of a sentence.
    const [{ invoiceCount }] = await db
      .select({ invoiceCount: count() })
      .from(invoices)
      .where(eq(invoices.customerId, id));

    if (invoiceCount > 0) {
      throw new ActionError(
        `This customer is on ${invoiceCount} invoice${invoiceCount === 1 ? "" : "s"} and cannot be deleted.`,
      );
    }

    await db.delete(customers).where(eq(customers.id, id));
    return null;
  });
}
