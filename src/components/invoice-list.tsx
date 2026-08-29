"use client";

import { SquarePen } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { compareText, formatMoney } from "@/lib/format";
import {
  INVOICES,
  type InvoiceStatus,
  type MockInvoiceRow,
} from "@/lib/mock-data";
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

function compareRows(a: MockInvoiceRow, b: MockInvoiceRow, key: SortKey) {
  if (key === "total") return a.total - b.total;
  return compareText(String(a[key]), String(b[key]));
}

export function InvoiceList() {
  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("invoiceNumber");
  const [asc, setAsc] = useState(false);

  const rows = useMemo(() => {
    const filtered =
      filter === "all"
        ? INVOICES
        : INVOICES.filter((i) => i.status === (filter as InvoiceStatus));

    // Ties fall back to invoice number, per §10.3.
    return [...filtered].sort((a, b) => {
      const primary = compareRows(a, b, sortKey);
      const ordered = asc ? primary : -primary;
      return ordered || compareText(a.invoiceNumber, b.invoiceNumber);
    });
  }, [filter, sortKey, asc]);

  const showPaidWith = rows.some((r) => r.paidWith);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setAsc((prev) => !prev);
      return;
    }
    setSortKey(key);
    setAsc(true);
  }

  if (INVOICES.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <Card className="items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">No invoices found</p>
          <Button render={<Link href="/invoices/new" />}>
            Create your first invoice
          </Button>
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
                    title={invoice.customer}
                  >
                    {invoice.customer}
                  </TableCell>
                  <TableCell className="px-4">
                    {formatMoney(invoice.total)}
                  </TableCell>
                  <TableCell className="px-4">
                    <StatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="hidden px-4 sm:table-cell">
                    {invoice.issueDate}
                  </TableCell>
                  <TableCell className="hidden px-4 text-right text-muted-foreground md:table-cell">
                    {invoice.updatedAt}
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
      <Button
        className="w-full sm:w-auto"
        render={<Link href="/invoices/new" />}
      >
        <SquarePen className="size-4" />
        Create Invoice
      </Button>
    </div>
  );
}
