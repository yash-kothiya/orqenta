import { index, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";
import { invoiceStatusEnum } from "../enums";
import { invoices } from "./invoices";

/**
 * Append-only audit trail. The original column is changed_at; here it is the
 * createdAt from the timestamps spread — order by it, never update these rows.
 */
export const invoiceStatusHistory = pgTable(
  "invoice_status_history",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("ish")),
    invoiceId: varchar("invoice_id", { length: 50 })
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    status: invoiceStatusEnum("status").notNull(),
    paymentMethod: text("payment_method"),
    note: text("note"),
    ...timestamps,
  },
  (table) => [
    index("invoice_status_history_invoice_id_created_at_idx").on(
      table.invoiceId,
      table.createdAt,
    ),
  ],
);
