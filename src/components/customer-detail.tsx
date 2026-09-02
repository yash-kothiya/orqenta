"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeleteConfirm, Detail } from "@/components/detail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { formatPostalCityLine } from "@/lib/format";
import type { MockCustomer } from "@/lib/mock-data";

export function CustomerDetail({ customer }: { customer: MockCustomer }) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Customer {customer.name}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={<Link href={`/customers/${customer.id}/edit`} />}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
          <DeleteConfirm
            title="Delete customer"
            description="Are you sure you want to delete this customer? This cannot be undone."
            onConfirm={() => {
              // ponytail: no mutation yet — §6.3 replaces this with the delete action.
              toast.add({ title: `${customer.name} deleted` });
              router.push("/customers");
            }}
          />
        </div>
      </div>

      <Card className="grid gap-4 p-6 sm:grid-cols-2">
        <Detail label="Name" value={customer.name} />
        <Detail label="Contact Name" value={customer.contactName} />
        <Detail label="Email" value={customer.email} />
        <Detail label="Phone" value={customer.phone} />
        <Detail label="Address" value={customer.address} />
        <Detail
          label="City / Postal Code"
          value={formatPostalCityLine(
            customer.city,
            customer.postalCode,
            customer.countryCode,
          )}
        />
        <Detail label="Tax ID" value={customer.taxId} />
        <Detail label="Country Code" value={customer.countryCode} />
      </Card>
    </div>
  );
}
