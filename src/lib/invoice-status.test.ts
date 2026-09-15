import { describe, expect, it } from "vitest";
import {
  canDeleteInvoice,
  canEditInvoice,
  deriveStatus,
  isRetentionProtected,
  today,
} from "./invoice-status";

const NOW = new Date(2026, 8, 10); // 10 September 2026, local time

describe("today", () => {
  it("is the local calendar day, not UTC", () => {
    // 23:30 local on the 10th is the 11th in UTC; the date column is local.
    expect(today(new Date(2026, 8, 10, 23, 30))).toBe("2026-09-10");
    expect(today(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("deriveStatus", () => {
  it("calls a past due date overdue", () => {
    expect(deriveStatus("sent", "2026-09-09", NOW)).toBe("overdue");
  });

  it("leaves today alone — due today is not yet late", () => {
    expect(deriveStatus("sent", "2026-09-10", NOW)).toBe("sent");
  });

  it("leaves a future due date alone", () => {
    expect(deriveStatus("sent", "2026-09-11", NOW)).toBe("sent");
  });

  it("never overrides a settled invoice", () => {
    for (const status of ["paid", "complete", "voided"] as const) {
      expect(deriveStatus(status, "2020-01-01", NOW)).toBe(status);
    }
  });

  it("leaves a draft with no due date alone", () => {
    expect(deriveStatus("draft", null, NOW)).toBe("draft");
  });

  it("can make a draft overdue, since only settled statuses are exempt", () => {
    expect(deriveStatus("draft", "2026-09-01", NOW)).toBe("overdue");
  });
});

describe("retention protection", () => {
  it("protects everything but drafts and voided invoices", () => {
    expect(isRetentionProtected("draft")).toBe(false);
    expect(isRetentionProtected("voided")).toBe(false);
    for (const status of ["sent", "paid", "complete", "overdue"] as const) {
      expect(isRetentionProtected(status)).toBe(true);
    }
  });

  it("always lets a draft be edited or deleted", () => {
    expect(canEditInvoice("draft", false)).toBe(true);
    expect(canDeleteInvoice("draft", false)).toBe(true);
  });

  it("refuses a sent invoice until the override is on", () => {
    expect(canEditInvoice("sent", false)).toBe(false);
    expect(canEditInvoice("sent", true)).toBe(true);
    expect(canDeleteInvoice("paid", false)).toBe(false);
    expect(canDeleteInvoice("paid", true)).toBe(true);
  });

  it("never edits a voided invoice, even with the override on", () => {
    expect(canEditInvoice("voided", true)).toBe(false);
  });

  it("always deletes a voided invoice, override or not", () => {
    expect(canDeleteInvoice("voided", false)).toBe(true);
  });
});
