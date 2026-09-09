import { pgEnum } from "drizzle-orm/pg-core";
import { INVOICE_STATUSES, ROUNDING_MODES } from "@/lib/types";

// §3 already enumerates these for the UI; one list, so the DB enum and the
// pages can never drift apart.
export const invoiceStatusEnum = pgEnum("invoice_status", INVOICE_STATUSES);

export const roundingModeEnum = pgEnum("rounding_mode", ROUNDING_MODES);
