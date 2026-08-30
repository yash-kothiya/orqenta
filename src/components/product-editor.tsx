"use client";

import { useForm } from "@tanstack/react-form";
import { Save } from "lucide-react";
import Link from "next/link";
import * as z from "zod";
import { type Option, SelectInput } from "@/components/select-input";
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
import {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  TAX_DEFINITIONS,
} from "@/lib/mock-data";

const UNIT_OPTIONS: Option[] = PRODUCT_UNITS.map((u) => ({
  value: u.code,
  label: u.name,
}));

const CATEGORY_OPTIONS: Option[] = PRODUCT_CATEGORIES.map((c) => ({
  value: c.code,
  label: c.name,
}));

const TAX_OPTIONS: Option[] = TAX_DEFINITIONS.map((t) => ({
  value: t.id,
  label: `${t.name || t.code || `${t.percent}%`} (${t.percent}%)`,
}));

/** Unit price stays a string so the field is freely typeable (and clearable). */
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  unitPrice: z
    .string()
    .refine((v) => v.trim() !== "", "Unit price is required")
    .refine((v) => Number.isFinite(Number(v)), "Unit price must be a number")
    .refine((v) => Number(v) >= 0, "Unit price must be 0 or more"),
  sku: z.string(),
  unit: z.string(),
  category: z.string(),
  taxDefinitionId: z.string(),
});

type ProductValues = z.infer<typeof productSchema>;

export function ProductEditor() {
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      unitPrice: "0",
      sku: "",
      unit: "piece",
      category: "",
      taxDefinitionId: "",
    } as ProductValues,
    validators: { onBlur: productSchema, onSubmit: productSchema },
    onSubmit: async ({ value }) => {
      // ponytail: no server action yet — §6.3 useMutation replaces this.
      console.log("product payload", value);
      toast.add({
        title: "Product validated",
        description: `${value.name} saved. Payload logged to the console.`,
      });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">New Product</h1>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/products" />}>
            Cancel
          </Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form="product-form" disabled={isSubmitting}>
                <Save className="size-4" />
                Save
              </Button>
            )}
          </form.Subscribe>
        </div>
      </div>

      <form
        id="product-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="name">
            {(field) => {
              const invalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor={field.name}>Name *</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
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

          <form.Field name="description">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                <Textarea
                  id={field.name}
                  name={field.name}
                  rows={3}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="unitPrice">
              {(field) => {
                const invalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>Unit Price *</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min="0"
                      step="0.01"
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

            <form.Field name="sku">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>SKU</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="unit">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Unit</FieldLabel>
                  <SelectInput
                    id={field.name}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    options={UNIT_OPTIONS}
                    placeholder="Select unit"
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="category">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Category</FieldLabel>
                  <SelectInput
                    id={field.name}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    options={CATEGORY_OPTIONS}
                    placeholder="Select category"
                  />
                </Field>
              )}
            </form.Field>
          </div>

          {TAX_OPTIONS.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field name="taxDefinitionId">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Tax Definition</FieldLabel>
                    <SelectInput
                      id={field.name}
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      options={TAX_OPTIONS}
                      placeholder="No default tax"
                    />
                  </Field>
                )}
              </form.Field>
            </div>
          )}
        </FieldGroup>
      </form>
    </div>
  );
}
