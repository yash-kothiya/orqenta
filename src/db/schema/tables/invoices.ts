import {
  boolean,
  date,
  index,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";
import { invoiceStatusEnum, roundingModeEnum } from "../enums";
import { customers } from "./customers";

export const invoices = pgTable(
  "invoices",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("inv")),
    invoiceNumber: text("invoice_number").notNull(),
    customerId: varchar("customer_id", { length: 50 }).references(
      () => customers.id,
    ),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date"),
    currency: text("currency").notNull().default("USD"),
    /** §4.6 — overdue is derived at read time, never stored. */
    status: invoiceStatusEnum("status").notNull().default("draft"),

    subtotal: numeric("subtotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    discountAmount: numeric("discount_amount", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    discountPercentage: numeric("discount_percentage", {
      precision: 6,
      scale: 3,
    })
      .notNull()
      .default("0"),
    taxRate: numeric("tax_rate", { precision: 6, scale: 3 })
      .notNull()
      .default("0"),
    taxAmount: numeric("tax_amount", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),

    pricesIncludeTax: boolean("prices_include_tax").notNull().default(false),
    roundingMode: roundingModeEnum("rounding_mode").notNull().default("line"),

    paymentTerms: text("payment_terms"),
    notes: text("notes"),

    /** §10.16 — the public page is reached by this token, never by id. */
    shareToken: text("share_token").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("invoices_invoice_number_unique").on(table.invoiceNumber),
    uniqueIndex("invoices_share_token_unique").on(table.shareToken),
    index("invoices_customer_id_idx").on(table.customerId),
    index("invoices_status_idx").on(table.status),
    index("invoices_status_due_date_idx").on(table.status, table.dueDate),
    index("invoices_issue_date_idx").on(table.issueDate),
  ],
);
