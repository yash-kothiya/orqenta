import { relations } from "drizzle-orm";
import { invoiceStatusHistory, invoices } from "../tables";

export const invoiceStatusHistoryRelations = relations(
  invoiceStatusHistory,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [invoiceStatusHistory.invoiceId],
      references: [invoices.id],
    }),
  }),
);
