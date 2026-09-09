import { relations } from "drizzle-orm";
import {
  invoiceItemTaxes,
  invoiceTaxes,
  products,
  taxDefinitions,
} from "../tables";

export const taxDefinitionsRelations = relations(
  taxDefinitions,
  ({ many }) => ({
    products: many(products),
    invoiceItemTaxes: many(invoiceItemTaxes),
    invoiceTaxes: many(invoiceTaxes),
  }),
);
