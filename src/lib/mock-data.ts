// ponytail: UI-only fixtures. Delete this file when the §6 server actions land.

export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "complete",
  "paid",
  "overdue",
  "voided",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type MockCustomer = {
  id: string;
  name: string;
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

export type MockTaxDefinition = {
  id: string;
  code: string;
  name: string | null;
  percent: number;
};

export type MockInvoiceRow = {
  id: string;
  invoiceNumber: string;
  customer: string;
  total: number;
  status: InvoiceStatus;
  issueDate: string;
  updatedAt: string;
  paidWith: string | null;
};

export const CUSTOMERS: MockCustomer[] = [
  { id: "cus_1", name: "Demo Corp" },
  { id: "cus_2", name: "Casper Holdings" },
  { id: "cus_3", name: "Northwind Traders" },
  { id: "cus_4", name: "Vandelay Industries" },
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
    isActive: true,
  },
];

export const PRODUCT_CATEGORIES = [
  { code: "service", name: "Service" },
  { code: "goods", name: "Goods" },
  { code: "subscription", name: "Subscription" },
  { code: "other", name: "Other" },
];

export const PRODUCT_UNITS = [
  { code: "piece", name: "Piece" },
  { code: "hour", name: "Hour" },
  { code: "day", name: "Day" },
  { code: "kg", name: "Kilogram" },
  { code: "m", name: "Meter" },
  { code: "lump_sum", name: "Lump Sum" },
];

export const TAX_DEFINITIONS: MockTaxDefinition[] = [
  { id: "tax_std", code: "STD", name: "Standard rate", percent: 21 },
  { id: "tax_low", code: "LOW", name: "Reduced rate", percent: 9 },
  { id: "tax_zero", code: "ZERO", name: null, percent: 0 },
];

export const UNITS = PRODUCT_UNITS.map((u) => u.code);

export const INVOICES: MockInvoiceRow[] = [
  {
    id: "inv_1",
    invoiceNumber: "INV-2026-004",
    customer: "Demo Corp",
    total: 15,
    status: "sent",
    issueDate: "2026-02-03",
    updatedAt: "2026-02-04",
    paidWith: null,
  },
  {
    id: "inv_2",
    invoiceNumber: "INV-2026-003",
    customer: "Northwind Traders",
    total: 2420.75,
    status: "overdue",
    issueDate: "2026-01-11",
    updatedAt: "2026-02-01",
    paidWith: null,
  },
  {
    id: "inv_3",
    invoiceNumber: "INV-2026-002",
    customer: "Casper Holdings",
    total: 310.44,
    status: "paid",
    issueDate: "2026-01-06",
    updatedAt: "2026-01-20",
    paidWith: "Bank Transfer",
  },
  {
    id: "inv_4",
    invoiceNumber: "INV-2026-001",
    customer: "Vandelay Industries",
    total: 8940,
    status: "complete",
    issueDate: "2026-01-02",
    updatedAt: "2026-01-18",
    paidWith: "PayPal",
  },
  {
    id: "inv_5",
    invoiceNumber: "INV-2025-092",
    customer: "Demo Corp",
    total: 640.2,
    status: "draft",
    issueDate: "2025-12-28",
    updatedAt: "2025-12-28",
    paidWith: null,
  },
  {
    id: "inv_6",
    invoiceNumber: "INV-2025-091",
    customer: "Casper Holdings",
    total: 1180,
    status: "voided",
    issueDate: "2025-12-14",
    updatedAt: "2025-12-19",
    paidWith: null,
  },
];

/** Stand-in for getNextInvoiceNumber() — the real number is assigned server-side. */
export const NEXT_INVOICE_NUMBER = "INV-2026-005";

export const DEFAULT_SETTINGS = {
  currency: "EUR",
  paymentTerms: "Due in 30 days",
  defaultNotes: "Thank you for your business!",
};
