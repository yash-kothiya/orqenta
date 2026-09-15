/**
 * §4.5 / §4.6 — what an invoice's status means for reading and for editing.
 *
 * Pure on purpose: the actions, the pages and the renderer all have to agree on
 * whether something is overdue, and none of them should have to ask the
 * database twice to find out.
 */
import type { InvoiceStatus } from "./types";

/** Statuses that stop the clock — an invoice in one of these is never overdue. */
const SETTLED: readonly InvoiceStatus[] = ["paid", "complete", "voided"];

/** §4.6 — an invoice in one of these is retention-protected. */
const PROTECTED: readonly InvoiceStatus[] = [
  "sent",
  "paid",
  "complete",
  "overdue",
];

/** Local calendar day as `YYYY-MM-DD`, to compare against a `date` column. */
export function today(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * §4.5 — `overdue` is never stored. It is the stored status plus a date
 * comparison, computed on every read.
 */
export function deriveStatus(
  status: InvoiceStatus,
  dueDate: string | null,
  now = new Date(),
): InvoiceStatus {
  if (SETTLED.includes(status) || !dueDate) return status;
  // Both sides are YYYY-MM-DD, so this is a date-only comparison.
  return dueDate < today(now) ? "overdue" : status;
}

export const isRetentionProtected = (status: InvoiceStatus) =>
  PROTECTED.includes(status);

/**
 * §4.6 — the permission is necessary but not sufficient; a sent or paid
 * invoice is legally awkward to change, so the override has to be on too.
 */
export function canEditInvoice(
  status: InvoiceStatus,
  allowProtectedChanges: boolean,
) {
  if (status === "draft") return true;
  return allowProtectedChanges && status !== "voided";
}

/** Same rule, except a voided invoice may always be cleared away. */
export function canDeleteInvoice(
  status: InvoiceStatus,
  allowProtectedChanges: boolean,
) {
  if (status === "draft" || status === "voided") return true;
  return allowProtectedChanges;
}
