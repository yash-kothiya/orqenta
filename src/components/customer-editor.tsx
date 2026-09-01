"use client";

import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";

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

export function CustomerEditor() {
  const form = useForm({
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      taxId: "",
      countryCode: "",
    } as CustomerValues,
    validators: { onBlur: customerSchema, onSubmit: customerSchema },
    onSubmit: async ({ value }) => {
      // ponytail: no server action yet — §6.3 useMutation replaces this.
      console.log("customer payload", value);
      toast.add({
        title: "Customer validated",
        description: `${value.name} saved. Payload logged to the console.`,
      });
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
        <h1 className="text-2xl font-semibold">Create Customer</h1>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/customers" />}>
            Cancel
          </Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                form="customer-form"
                disabled={isSubmitting}
              >
                Create Customer
              </Button>
            )}
          </form.Subscribe>
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
