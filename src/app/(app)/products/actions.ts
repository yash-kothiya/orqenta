"use server";

import { and, asc, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  invoiceItems,
  productCategories,
  products,
  productUnits,
} from "@/db/schema/tables";
import { ActionError, type ActionResult, runAction } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/session";
import type { Product, ProductCategory, ProductUnit } from "@/lib/types";

const optionalText = z
  .string()
  .trim()
  .default("")
  .transform((value) => value || null);

/** The form sends a string, the fixtures send a number; numeric wants a string. */
const money = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => value !== "", "Unit price is required")
  .refine(
    (value) => Number.isFinite(Number(value)) && Number(value) >= 0,
    "Enter a price of 0 or more",
  )
  .transform((value) => Number(value).toFixed(2));

const productInput = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: optionalText,
  unitPrice: money,
  sku: optionalText,
  unit: optionalText,
  category: optionalText,
  taxDefinitionId: optionalText,
  isActive: z.boolean().default(true),
});

/** Categories and units are the same shape; only the table differs. */
const lookupInput = z.object({
  code: z.string().trim().min(1, "Code is required"),
  name: z.string().trim().min(1, "Name is required"),
  sortOrder: z.coerce.number().int().default(0),
});

export type ProductInput = z.input<typeof productInput>;
export type LookupInput = z.input<typeof lookupInput>;

export async function listProducts(
  includeInactive = false,
): Promise<ActionResult<Product[]>> {
  return runAction(async () => {
    await requirePermission("products", "read");
    return db
      .select()
      .from(products)
      .where(includeInactive ? undefined : eq(products.isActive, true))
      .orderBy(asc(products.name));
  });
}

export async function getProduct(
  id: string,
): Promise<ActionResult<Product | null>> {
  return runAction(async () => {
    await requirePermission("products", "read");
    const row = await db.query.products.findFirst({
      where: eq(products.id, id),
    });
    return row ?? null;
  });
}

export async function createProduct(
  input: ProductInput,
): Promise<ActionResult<Product>> {
  return runAction(async () => {
    await requirePermission("products", "create");
    const [row] = await db
      .insert(products)
      .values(productInput.parse(input))
      .returning();
    return row;
  });
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ActionResult<Product>> {
  return runAction(async () => {
    await requirePermission("products", "update");
    const [row] = await db
      .update(products)
      .set(productInput.parse(input))
      .where(eq(products.id, id))
      .returning();

    if (!row) throw new ActionError("Product not found");
    return row;
  });
}

/** §4.7 — a soft delete, so historical invoice lines keep resolving. */
export async function deleteProduct(id: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    await requirePermission("products", "delete");
    await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, id));
    return null;
  });
}

export async function reactivateProduct(
  id: string,
): Promise<ActionResult<null>> {
  return runAction(async () => {
    await requirePermission("products", "update");
    await db
      .update(products)
      .set({ isActive: true })
      .where(eq(products.id, id));
    return null;
  });
}

/** How many invoice lines still point at this product. */
export async function productUsage(id: string): Promise<ActionResult<number>> {
  return runAction(async () => {
    await requirePermission("products", "read");
    const [{ used }] = await db
      .select({ used: count() })
      .from(invoiceItems)
      .where(eq(invoiceItems.productId, id));
    return used;
  });
}

export async function listProductCategories(): Promise<
  ActionResult<ProductCategory[]>
> {
  return runAction(async () => {
    await requirePermission("products", "read");
    return db
      .select()
      .from(productCategories)
      .orderBy(asc(productCategories.sortOrder), asc(productCategories.name));
  });
}

export async function listProductUnits(): Promise<ActionResult<ProductUnit[]>> {
  return runAction(async () => {
    await requirePermission("products", "read");
    return db
      .select()
      .from(productUnits)
      .orderBy(asc(productUnits.sortOrder), asc(productUnits.name));
  });
}

export async function createProductCategory(
  input: LookupInput,
): Promise<ActionResult<ProductCategory>> {
  return runAction(async () => {
    await requirePermission("products", "create");
    const values = lookupInput.parse(input);
    await assertCodeIsFree(productCategories, values.code);

    const [row] = await db.insert(productCategories).values(values).returning();
    return row;
  });
}

