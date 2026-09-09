import { relations } from "drizzle-orm";
import { invoices, invoiceTaxes, taxDefinitions } from "../tables";

export const invoiceTaxesRelations = relations(invoiceTaxes, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceTaxes.invoiceId],
    references: [invoices.id],
  }),
  taxDefinition: one(taxDefinitions, {
    fields: [invoiceTaxes.taxDefinitionId],
    references: [taxDefinitions.id],
  }),
}));
