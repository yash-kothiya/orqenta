// ponytail: UI-only fixtures. Delete this file when the §6 server actions land.

// Re-exported so the fixture consumers keep one import; the list lives in §3.
export { INVOICE_STATUSES, type InvoiceStatus } from "./types";

import type { InvoiceStatus } from "./types";

export type MockCustomer = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  countryCode: string | null;
  taxId: string | null;
};

export type MockProduct = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string | null;
  category: string | null;
  taxDefinitionId: string | null;
  unitPrice: number;
  taxPercent: number;
  isActive: boolean;
};

export type MockInvoiceItem = {
  id: string;
  productId: string | null;
  description: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  taxPercent: number;
  notes: string | null;
};

export type MockStatusChange = {
  status: InvoiceStatus;
  /** Preformatted "YYYY-MM-DD HH:MM" — mock data, not a real timestamp. */
  changedAt: string;
  paymentMethod?: string;
};

/** What the §10.3 list needs. Totals are derived, never stored. */
export type MockInvoiceRow = {
  id: string;
  invoiceNumber: string;
  customer: string;
  status: InvoiceStatus;
  issueDate: string;
  updatedAt: string;
  paidWith: string | null;
};

export type MockInvoice = MockInvoiceRow & {
  customerId: string;
  currency: string;
  dueDate: string | null;
  taxMode: "invoice" | "line";
  taxRate: number;
  pricesIncludeTax: boolean;
  roundingMode: "line" | "total";
  discount: number;
  paymentTerms: string | null;
  notes: string | null;
  shareToken: string | null;
  items: MockInvoiceItem[];
  statusHistory: MockStatusChange[];
};

export const CUSTOMERS: MockCustomer[] = [
  {
    id: "cus_1",
    name: "Demo Corp",
    contactName: "Ana Vogel",
    email: "billing@democorp.example",
    phone: "+31 20 555 0142",
    address: "Keizersgracht 118, 2nd floor",
    city: "Amsterdam",
    postalCode: "1015 CW",
    countryCode: "NL",
    taxId: "NL812345678B01",
  },
  {
    id: "cus_2",
    name: "Casper Holdings",
    contactName: "Milo Casper",
    email: "accounts@casperholdings.example",
    phone: "+49 30 555 0188",
    address: "Torstrasse 41",
    city: "Berlin",
    postalCode: "10119",
    countryCode: "DE",
    taxId: "DE298471553",
  },
  {
    id: "cus_3",
    name: "Northwind Traders",
    contactName: null,
    email: "ap@northwind.example",
    phone: null,
    address: "500 Harbor Way",
    city: "Seattle",
    postalCode: "98104",
    countryCode: "US",
    taxId: null,
  },
  {
    id: "cus_4",
    name: "Vandelay Industries",
    contactName: "Art Vandelay",
    email: null,
    phone: "+1 212 555 0117",
    address: null,
    city: null,
    postalCode: null,
    countryCode: null,
    taxId: null,
  },
];

export const PRODUCTS: MockProduct[] = [
  {
    id: "prod_1",
    name: "Consulting hour",
    description: "Senior consultant, billed per started hour.",
    sku: "SVC-001",
    unit: "hour",
    category: "service",
    taxDefinitionId: "tax_std",
    unitPrice: 120,
    taxPercent: 21,
    isActive: true,
  },
  {
    id: "prod_2",
    name: "Implementation day",
    description:
      "On-site implementation and hand-over, including a written report.",
    sku: "SVC-002",
    unit: "day",
    category: "service",
    taxDefinitionId: "tax_std",
    unitPrice: 850,
    taxPercent: 21,
    isActive: true,
  },
  {
    id: "prod_3",
    name: "Support retainer",
    description: "Monthly support retainer with a 4-hour response target.",
    sku: "SUB-001",
    unit: "piece",
    category: "subscription",
    taxDefinitionId: "tax_low",
    unitPrice: 300,
    taxPercent: 9,
    isActive: true,
  },
  {
    id: "prod_4",
    name: "Hardware bundle",
    description: null,
    sku: "GDS-114",
    unit: "piece",
    category: "goods",
    taxDefinitionId: "tax_std",
    unitPrice: 1499.5,
    taxPercent: 21,
    isActive: false,
  },
];

// ponytail: the invoice editor's unit dropdown, until it reads product_units
// with the rest of the invoice actions.
export const UNITS = ["piece", "hour", "day", "kg", "litre", "month"];


/** §10.5 quick-pick chips on the Mark as Paid panel. */
export const PAYMENT_METHODS = [
  "Bank Transfer",
  "PayPal",
  "Cash",
  "Credit Card",
  "Stripe",
];

/** Stand-in for getNextInvoiceNumber() — the real number is assigned server-side. */
export const NEXT_INVOICE_NUMBER = "INV-2026-005";

export const DEFAULT_SETTINGS = {
  currency: "EUR",
  paymentTerms: "Due in 30 days",
  defaultNotes: "Thank you for your business!",
};

export const findProduct = (id: string) => PRODUCTS.find((p) => p.id === id);

export const findCustomer = (id: string) => CUSTOMERS.find((c) => c.id === id);
