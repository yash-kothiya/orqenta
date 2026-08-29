import Link from "next/link";
import pageMeta from "@/lib/page-meta.json";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const counts = [
  { label: "Invoices", value: "2" },
  { label: "Customers", value: "2" },
  { label: "Open Invoices", value: "1" },
];

const totals = [
  { label: "Total Billed", value: "€325.44" },
  { label: "Outstanding", value: "€15.00" },
  { label: "Paid", value: "€310.44" },
];

const statuses = [
  { label: "Draft", value: "0" },
  { label: "Sent", value: "1" },
  { label: "Paid", value: "1" },
  { label: "Overdue", value: "0" },
];

const invoices = [
  {
    number: "INV-2026-001",
    customer: "Demo corp",
    date: "2026-02-03",
    status: "Sent",
    total: "€15.00",
  },
  {
    number: "INV-2025-001",
    customer: "Casper",
    date: "2025-10-06",
    status: "Paid",
    total: "€310.44",
  },
];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="gap-2 px-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </Card>
  );
}

export const metadata = pageMeta.dashboard;

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {counts.map((s) => (
          <Stat key={s.label} {...s} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {totals.map((s) => (
          <Stat key={s.label} {...s} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statuses.map((s) => (
          <Stat key={s.label} {...s} />
        ))}
      </div>

      <Card className="gap-0 py-0">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold">Recent Invoices</h2>
          <Link href="/invoices" className="text-sm font-medium hover:underline">
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
            {invoices.map((inv) => (
              <TableRow key={inv.number}>
                <TableCell className="pl-5 font-medium">{inv.number}</TableCell>
                <TableCell>{inv.customer}</TableCell>
                <TableCell>{inv.date}</TableCell>
                <TableCell>
                  <Badge variant={inv.status === "Paid" ? "default" : "secondary"}>
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{inv.total}</TableCell>
                <TableCell className="pr-5 text-right">
                  <Link
                    href={`/invoices/${inv.number}`}
                    className="text-sm font-medium hover:underline"
                  >
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
