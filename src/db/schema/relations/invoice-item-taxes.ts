import { relations } from "drizzle-orm";
import { invoiceItems, invoiceItemTaxes, taxDefinitions } from "../tables";

export const invoiceItemTaxesRelations = relations(
  invoiceItemTaxes,
  ({ one }) => ({
    invoiceItem: one(invoiceItems, {
      fields: [invoiceItemTaxes.invoiceItemId],
      references: [invoiceItems.id],
    }),
    taxDefinition: one(taxDefinitions, {
      fields: [invoiceItemTaxes.taxDefinitionId],
      references: [taxDefinitions.id],
    }),
  }),
);
