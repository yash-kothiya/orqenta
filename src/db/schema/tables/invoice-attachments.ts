import { index, integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";
import { invoices } from "./invoices";

export const invoiceAttachments = pgTable(
  "invoice_attachments",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("att")),
    invoiceId: varchar("invoice_id", { length: 50 })
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    filePath: text("file_path").notNull(),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    ...timestamps,
  },
  (table) => [index("invoice_attachments_invoice_id_idx").on(table.invoiceId)],
);
