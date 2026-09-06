"use client";

import {
  ArrowLeft,
  Ban,
  Check,
  CheckCircle,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  FileText,
  MoreHorizontal,
  Pencil,
  Send,
  ShieldOff,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog, Detail } from "@/components/detail";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { formatMoney, formatPostalCityLine } from "@/lib/format";
import {
  findCustomer,
  type InvoiceStatus,
  type MockInvoice,
  type MockStatusChange,
  PAYMENT_METHODS,
} from "@/lib/mock-data";
import { computeTotals } from "@/lib/totals";
import { cn } from "@/lib/utils";

const stamp = () => new Date().toISOString().slice(0, 16).replace("T", " ");

/** §4.6 derived overdue: past its due date while still awaiting payment. */
const isOverdue = (invoice: MockInvoice) =>
  invoice.status === "sent" &&
  invoice.dueDate !== null &&
  invoice.dueDate < new Date().toISOString().slice(0, 10);

// ponytail: every export/publish action below needs the server. Until §6 lands
// they say so instead of pretending.
const needsServer = (what: string) => () =>
  toast.add({
    title: `${what} is not wired yet`,
    description: "This lands with the §6 server actions.",
  });

export function InvoiceDetail({ invoice }: { invoice: MockInvoice }) {
  const router = useRouter();
  // ponytail: local until §6.3 mutations land — the actions only move the badge.
  const [status, setStatus] = useState<InvoiceStatus>(
    isOverdue(invoice) ? "overdue" : invoice.status,
  );
  const [history, setHistory] = useState<MockStatusChange[]>(
    invoice.statusHistory,
  );

  const customer = findCustomer(invoice.customerId);
  const { subtotal, tax, discount, total } = computeTotals(invoice);
  const paid = status === "paid" || status === "complete";

  function move(next: InvoiceStatus, paymentMethod?: string) {
    setStatus(next);
    setHistory((entries) => [
      ...entries,
      { status: next, changedAt: stamp(), paymentMethod },
    ]);
    toast.add({
      title: `${invoice.invoiceNumber} marked as ${next}`,
      description: paymentMethod ? `Paid with ${paymentMethod}.` : undefined,
    });
  }

  const address = customer
    ? [
        customer.address,
        formatPostalCityLine(
          customer.city,
          customer.postalCode,
          customer.countryCode,
        ),
        customer.countryCode,
      ]
        .filter(Boolean)
        .join("\n")
    : null;

  const meta = [
    `Tax rate: ${invoice.taxRate}%`,
    `Prices include tax: ${invoice.pricesIncludeTax ? "Yes" : "No"}`,
    `Rounding: ${invoice.roundingMode === "line" ? "Per line" : "On total"}`,
    `Tax mode: ${invoice.taxMode === "line" ? "Per line" : "Invoice total"}`,
  ].join(" · ");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to invoices"
            render={<Link href="/invoices" />}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-semibold">
            Invoice #{invoice.invoiceNumber}
          </h1>
          <StatusBadge status={status} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            render={<Link href={`/invoices/${invoice.id}/edit`} />}
          >
            <Pencil className="size-4" />
            Edit
          </Button>

          {status === "draft" && (
            <Button
              title="Make public and mark as sent"
              onClick={() => move("sent")}
            >
              <Upload className="size-4" />
              Publish
            </Button>
          )}

          {status === "paid" && (
            <Button variant="secondary" onClick={() => move("complete")}>
              <CheckCircle className="size-4" />
              Mark as Complete
            </Button>
          )}

          {(status === "sent" || status === "overdue") && (
            <MarkAsPaid onConfirm={(method) => move("paid", method)} />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="More actions"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={needsServer("Duplicate")}>
                <Copy className="size-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={needsServer("Download XML")}>
                <FileText className="size-4" />
                Download XML
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {(status === "sent" || status === "overdue") && (
                <DropdownMenuItem onClick={() => move("draft")}>
                  <ShieldOff className="size-4" />
                  Unpublish
                </DropdownMenuItem>
              )}
              {status === "paid" && (
                <DropdownMenuItem onClick={() => move("complete")}>
                  <CheckCircle className="size-4" />
                  Mark as Complete
                </DropdownMenuItem>
              )}
              {status === "draft" && (
                <DropdownMenuItem onClick={() => move("sent")}>
                  <Send className="size-4" />
                  Mark as Sent
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {(status === "sent" || status === "overdue") && (
            <ConfirmDialog
              title="Void this invoice?"
              description="A voided invoice stays on record but is no longer payable."
              actionLabel="Void"
              trigger={
                <Button variant="outline" className="text-amber-600">
                  <Ban className="size-4" />
                  Void
                </Button>
              }
              onConfirm={() => move("voided")}
            />
          )}

          {/* ponytail: the spec puts Delete inside More — a dialog trigger nested
              in a menu item fights Base UI, so it sits beside it like on every
              other detail page. */}
          <ConfirmDialog
            title="Delete invoice"
            description="Delete this invoice? This cannot be undone."
            onConfirm={() => {
              toast.add({ title: `${invoice.invoiceNumber} deleted` });
              router.push("/invoices");
            }}
          />
        </div>
      </div>

      <Card className="grid gap-x-8 gap-y-4 p-6 text-sm md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Detail label="Customer" value={invoice.customer} />
          <Detail label="Address" value={address} />
          <Detail label="Issue Date" value={invoice.issueDate} />
          <Detail
            label="Subtotal"
            value={formatMoney(subtotal, invoice.currency)}
          />
          <p className="text-xs text-muted-foreground">{meta}</p>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-semibold">
              {formatMoney(total, invoice.currency)}
            </span>
          </div>
          <Detail label="Payment Terms" value={invoice.paymentTerms} />
          <span className="text-sm text-muted-foreground">
            {invoice.items.length} item(s)
          </span>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={needsServer("View HTML")}
            >
              <FileCode2 className="size-4" />
              View HTML
            </Button>
            <Button size="sm" onClick={needsServer("Download PDF")}>
              <Download className="size-4" />
              Download PDF
            </Button>
            {status !== "draft" && invoice.shareToken && (
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link href={`/public/invoices/${invoice.shareToken}`} />
                }
              >
                <ExternalLink className="size-4" />
                View public link
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Detail label="Email" value={customer?.email ?? null} />
          <Detail label="Due Date" value={invoice.dueDate} />
          <Detail label="Tax" value={formatMoney(tax, invoice.currency)} />
          <Detail
            label="Discount"
            value={discount ? formatMoney(discount, invoice.currency) : null}
          />
          {paid && <Detail label="Paid with" value={invoice.paidWith} />}
        </div>
      </Card>

      <Card className="gap-0 py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="px-4">Description</TableHead>
              <TableHead className="px-4 text-right">Qty</TableHead>
              <TableHead className="px-4 text-right">Price</TableHead>
              <TableHead className="px-4 text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-4 whitespace-pre-wrap">
                  {item.description}
                </TableCell>
                <TableCell className="px-4 text-right">
                  {item.quantity}
                </TableCell>
                <TableCell className="px-4 text-right">
                  {formatMoney(item.unitPrice, invoice.currency)}
                </TableCell>
                <TableCell className="px-4 text-right">
                  {formatMoney(
                    item.quantity * item.unitPrice,
                    invoice.currency,
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Status History</h2>
        <ol className="flex flex-col">
          {history.map((entry, i) => (
            <li
              key={`${entry.status}-${entry.changedAt}`}
              className="flex gap-3"
            >
              {/* The connector is drawn per row, so it centres on the dots at
                  any width and stops at the last one. */}
              <div className="flex flex-col items-center">
                <span className="flex h-6 items-center">
                  <span className="size-2 rounded-full bg-muted-foreground" />
                </span>
                {i < history.length - 1 && (
                  <span className="w-px flex-1 bg-border" />
                )}
              </div>
              <div
                className={cn(
                  "flex min-h-6 flex-wrap items-center gap-2",
                  i < history.length - 1 && "pb-4",
                )}
              >
                <StatusBadge status={entry.status} />
                <span className="text-sm text-muted-foreground">
                  {entry.changedAt}
                  {entry.paymentMethod ? ` · ${entry.paymentMethod}` : ""}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

/** §10.5 split button: the left half marks paid, the chevron picks the method. */
function MarkAsPaid({ onConfirm }: { onConfirm: (method: string) => void }) {
  const [method, setMethod] = useState("");

  return (
    <div className="flex">
      <Button className="rounded-r-none" onClick={() => onConfirm(method)}>
        <Check className="size-4" />
        Mark as Paid
      </Button>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              aria-label="Choose payment method"
              className="rounded-l-none border-l border-primary-foreground/25 px-2"
            />
          }
        >
          <ChevronDown className="size-4" />
        </PopoverTrigger>
        <PopoverContent align="end" className="gap-3">
          <span className="font-medium">Payment Method</span>
          <Input
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder="e.g. Bank Transfer, PayPal"
          />
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((name) => (
              <Button
                key={name}
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => setMethod(name)}
              >
                {name}
              </Button>
            ))}
          </div>
          <Button className="w-full" onClick={() => onConfirm(method)}>
            Mark as Paid
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
