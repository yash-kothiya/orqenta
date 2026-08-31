"use client";

import { useForm } from "@tanstack/react-form";
import { Save } from "lucide-react";
import Link from "next/link";
import * as z from "zod";
import { type Option, SelectInput } from "@/components/select-input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  type MockProduct,
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  TAX_DEFINITIONS,
  taxLabel,
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
  label: taxLabel(t),
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
  isActive: z.boolean(),
});

type ProductValues = z.infer<typeof productSchema>;

export function ProductEditor({ product }: { product?: MockProduct }) {
  const editing = product !== undefined;

  const form = useForm({
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      unitPrice: product ? String(product.unitPrice) : "0",
      sku: product?.sku ?? "",
      unit: product?.unit ?? "piece",
      category: product?.category ?? "",
      taxDefinitionId: product?.taxDefinitionId ?? "",
      isActive: product?.isActive ?? true,
    } as ProductValues,
    validators: { onBlur: productSchema, onSubmit: productSchema },
    onSubmit: async ({ value }) => {
      // ponytail: no server action yet — §6.3 useMutation replaces this.
      console.log("product payload", value);
      toast.add({
        title: editing ? "Product updated" : "Product validated",
        description: `${value.name} saved. Payload logged to the console.`,
      });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">
          {editing ? "Edit Product" : "New Product"}
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={
              <Link href={product ? `/products/${product.id}` : "/products"} />
            }
          >
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
          {editing && (
            <form.Field name="isActive">
              {(field) => (
                <Field
                  orientation="horizontal"
                  // w-fit: otherwise FieldContent stretches and throws the
                  // switch to the far edge, away from its label.
                  className="w-fit"
                >
                  <FieldContent>
                    <FieldTitle>Active</FieldTitle>
                    <FieldDescription>Available in dropdowns</FieldDescription>
                  </FieldContent>
                  <Switch
                    id={field.name}
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                </Field>
              )}
            </form.Field>
          )}

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
                    placeholder="e.g. Consulting hour"
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
                  placeholder="What this product or service covers"
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
                    placeholder="e.g. SVC-001"
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
