"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  getDashboardStats,
  getRecentInvoices,
  type DashboardStats,
  type RecentInvoice,
} from "@/app/(app)/dashboard/actions";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="gap-2 px-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <Card className="gap-2 px-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
    </Card>
  );
}

export function Dashboard() {
  const {
    data: stats,
    isPending: statsPending,
    error: statsError,
  } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => getDashboardStats().then((r) => {
      if (!r.ok) throw new Error(r.error);
      return r.data;
    }),
    retry: false,
  });

  const {
    data: recentInvoices = [],
    isPending: invoicesPending,
    error: invoicesError,
  } = useQuery({
    queryKey: ["dashboard", "recent-invoices"],
    queryFn: () => getRecentInvoices(5).then((r) => {
      if (!r.ok) throw new Error(r.error);
      return r.data;
    }),
    retry: false,
  });

  if (statsError || invoicesError) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Alert variant="destructive">
          <AlertTitle>
            {statsError?.message || invoicesError?.message || "Failed to load dashboard"}
          </AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Counts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statsPending ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <Stat label="Invoices" value={stats?.totalInvoices.toString() ?? "0"} />
            <Stat label="Customers" value={stats?.totalCustomers.toString() ?? "0"} />
            <Stat label="Open Invoices" value={stats?.openInvoices.toString() ?? "0"} />
          </>
        )}
      </div>

      {/* Financial Totals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statsPending ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <Stat label="Total Billed" value={formatMoney(stats?.totalBilled ?? "0", "EUR")} />
            <Stat label="Outstanding" value={formatMoney(stats?.outstanding ?? "0", "EUR")} />
            <Stat label="Paid" value={formatMoney(stats?.paid ?? "0", "EUR")} />
          </>
        )}
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsPending ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <Stat label="Draft" value={stats?.statusBreakdown.draft.toString() ?? "0"} />
            <Stat label="Sent" value={stats?.statusBreakdown.sent.toString() ?? "0"} />
            <Stat label="Paid" value={stats?.statusBreakdown.paid.toString() ?? "0"} />
            <Stat label="Overdue" value={stats?.statusBreakdown.overdue.toString() ?? "0"} />
          </>
        )}
      </div>

      {/* Recent Invoices */}
      <Card className="gap-0 py-0">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold">Recent Invoices</h2>
          <Link
            href="/invoices"
            className="text-sm font-medium hover:underline"
          >
            View all
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="pr-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoicesPending ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-5">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="pr-5">
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                </TableRow>
              ))
            ) : recentInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No invoices yet
                </TableCell>
              </TableRow>
            ) : (
              recentInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="pl-5 font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell>{inv.customerName}</TableCell>
                  <TableCell>{inv.issueDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inv.status === "paid"
                          ? "default"
                          : inv.status === "draft"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(inv.total, "EUR")}</TableCell>
                  <TableCell className="pr-5 text-right">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
