"use client";

import { useQuery } from "@tanstack/react-query";
import { SquarePen } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { listInvoices } from "@/app/(app)/invoices/actions";
import { StatusBadge } from "@/components/status-badge";
import { IfPermitted } from "@/components/permission-gated-action";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { compareText, formatMoney } from "@/lib/format";
import { type InvoiceListRow, type InvoiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "sent", label: "Sent" },
  { value: "draft", label: "Draft" },
  { value: "complete", label: "Complete" },
  { value: "paid", label: "Paid" },
  { value: "voided", label: "Voided" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];
type SortKey =
  | "invoiceNumber"
  | "customer"
  | "total"
  | "status"
  | "issueDate"
  | "updatedAt";

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: "invoiceNumber", label: "Invoice No" },
  { key: "customer", label: "Customer" },
  { key: "total", label: "Total" },
  { key: "status", label: "Status" },
  { key: "issueDate", label: "Issue Date", className: "hidden sm:table-cell" },
  {
    key: "updatedAt",
    label: "Updated",
    className: "hidden md:table-cell text-right",
  },
];

function compareRows(a: InvoiceListRow, b: InvoiceListRow, key: SortKey) {
  if (key === "total") {
    const aTotal = Number(a.total ?? 0);
    const bTotal = Number(b.total ?? 0);
    return aTotal - bTotal;
  }
  if (key === "customer") {
    return compareText(a.customer?.name ?? "", b.customer?.name ?? "");
  }
  if (key === "issueDate" || key === "updatedAt") {
    return compareText(String(a[key]), String(b[key]));
  }
  return compareText(String(a[key]), String(b[key]));
}

export function InvoiceList() {
  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("invoiceNumber");
  const [asc, setAsc] = useState(false);

  const {
    data: invoices = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ["invoices", "list"],
    queryFn: async () => {
      try {
        const result = await listInvoices();
        if (!result.ok) {
          console.error("Failed to load invoices:", result.error);
          throw new Error(result.error || "Failed to load invoices");
        }
        return result.data;
      } catch (err) {
        console.error("Invoice list error:", err);
        throw err;
      }
    },
    retry: false,
  });

  const rows = useMemo(() => {
    const filtered =
      filter === "all"
        ? invoices
        : invoices.filter((i) => i.status === (filter as InvoiceStatus));

    // Ties fall back to invoice number, per §10.3.
    return [...filtered].sort((a, b) => {
      const primary = compareRows(a, b, sortKey);
      const ordered = asc ? primary : -primary;
      return ordered || compareText(a.invoiceNumber, b.invoiceNumber);
    });
  }, [filter, sortKey, asc, invoices]);

  const showPaidWith = rows.some((r) => r.paidWith);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setAsc((prev) => !prev);
      return;
    }
    setSortKey(key);
    setAsc(true);
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <Alert variant="destructive">
          <AlertTitle>{error.message}</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <Card className="items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">No invoices found</p>
          <IfPermitted resource="invoices" action="create">
            <Button render={<Link href="/invoices/new" />}>
              Create your first invoice
            </Button>
          </IfPermitted>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header />

      <Card className="flex-row flex-wrap gap-2 px-4 py-3">
        {FILTERS.map(({ value, label }) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "default" : "ghost"}
            className="rounded-full"
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </Card>

      <Card className="gap-0 py-0">
        <Table className="whitespace-nowrap">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {COLUMNS.map(({ key, label, className }) => (
                <TableHead key={key} className={cn("px-4", className)}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-mx-3 font-medium"
                    onClick={() => toggleSort(key)}
                  >
                    {label}
                    {sortKey === key ? (asc ? " ▲" : " ▼") : ""}
                  </Button>
                </TableHead>
              ))}
              {showPaidWith && (
                <TableHead className="hidden px-4 sm:table-cell">
                  Paid with
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length + (showPaidWith ? 1 : 0)}
                  className="py-10 text-center text-muted-foreground"
                >
                  No invoices match this filter
                </TableCell>
              </TableRow>
            ) : (
              rows.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="px-4 font-medium">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    <span className="block text-xs text-muted-foreground sm:hidden">
                      {invoice.issueDate}
                    </span>
                  </TableCell>
                  <TableCell
                    className="max-w-[16rem] truncate px-4"
                    title={invoice.customer?.name ?? ""}
                  >
                    {invoice.customer?.name ?? "—"}
                  </TableCell>
                  <TableCell className="px-4">
                    {formatMoney(invoice.total, invoice.currency)}
                  </TableCell>
                  <TableCell className="px-4">
                    <StatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="hidden px-4 sm:table-cell">
                    {invoice.issueDate}
                  </TableCell>
                  <TableCell className="hidden px-4 text-right text-muted-foreground md:table-cell">
                    {invoice.updatedAt.toISOString().slice(0, 10)}
                  </TableCell>
                  {showPaidWith && (
                    <TableCell className="hidden px-4 sm:table-cell">
                      {invoice.paidWith ?? "—"}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <IfPermitted resource="invoices" action="create">
        <Button
          className="w-full sm:w-auto"
          render={<Link href="/invoices/new" />}
        >
          <SquarePen className="size-4" />
          Create Invoice
        </Button>
      </IfPermitted>
    </div>
  );
}
