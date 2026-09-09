import { relations } from "drizzle-orm";
import { invoiceItems, invoiceItemTaxes, invoices, products } from "../tables";

export const invoiceItemsRelations = relations(
  invoiceItems,
  ({ one, many }) => ({
    invoice: one(invoices, {
      fields: [invoiceItems.invoiceId],
      references: [invoices.id],
    }),
    product: one(products, {
      fields: [invoiceItems.productId],
      references: [products.id],
    }),
    taxes: many(invoiceItemTaxes),
  }),
);
