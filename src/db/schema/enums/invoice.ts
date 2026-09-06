import { pgEnum } from "drizzle-orm/pg-core";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "complete",
  "paid",
  "overdue",
  "voided",
]);

export const roundingModeEnum = pgEnum("rounding_mode", ["line", "total"]);
