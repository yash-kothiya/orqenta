import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";
import { invoiceItems } from "./invoice-items";
import { taxDefinitions } from "./tax-definitions";

/** §4.3 — an item carrying these rows is totalled per line, not at invoice rate. */
export const invoiceItemTaxes = pgTable(
  "invoice_item_taxes",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("iit")),
    invoiceItemId: varchar("invoice_item_id", { length: 50 })
      .notNull()
      .references(() => invoiceItems.id, { onDelete: "cascade" }),
    taxDefinitionId: varchar("tax_definition_id", { length: 50 }).references(
      () => taxDefinitions.id,
    ),
    percent: numeric("percent", { precision: 6, scale: 3 }).notNull(),
    taxableAmount: numeric("taxable_amount", {
      precision: 14,
      scale: 2,
    }).notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    included: boolean("included").notNull().default(false),
    sequence: integer("sequence").notNull().default(0),
    note: text("note"),
    ...timestamps,
  },
  (table) => [
    index("invoice_item_taxes_invoice_item_id_idx").on(table.invoiceItemId),
  ],
);