export async function createProductUnit(
  input: LookupInput,
): Promise<ActionResult<ProductUnit>> {
  return runAction(async () => {
    await requirePermission("products", "create");
    const values = lookupInput.parse(input);
    await assertCodeIsFree(productUnits, values.code);

    const [row] = await db.insert(productUnits).values(values).returning();
    return row;
  });
}

export async function updateProductCategory(
  id: string,
  input: LookupInput,
): Promise<ActionResult<ProductCategory>> {
  return runAction(async () => {
    await requirePermission("products", "update");
    const values = lookupInput.parse(input);
    await assertCodeIsFree(productCategories, values.code, id);

    return db.transaction(async (tx) => {
      const current = await tx.query.productCategories.findFirst({
        where: eq(productCategories.id, id),
      });
      if (!current) throw new ActionError("Category not found");

      const [row] = await tx
        .update(productCategories)
        .set(values)
        .where(eq(productCategories.id, id))
        .returning();

      // products.category holds the code, not the id, so a rename has to carry
      // the products across or they silently lose their category.
      if (current.code !== values.code) {
        await tx
          .update(products)
          .set({ category: values.code })
          .where(eq(products.category, current.code));
      }

      return row;
    });
  });
}

export async function updateProductUnit(
  id: string,
  input: LookupInput,
): Promise<ActionResult<ProductUnit>> {
  return runAction(async () => {
    await requirePermission("products", "update");
    const values = lookupInput.parse(input);
    await assertCodeIsFree(productUnits, values.code, id);

    return db.transaction(async (tx) => {
      const current = await tx.query.productUnits.findFirst({
        where: eq(productUnits.id, id),
      });
      if (!current) throw new ActionError("Unit not found");

      const [row] = await tx
        .update(productUnits)
        .set(values)
        .where(eq(productUnits.id, id))
        .returning();

      if (current.code !== values.code) {
        await tx
          .update(products)
          .set({ unit: values.code })
          .where(eq(products.unit, current.code));
      }

      return row;
    });
  });
}

export async function deleteProductCategory(
  id: string,
): Promise<ActionResult<null>> {
  return runAction(async () => {
    await requirePermission("products", "delete");
    const row = await db.query.productCategories.findFirst({
      where: eq(productCategories.id, id),
    });
    if (!row) throw new ActionError("Category not found");

    await assertUnused(products.category, row.code, "category");
    await db.delete(productCategories).where(eq(productCategories.id, id));
    return null;
  });
}

export async function deleteProductUnit(
  id: string,
): Promise<ActionResult<null>> {
  return runAction(async () => {
    await requirePermission("products", "delete");
    const row = await db.query.productUnits.findFirst({
      where: eq(productUnits.id, id),
    });
    if (!row) throw new ActionError("Unit not found");

    await assertUnused(products.unit, row.code, "unit");
    await db.delete(productUnits).where(eq(productUnits.id, id));
    return null;
  });
}

/** §10.15 surfaces the usage count, so the refusal carries it. */
async function assertUnused(
  column: typeof products.category | typeof products.unit,
  code: string,
  label: string,
) {
  const [{ used }] = await db
    .select({ used: count() })
    .from(products)
    .where(eq(column, code));

  if (used > 0) {
    const subject = used === 1 ? "1 product uses" : `${used} products use`;
    throw new ActionError(`${subject} this ${label} and would lose it.`);
  }
}

/** The unique index would raise a constraint violation; this raises a sentence. */
async function assertCodeIsFree(
  table: typeof productCategories | typeof productUnits,
  code: string,
  excludeId?: string,
) {
  const [{ taken }] = await db
    .select({ taken: count() })
    .from(table)
    .where(
      excludeId
        ? and(eq(table.code, code), ne(table.id, excludeId))
        : eq(table.code, code),
    );

  if (taken > 0) throw new ActionError(`The code "${code}" is already in use.`);
}
