import { relations } from "drizzle-orm";
import { customers, invoices } from "../tables";

export const customersRelations = relations(customers, ({ many }) => ({
  invoices: many(invoices),
}));
