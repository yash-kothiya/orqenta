/**
 * §3 — the vocabulary the pages, actions and templates all speak.
 *
 * Row shapes are inferred from the Drizzle tables instead of restated, so a
 * column rename is a type error here rather than a runtime surprise. Those
 * imports are type-only, so nothing from `@/db` reaches a client bundle.
 */
import type {
  customers,
  invoiceAttachments,
  invoiceItems,
  invoiceItemTaxes,
  invoiceStatusHistory,
  invoices,
  invoiceTaxes,
  productCategories,
  products,
  productUnits,
  settings,
  taxDefinitions,
  templates,
  userPermissions,
  users,
} from "@/db/schema/tables";
import type { Action, Resource } from "./permissions";

export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "complete",
  "paid",
  "overdue",
  "voided",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

/** §4.6 — an invoice in one of these states is retention-protected. */
export const PROTECTED_STATUSES: readonly InvoiceStatus[] = [
  "sent",
  "paid",
  "complete",
  "overdue",
];

/** §4.2 vs §4.3 — round each line, or round the invoice once at the end. */
export const ROUNDING_MODES = ["line", "total"] as const;
export type RoundingMode = (typeof ROUNDING_MODES)[number];

/** One rate for the whole invoice, or a rate per line. */
export const TAX_MODES = ["invoice", "line"] as const;
export type TaxMode = (typeof TAX_MODES)[number];

export const TEMPLATE_TYPES = ["builtin", "local", "remote"] as const;
export type TemplateType = (typeof TEMPLATE_TYPES)[number];

// The permission grid (§10.13) is the one place these lists live; re-exported
// here so `@/lib/types` stays the single import for the domain vocabulary.
export { ACTIONS, RESOURCE_ACTIONS, RESOURCES } from "./permissions";
export type { Action, Resource };

export type Setting = typeof settings.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type TaxDefinition = typeof taxDefinitions.$inferSelect;
export type ProductCategory = typeof productCategories.$inferSelect;
export type ProductUnit = typeof productUnits.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InvoiceItemTax = typeof invoiceItemTaxes.$inferSelect;
export type InvoiceTax = typeof invoiceTaxes.$inferSelect;
export type InvoiceStatusChange = typeof invoiceStatusHistory.$inferSelect;
export type InvoiceAttachment = typeof invoiceAttachments.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type User = typeof users.$inferSelect;
export type UserPermission = typeof userPermissions.$inferSelect;

// Insert shapes for the entities §10 has a form for; the rest are written by
// the seed or by cascade, and infer their input at the call site.
export type NewCustomer = typeof customers.$inferInsert;
export type NewProduct = typeof products.$inferInsert;
export type NewInvoice = typeof invoices.$inferInsert;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
export type NewTaxDefinition = typeof taxDefinitions.$inferInsert;
export type NewTemplate = typeof templates.$inferInsert;
export type NewUser = typeof users.$inferInsert;

/** What `getInvoice` returns — everything the detail page and the renderer read. */
export type InvoiceWithDetails = Invoice & {
  customer: Customer | null;
  items: (InvoiceItem & { taxes: InvoiceItemTax[] })[];
  taxes: InvoiceTax[];
  statusHistory: InvoiceStatusChange[];
  /** §4.5 — `paymentMethod` off the most recent `paid` history row. */
  paidWith?: string | null;
};

/**
 * One row of `listInvoices`. `status` is already derived (§4.5) and the money
 * columns stay the strings drizzle returns for `numeric`.
 */
export type InvoiceListRow = Invoice & {
  customer: Pick<Customer, "id" | "name"> | null;
  paidWith?: string | null;
};

export interface SessionUser {
  id: string;
  username: string;
  email?: string | null;
  displayName?: string | null;
  isAdmin: boolean;
  isActive: boolean;
  permissions: { resource: Resource; action: Action }[];
}

export function hasPermission(
  user: SessionUser | null,
  resource: string,
  action: string,
): boolean {
  if (!user) return false;
  if (user.isAdmin) return true; // §5 — admins bypass every check
  return user.permissions.some(
    (p) => p.resource === resource && p.action === action,
  );
}
