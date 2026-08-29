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
  sku: string | null;
  unit: string | null;
  unitPrice: number;
  taxPercent: number;
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
    sku: "SVC-001",
    unit: "hour",
    unitPrice: 120,
    taxPercent: 21,
  },
  {
    id: "prod_2",
    name: "Implementation day",
    sku: "SVC-002",
    unit: "day",
    unitPrice: 850,
    taxPercent: 21,
  },
  {
    id: "prod_3",
    name: "Support retainer",
    sku: "SUB-001",
    unit: "piece",
    unitPrice: 300,
    taxPercent: 9,
  },
  {
    id: "prod_4",
    name: "Hardware bundle",
    sku: "GDS-114",
    unit: "piece",
    unitPrice: 1499.5,
    taxPercent: 21,
  },
];

export const UNITS = ["piece", "hour", "day", "kg", "m", "lump_sum"];

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
