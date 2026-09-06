import { index, numeric, pgTable, varchar } from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";
import { invoices } from "./invoices";
import { taxDefinitions } from "./tax-definitions";

/** Invoice-level tax summary, one row per distinct rate. */
export const invoiceTaxes = pgTable(
  "invoice_taxes",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("itx")),
    invoiceId: varchar("invoice_id", { length: 50 })
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    taxDefinitionId: varchar("tax_definition_id", { length: 50 }).references(
      () => taxDefinitions.id,
    ),
    percent: numeric("percent", { precision: 6, scale: 3 }).notNull(),
    taxableAmount: numeric("taxable_amount", {
      precision: 14,
      scale: 2,
    }).notNull(),
    taxAmount: numeric("tax_amount", { precision: 14, scale: 2 }).notNull(),
    ...timestamps,
  },
  (table) => [index("invoice_taxes_invoice_id_idx").on(table.invoiceId)],
);
