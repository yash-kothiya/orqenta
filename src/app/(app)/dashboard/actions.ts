"use server";

import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { invoices, invoiceStatusHistory } from "@/db/schema/tables";
import { type ActionResult, runAction } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/session";
import { deriveStatus } from "@/lib/invoice-status";

export interface DashboardStats {
  totalInvoices: number;
  totalCustomers: number;
  openInvoices: number;
  totalBilled: string;
  outstanding: string;
  paid: string;
  statusBreakdown: {
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
  };
}

export interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  issueDate: string;
  status: string;
  total: string;
}

export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  return runAction(async () => {
    await requirePermission("invoices", "read");

    const allInvoices = await db.query.invoices.findMany({
      with: {
        customer: true,
        statusHistory: {
          orderBy: desc(invoiceStatusHistory.createdAt),
          limit: 1,
        },
      },
    });

    const invoicesByStatus = {
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      complete: 0,
      voided: 0,
    };

    let totalAmount = 0;
    let paidAmount = 0;
    let outstandingAmount = 0;

    allInvoices.forEach((invoice) => {
      const total = Number(invoice.total);
      totalAmount += total;

      const latestHistory = invoice.statusHistory[0];
      const currentStatus = latestHistory?.status ?? "draft";
      const status = deriveStatus(currentStatus, invoice.dueDate);

      if (status in invoicesByStatus) {
        invoicesByStatus[status as keyof typeof invoicesByStatus]++;
      }

      if (status === "paid") {
        paidAmount += total;
      } else if (status !== "draft" && status !== "voided") {
        outstandingAmount += total;
      }
    });

    const uniqueCustomers = new Set(
      allInvoices.map((inv) => inv.customerId)
    ).size;

    const openCount = allInvoices.filter((inv) => {
      const latestHistory = inv.statusHistory[0];
      const currentStatus = latestHistory?.status ?? "draft";
      const status = deriveStatus(currentStatus, inv.dueDate);
      return status !== "draft" && status !== "paid" && status !== "voided";
    }).length;

    return {
      totalInvoices: allInvoices.length,
      totalCustomers: uniqueCustomers,
      openInvoices: openCount,
      totalBilled: totalAmount.toFixed(2),
      outstanding: outstandingAmount.toFixed(2),
      paid: paidAmount.toFixed(2),
      statusBreakdown: {
        draft: invoicesByStatus.draft,
        sent: invoicesByStatus.sent,
        paid: invoicesByStatus.paid,
        overdue: invoicesByStatus.overdue,
      },
    };
  });
}

export async function getRecentInvoices(
  limit: number = 5,
): Promise<ActionResult<RecentInvoice[]>> {
  return runAction(async () => {
    await requirePermission("invoices", "read");

    const recent = await db.query.invoices.findMany({
      limit,
      orderBy: desc(invoices.issueDate),
      with: {
        customer: true,
        statusHistory: {
          orderBy: desc(invoiceStatusHistory.createdAt),
          limit: 1,
        },
      },
    });

    return recent.map((inv) => {
      const latestHistory = inv.statusHistory[0];
      const currentStatus = latestHistory?.status ?? "draft";
      const status = deriveStatus(currentStatus, inv.dueDate);

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer?.name ?? "Unknown",
        issueDate: inv.issueDate ?? "",
        status,
        total: inv.total,
      };
    });
  });
}
