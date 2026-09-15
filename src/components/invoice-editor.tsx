"use client";

import { useQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Plus, Save, X } from "lucide-react";
import Link from "next/link";
import * as z from "zod";
import { getInvoice } from "@/app/(app)/invoices/actions";
import { listCustomers } from "@/app/(app)/customers/actions";
import { listProducts } from "@/app/(app)/products/actions";
import { listTaxDefinitions } from "@/app/(app)/settings/actions";
import { DatePicker } from "@/components/date-picker";
import { type Option, SelectInput } from "@/components/select-input";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/format";
import {
  INVOICE_STATUSES,
  type Customer,
  type InvoiceWithDetails,
  type Product,
  type TaxDefinition,
} from "@/lib/types";
import { computeTotals } from "@/lib/totals";

const UNITS = ["piece", "hour", "day", "month", "lump_sum"];
const NEXT_INVOICE_NUMBER = "2025-001";

const STATUS_OPTIONS: Option[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "complete", label: "Complete" },
  { value: "overdue", label: "Overdue" },
  { value: "voided", label: "Voided" },
];


const UNIT_OPTIONS: Option[] = UNITS.map((u) => ({ value: u, label: u }));

// Define within component since options are created from props

const TAX_MODE_OPTIONS: Option[] = [
  { value: "invoice", label: "Invoice total" },
  { value: "line", label: "Per line" },
];

const YES_NO_OPTIONS: Option[] = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
];

const ROUNDING_OPTIONS: Option[] = [
  { value: "line", label: "Round per line" },
  { value: "total", label: "Round on total" },
];

/**
 * Item-row column widths, sized to the widest content each column holds (the
 * unit column has to fit "lump_sum"). Shared by the header strip and the rows so
 * the two stay aligned — only applied at `lg`, where the row becomes horizontal.
 */
const COL = {
  product: "lg:w-44",
  description: "lg:min-w-0 lg:flex-1",
  quantity: "lg:w-20",
  unit: "lg:w-32",
  price: "lg:w-28",
  tax: "lg:w-20",
  notes: "lg:w-40",
  remove: "lg:w-8",
};

/** Numeric inputs stay strings so the field is freely typeable (and clearable). */
const numeric = (label: string) =>
  z
    .string()
    .refine((v) => v.trim() !== "", `${label} is required`)
    .refine((v) => Number.isFinite(Number(v)), `${label} must be a number`)
    .refine((v) => Number(v) >= 0, `${label} must be 0 or more`);

const itemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  description: z.string().min(1, "Description is required"),
  quantity: numeric("Quantity"),
  unit: z.string(),
  unitPrice: numeric("Price"),
  taxPercent: numeric("Tax %"),
  notes: z.string(),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  invoiceNumber: z.string(),
  currency: z.string().min(1, "Currency is required"),
  status: z.enum(INVOICE_STATUSES),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string(),
  taxMode: z.enum(["invoice", "line"]),
  taxRate: numeric("Tax rate"),
  pricesIncludeTax: z.enum(["no", "yes"]),
  roundingMode: z.enum(["line", "total"]),
  paymentTerms: z.string(),
  notes: z.string(),
  items: z.array(itemSchema).min(1, "Add at least one item"),
});

// Numeric inputs stay strings in form state, so this isn't `z.input<typeof …>`.
type ItemValues = {
  /** Client-only row key so removing a row doesn't shuffle React state. */
  id: string;
  productId: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  taxPercent: string;
  notes: string;
};

type InvoiceValues = {
  customerId: string;
  invoiceNumber: string;
  currency: string;
  status: (typeof INVOICE_STATUSES)[number];
  issueDate: string;
  dueDate: string;
  taxMode: "invoice" | "line";
  taxRate: string;
  pricesIncludeTax: "no" | "yes";
  roundingMode: "line" | "total";
  paymentTerms: string;
  notes: string;
  items: ItemValues[];
};

const emptyItem = (): ItemValues => ({
  id: crypto.randomUUID(),
  productId: "",
  description: "",
  quantity: "1",
  unit: "",
  unitPrice: "0",
  taxPercent: "0",
  notes: "",
});

/**
 * The `lg` column-header strip is hidden on mobile, where the row stacks — so
 * each control grows a visible label there. `aria-hidden` because the control
 * already carries an aria-label at every breakpoint.
 */
function RowField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Field className={className}>
      <FieldLabel aria-hidden className="lg:hidden">
        {label}
      </FieldLabel>
      {children}
    </Field>
  );
}

