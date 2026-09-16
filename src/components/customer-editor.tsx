"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as z from "zod";
import {
  type CustomerInput,
  createCustomer,
  updateCustomer,
} from "@/app/(app)/customers/actions";
import { IfPermitted } from "@/components/permission-gated-action";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { unwrap } from "@/lib/action-result";
import { invalidate } from "@/lib/query-invalidation";
import type { Customer } from "@/lib/types";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string(),
  email: z.union([z.literal(""), z.email("Enter a valid email address")]),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  postalCode: z.string(),
  taxId: z.string(),
  countryCode: z
    .string()
    .refine(
      (v) => v === "" || /^[A-Za-z]{2}$/.test(v),
      "Use a two-letter code, e.g. NL",
    ),
});

type CustomerValues = z.infer<typeof customerSchema>;

export function CustomerEditor({ customer }: { customer?: Customer }) {
  const editing = customer !== undefined;
  const router = useRouter();
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (values: CustomerInput) =>
      (customer
        ? updateCustomer(customer.id, values)
        : createCustomer(values)
      ).then(unwrap),
    onSuccess: async (saved) => {
      await invalidate(queryClient, "customers");
      toast.add({ title: editing ? "Customer updated" : "Customer created" });
      router.push(`/customers/${saved.id}`);
    },
  });

  const form = useForm({
    defaultValues: {
      name: customer?.name ?? "",
      contactName: customer?.contactName ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      address: customer?.address ?? "",
      city: customer?.city ?? "",
      postalCode: customer?.postalCode ?? "",
      taxId: customer?.taxId ?? "",
      countryCode: customer?.countryCode ?? "",
    } as CustomerValues,
    validators: { onBlur: customerSchema, onSubmit: customerSchema },
    onSubmit: async ({ value }) => {
      await save.mutateAsync(value).catch(() => {});
    },
  });

  /** Nine near-identical text fields — only name/label/placeholder differ. */
  const textField = (
    name: keyof CustomerValues,
    label: string,
    placeholder?: string,
    type?: string,
  ) => (
    <form.Field name={name}>
      {(field) => {
        const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
        return (
          <Field data-invalid={invalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              type={type}
              placeholder={placeholder}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={invalid}
            />
            {invalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }}
    </form.Field>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">
          {editing ? "Edit Customer" : "Create Customer"}
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={
              <Link
                href={customer ? `/customers/${customer.id}` : "/customers"}
              />
            }
          >
            Cancel
          </Button>
          <IfPermitted
            resource="customers"
            action={editing ? "update" : "create"}
            fallback={
              <Button type="submit" form="customer-form" disabled>
                {editing ? "Save Changes" : "Create Customer"}
              </Button>
            }
          >
            <Button
              type="submit"
              form="customer-form"
              disabled={save.isPending}
            >
              {save.isPending && <Spinner />}
              {editing ? "Save Changes" : "Create Customer"}
            </Button>
          </IfPermitted>
        </div>
      </div>

      <form
        id="customer-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          {save.error && (
            <Alert variant="destructive">
              <AlertTitle>{save.error.message}</AlertTitle>
            </Alert>
          )}

          {textField("name", "Name *", "e.g. Demo Corp")}
          {textField(
            "contactName",
            "Contact Name",
            "Who to address invoices to",
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {textField("email", "Email", "billing@example.com", "email")}
            {textField("phone", "Phone", "+31 20 555 0142")}
          </div>

          <form.Field name="address">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Address</FieldLabel>
                <Textarea
                  id={field.name}
                  name={field.name}
                  rows={3}
                  placeholder="Street and number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {textField("city", "City", "Amsterdam")}
            {textField("postalCode", "Postal Code", "1015 CW")}
          </div>

          {textField("taxId", "Tax ID", "e.g. NL812345678B01")}
          {textField(
            "countryCode",
            "Country Code (ISO alpha-2)",
            "e.g. US, NL, DE",
          )}
        </FieldGroup>
      </form>
    </div>
  );
}
