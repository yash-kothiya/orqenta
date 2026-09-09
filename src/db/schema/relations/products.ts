import { relations } from "drizzle-orm";
import { invoiceItems, products, taxDefinitions } from "../tables";

export const productsRelations = relations(products, ({ one, many }) => ({
  taxDefinition: one(taxDefinitions, {
    fields: [products.taxDefinitionId],
    references: [taxDefinitions.id],
  }),
  invoiceItems: many(invoiceItems),
}));
