"use client";

import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { listCustomers } from "@/app/(app)/customers/actions";
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
import { unwrap } from "@/lib/action-result";
import { formatPostalCityLine } from "@/lib/format";

export function CustomerList() {
  const {
    data: customers = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ["customers", "list"],
    queryFn: () => listCustomers().then(unwrap),
  });

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

  if (customers.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <Card className="items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">No customers yet.</p>
          <IfPermitted resource="customers" action="create">
            <Button render={<Link href="/customers/new" />}>
              Create your first customer
            </Button>
          </IfPermitted>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header />

      {/* Mobile: one card per customer. */}
      <div className="flex flex-col gap-3 md:hidden">
        {customers.map((customer) => (
          <Link key={customer.id} href={`/customers/${customer.id}`}>
            <Card className="gap-1 px-4 py-3">
              <span className="font-semibold">{customer.name}</span>
              <span className="text-sm text-muted-foreground">
                {customer.email ?? "—"}
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="hidden gap-0 py-0 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="px-4">Name</TableHead>
              <TableHead className="px-4">Contact Name</TableHead>
              <TableHead className="px-4">Address</TableHead>
              <TableHead className="px-4">City / Postal Code</TableHead>
              <TableHead className="px-4">Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id} className="even:bg-muted/30">
                <TableCell className="px-4 font-medium">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="hover:underline"
                  >
                    {customer.name}
                  </Link>
                </TableCell>
                <TableCell className="px-4">
                  {customer.contactName ?? "—"}
                </TableCell>
                <TableCell
                  className="max-w-[16rem] truncate px-4 text-muted-foreground"
                  title={customer.address ?? undefined}
                >
                  {customer.address ?? "—"}
                </TableCell>
                <TableCell className="px-4">
                  {formatPostalCityLine(
                    customer.city,
                    customer.postalCode,
                    customer.countryCode,
                  ) || "—"}
                </TableCell>
                <TableCell className="px-4 text-muted-foreground">
                  {customer.email ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold">Customers</h1>
      <IfPermitted resource="customers" action="create">
        <Button
          className="w-full sm:w-auto"
          render={<Link href="/customers/new" />}
        >
          <UserPlus className="size-4" />
          New Customer
        </Button>
      </IfPermitted>
    </div>
  );
}
