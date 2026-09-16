"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteCustomer } from "@/app/(app)/customers/actions";
import { ConfirmDialog, Detail } from "@/components/detail";
import { IfPermitted } from "@/components/permission-gated-action";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { unwrap } from "@/lib/action-result";
import { formatPostalCityLine } from "@/lib/format";
import { invalidate } from "@/lib/query-invalidation";
import type { Customer } from "@/lib/types";

export function CustomerDetail({ customer }: { customer: Customer }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const remove = useMutation({
    mutationFn: () => deleteCustomer(customer.id).then(unwrap),
    onSuccess: async () => {
      await invalidate(queryClient, "customers");
      toast.add({ title: `${customer.name} deleted` });
      router.push("/customers");
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Customer {customer.name}</h1>
        <div className="flex gap-2">
          <IfPermitted resource="customers" action="update">
            <Button
              variant="outline"
              render={<Link href={`/customers/${customer.id}/edit`} />}
            >
              <Pencil className="size-4" />
              Edit
            </Button>
          </IfPermitted>
          <IfPermitted resource="customers" action="delete">
            <ConfirmDialog
              title="Delete customer"
              description="Are you sure you want to delete this customer? This cannot be undone."
              onConfirm={() => remove.mutate()}
            />
          </IfPermitted>
        </div>
      </div>

      {remove.error && (
        <Alert variant="destructive">
          <AlertTitle>{remove.error.message}</AlertTitle>
        </Alert>
      )}

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
