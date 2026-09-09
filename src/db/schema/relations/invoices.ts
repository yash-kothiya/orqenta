import { relations } from "drizzle-orm";
import {
  customers,
  invoiceAttachments,
  invoiceItems,
  invoiceStatusHistory,
  invoices,
  invoiceTaxes,
} from "../tables";

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  items: many(invoiceItems),
  taxes: many(invoiceTaxes),
  statusHistory: many(invoiceStatusHistory),
  attachments: many(invoiceAttachments),
}));
