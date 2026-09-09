import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";
import { invoices } from "./invoices";
import { products } from "./products";

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("item")),
    invoiceId: varchar("invoice_id", { length: 50 })
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    productId: varchar("product_id", { length: 50 }).references(
      () => products.id,
    ),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull(),
    unit: text("unit"),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
    lineTotal: numeric("line_total", { precision: 14, scale: 2 }).notNull(),
    notes: text("notes"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("invoice_items_invoice_id_sort_order_idx").on(
      table.invoiceId,
      table.sortOrder,
    ),
    index("invoice_items_product_id_idx").on(table.productId),
  ],
);
