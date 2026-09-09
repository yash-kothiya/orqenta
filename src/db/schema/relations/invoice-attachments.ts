import { relations } from "drizzle-orm";
import { invoiceAttachments, invoices } from "../tables";

export const invoiceAttachmentsRelations = relations(
  invoiceAttachments,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [invoiceAttachments.invoiceId],
      references: [invoices.id],
    }),
  }),
);