/** Fixtures hold numbers; the form holds strings so the inputs stay clearable. */
const itemValues = (item: any): ItemValues => ({
  id: item.id,
  productId: item.productId ?? "",
  description: item.description,
  quantity: String(item.quantity),
  unit: item.unit ?? "",
  unitPrice: String(item.unitPrice),
  taxPercent: String(item.taxPercent),
  notes: item.notes ?? "",
});

export function InvoiceEditor({ invoiceId }: { invoiceId?: string } = {}) {
  const editing = invoiceId !== undefined;

  const {
    data: invoice,
    isPending: invoicePending,
    error: invoiceError,
  } = useQuery({
    queryKey: ["invoices", invoiceId],
    queryFn: async () => {
      try {
        const result = await getInvoice(invoiceId!);
        if (!result.ok) throw new Error(result.error || "Failed to load invoice");
        if (!result.data) throw new Error("Invoice not found");
        return result.data;
      } catch (err) {
        console.error("Failed to load invoice for editing:", err);
        throw err;
      }
    },
    enabled: editing,
    retry: false,
  });

  const {
    data: customers = [],
    isPending: customersPending,
    error: customersError,
  } = useQuery({
    queryKey: ["customers", "list"],
    queryFn: async () => {
      try {
        const result = await listCustomers();
        if (!result.ok) throw new Error(result.error);
        return result.data;
      } catch (err) {
        console.error("Failed to load customers:", err);
        throw err;
      }
    },
    retry: false,
  });

  const {
    data: products = [],
    isPending: productsPending,
    error: productsError,
  } = useQuery({
    queryKey: ["products", "list"],
    queryFn: async () => {
      try {
        const result = await listProducts();
        if (!result.ok) throw new Error(result.error);
        return result.data;
      } catch (err) {
        console.error("Failed to load products:", err);
        throw err;
      }
    },
    retry: false,
  });

  const {
    data: taxDefinitions = [],
    isPending: taxDefsPending,
    error: taxDefsError,
  } = useQuery({
    queryKey: ["tax_definitions", "list"],
    queryFn: async () => {
      try {
        const result = await listTaxDefinitions();
        if (!result.ok) throw new Error(result.error);
        return result.data;
      } catch (err) {
        console.error("Failed to load tax definitions:", err);
        throw err;
      }
    },
    retry: false,
  });

  const isLoading = invoicePending || customersPending || productsPending || taxDefsPending;

  // Show error only if we have errors and no data at all
  if ((customersError || productsError || taxDefsError) && customers.length === 0 && products.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Failed to load form data - please refresh the page</AlertTitle>
      </Alert>
    );
  }

  // For new invoices, show form immediately even while loading dropdown data
  // For editing, wait for invoice data to load
  if (editing && invoicePending) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  // Create options from data
  const customerOptions: Option[] = customers.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const productOptions: Option[] = products.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const invData = invoice ?? ({} as InvoiceWithDetails);

  const form = useForm({
    defaultValues: {
      customerId: invData?.customerId ?? "",
      invoiceNumber: (invData?.invoiceNumber as string) ?? NEXT_INVOICE_NUMBER,
      currency: invData?.currency ?? "EUR",
      status: (invData?.status as any) ?? "draft",
      issueDate: (invData?.issueDate as string) ?? new Date().toISOString().slice(0, 10),
      dueDate: (invData?.dueDate as string) ?? "",
      taxMode: ("invoice" as "invoice" | "line"),
      taxRate: String(invData?.taxRate ?? 0),
      pricesIncludeTax: (invData?.pricesIncludeTax ?? false) ? "yes" : "no",
      roundingMode: ((invData?.roundingMode ?? "line") as "line" | "total"),
      paymentTerms: (invData?.paymentTerms ?? "") as string,
      notes: (invData?.notes ?? "") as string,
      items: invData?.items ? invData.items.map(itemValues) : [emptyItem()],
    } as InvoiceValues,
    validators: { onBlur: invoiceSchema, onSubmit: invoiceSchema },
    onSubmit: async ({ value }) => {
      // ponytail: no server action yet — §6.3 useMutation replaces this.
      console.log("invoice payload", value);
      toast.add({
        title: editing ? "Invoice updated" : "Invoice validated",
        description: `${value.items.length} item(s), ${formatMoney(
          computeTotals(value).total,
          value.currency,
        )} total. Payload logged to the console.`,
      });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">
          {editing
            ? `Edit Invoice #${invData.invoiceNumber}`
            : "Create Invoice"}
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={
              <Link href={invData?.id ? `/invoices/${invData.id}` : "/invoices"} />
            }
          >
            Cancel
          </Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form="invoice-form" disabled={isSubmitting}>
                <Save className="size-4" />
                Save
              </Button>
            )}
          </form.Subscribe>
        </div>
      </div>

      <form
        id="invoice-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          {/* Row 1 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <form.Field name="customerId">
              {(field) => {
                const invalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>Customer *</FieldLabel>
                    <SelectInput
                      id={field.name}
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      options={customerOptions}
                      placeholder="Select customer"
                      invalid={invalid}
                    />
                    {invalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="invoiceNumber">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Invoice Number</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. INV-2025-001"
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="currency">
              {(field) => {
                const invalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>Currency</FieldLabel>
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

            <form.Field name="status">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                  <SelectInput
                    id={field.name}
                    value={field.state.value}
                    onValueChange={(v) =>
                      field.handleChange(v as InvoiceValues["status"])
                    }
                    options={STATUS_OPTIONS}
                  />
                </Field>
              )}
            </form.Field>
          </div>

          {/* Row 2 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <form.Field name="issueDate">
              {(field) => {
                const invalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>Issue Date *</FieldLabel>
                    <DatePicker
                      id={field.name}
                      value={field.state.value}
                      onChange={field.handleChange}
                      onBlur={field.handleBlur}
                      placeholder="Pick an issue date"
                      invalid={invalid}
                    />
                    {invalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="dueDate">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Due Date</FieldLabel>
                  <DatePicker
                    id={field.name}
                    value={field.state.value}
                    onChange={field.handleChange}
                    onBlur={field.handleBlur}
                    placeholder="No due date"
                  />
                </Field>
              )}
            </form.Field>
          </div>

          {/* Items */}
          <form.Subscribe selector={(s) => s.values.taxMode}>
            {(taxMode) => (
              <FieldSet>
                <div className="flex items-center justify-between">
                  <FieldLegend variant="label">Items *</FieldLegend>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.pushFieldValue("items", emptyItem())}
                  >
                    <Plus className="size-4" />
                    Add item
                  </Button>
                </div>

                <div className="hidden gap-2 px-1 text-xs opacity-60 lg:flex">
                  <span className={COL.product}>Product</span>
                  <span className={COL.description}>Description</span>
                  <span className={COL.quantity}>Quantity</span>
                  <span className={COL.unit}>Unit</span>
                  <span className={COL.price}>Price</span>
                  {taxMode === "line" && <span className={COL.tax}>Tax %</span>}
                  <span className={COL.notes}>Notes</span>
                  <span className={COL.remove} />
                </div>

                <form.Field name="items" mode="array">
                  {(itemsField) => (
                    <div className="flex flex-col gap-3">
                      {itemsField.state.value.map((item, i) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-2 lg:flex-row"
                        >
                          <form.Field name={`items[${i}].productId`}>
                            {(field) => (
                              <RowField label="Product" className={COL.product}>
                                <SelectInput
                                  ariaLabel="Product"
                                  placeholder="Select product"
                                  value={field.state.value}
                                  options={productOptions}
                                  onValueChange={(id) => {
                                    field.handleChange(id);
                                    const product = products.find(
                                      (p) => p.id === id,
                                    );
                                    if (!product) return;
                                    form.setFieldValue(
                                      `items[${i}].description`,
                                      product.name,
                                    );
                                    form.setFieldValue(
                                      `items[${i}].unitPrice`,
                                      String(product.unitPrice),
                                    );
                                    form.setFieldValue(
                                      `items[${i}].unit`,
                                      product.unit ?? "",
                                    );
                                  }}
                                />
                              </RowField>
                            )}
                          </form.Field>

                          <form.Field name={`items[${i}].description`}>
                            {(field) => {
                              const invalid =
                                field.state.meta.isTouched &&
                                !field.state.meta.isValid;
                              return (
                                <Field
                                  className={COL.description}
                                  data-invalid={invalid}
                                >
                                  <FieldLabel aria-hidden className="lg:hidden">
                                    Description
                                  </FieldLabel>
                                  <Input
                                    aria-label="Description"
                                    placeholder="Description"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                      field.handleChange(e.target.value)
                                    }
                                    aria-invalid={invalid}
                                  />
                                  {invalid && (
                                    <FieldError
                                      errors={field.state.meta.errors}
                                    />
                                  )}
                                </Field>
                              );
                            }}
                          </form.Field>

                          <form.Field name={`items[${i}].quantity`}>
                            {(field) => (
                              <RowField
                                label="Quantity"
                                className={COL.quantity}
                              >
                                <Input
                                  aria-label="Quantity"
                                  type="number"
                                  min={0}
                                  step="any"
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(e) =>
                                    field.handleChange(e.target.value)
                                  }
                                />
                              </RowField>
                            )}
                          </form.Field>

                          <form.Field name={`items[${i}].unit`}>
                            {(field) => (
                              <RowField label="Unit" className={COL.unit}>
                                <SelectInput
                                  ariaLabel="Unit"
                                  placeholder="Unit"
                                  value={field.state.value}
                                  options={UNIT_OPTIONS}
                                  onValueChange={field.handleChange}
                                />
                              </RowField>
                            )}
                          </form.Field>

                          <form.Field name={`items[${i}].unitPrice`}>
                            {(field) => (
                              <RowField label="Price" className={COL.price}>
                                <Input
                                  aria-label="Unit price"
                                  type="number"
                                  min={0}
                                  step="any"
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(e) =>
                                    field.handleChange(e.target.value)
                                  }
                                />
                              </RowField>
                            )}
                          </form.Field>

                          {taxMode === "line" && (
                            <form.Field name={`items[${i}].taxPercent`}>
                              {(field) => (
                                <RowField label="Tax %" className={COL.tax}>
                                  <Input
                                    aria-label="Tax percent"
                                    type="number"
                                    min={0}
                                    step="any"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                      field.handleChange(e.target.value)
                                    }
                                  />
                                </RowField>
                              )}
                            </form.Field>
                          )}

                          <form.Field name={`items[${i}].notes`}>
                            {(field) => (
                              <RowField label="Notes" className={COL.notes}>
                                <Input
                                  aria-label="Notes"
                                  placeholder="Notes"
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(e) =>
                                    field.handleChange(e.target.value)
                                  }
                                />
                              </RowField>
                            )}
                          </form.Field>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Remove item"
                            disabled={itemsField.state.value.length === 1}
                            onClick={() => itemsField.removeValue(i)}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      ))}
                      {!itemsField.state.meta.isValid && (
                        <FieldError errors={itemsField.state.meta.errors} />
                      )}
                    </div>
                  )}
                </form.Field>
              </FieldSet>
            )}
          </form.Subscribe>

          {/* Live totals */}
          <form.Subscribe selector={(s) => s.values}>
            {(values) => {
              const { subtotal, tax, total } = computeTotals(values);
              return (
                <div className="ml-auto flex w-full flex-col gap-2 sm:w-48">
                  <TotalRow
                    label="Subtotal"
                    value={formatMoney(subtotal, values.currency)}
                  />
                  {tax > 0 && (
                    <TotalRow
                      label="Tax"
                      value={formatMoney(tax, values.currency)}
                    />
                  )}
                  <TotalRow
                    label="Total"
                    value={formatMoney(total, values.currency)}
                    bold
                  />
                </div>
              );
            }}
          </form.Subscribe>

          {/* Row 6 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <form.Field name="taxMode">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Tax Mode</FieldLabel>
                  <SelectInput
                    id={field.name}
                    value={field.state.value}
                    onValueChange={(v) =>
                      field.handleChange(v as "invoice" | "line")
                    }
                    options={TAX_MODE_OPTIONS}
                  />
                </Field>
              )}
            </form.Field>

            <form.Subscribe selector={(s) => s.values.taxMode}>
              {(taxMode) =>
                taxMode === "invoice" ? (
                  <form.Field name="taxRate">
                    {(field) => {
                      const invalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={invalid}>
                          <FieldLabel htmlFor={field.name}>
                            Tax Rate (%)
                          </FieldLabel>
                          <Input
                            id={field.name}
                            type="number"
                            min={0}
                            step="any"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={invalid}
                          />
                          {invalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>
                ) : null
              }
            </form.Subscribe>

            <form.Field name="pricesIncludeTax">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Prices include tax?
                  </FieldLabel>
                  <SelectInput
                    id={field.name}
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v as "no" | "yes")}
                    options={YES_NO_OPTIONS}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="roundingMode">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Rounding mode</FieldLabel>
                  <SelectInput
                    id={field.name}
                    value={field.state.value}
                    onValueChange={(v) =>
                      field.handleChange(v as "line" | "total")
                    }
                    options={ROUNDING_OPTIONS}
                  />
                </Field>
              )}
            </form.Field>
          </div>

          {/* Row 7 */}
          <div className="grid gap-4 md:grid-cols-2">
            <form.Field name="paymentTerms">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Payment Terms</FieldLabel>
                  <Textarea
                    id={field.name}
                    className="h-24"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="notes">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Notes</FieldLabel>
                  <Textarea
                    id={field.name}
                    className="h-24"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}

function TotalRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={bold ? "text-lg font-semibold" : "text-sm"}>
        {value}
      </span>
    </div>
  );
}
