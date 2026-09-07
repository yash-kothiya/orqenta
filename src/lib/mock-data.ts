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

export type MockTaxDefinition = {
  id: string;
  code: string;
  name: string | null;
  percent: number;
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

export const INVOICES: MockInvoice[] = [
  {
    id: "inv_1",
    invoiceNumber: "INV-2026-004",
    customerId: "cus_1",
    customer: "Demo Corp",
    status: "sent",
    issueDate: "2026-02-03",
    dueDate: "2026-03-05",
    updatedAt: "2026-02-04",
    paidWith: null,
    currency: "EUR",
    taxMode: "invoice",
    taxRate: 21,
    pricesIncludeTax: false,
    roundingMode: "line",
    discount: 0,
    paymentTerms: "Due in 30 days",
    notes: "Thank you for your business!",
    shareToken: "shr_9fa21c",
    items: [
      {
        id: "it_1a",
        productId: "prod_1",
        description: "Consulting hour",
        quantity: 12,
        unit: "hour",
        unitPrice: 120,
        taxPercent: 21,
        notes: "January sprint support",
      },
      {
        id: "it_1b",
        productId: "prod_3",
        description: "Support retainer",
        quantity: 1,
        unit: "piece",
        unitPrice: 300,
        taxPercent: 9,
        notes: null,
      },
    ],
    statusHistory: [
      { status: "draft", changedAt: "2026-02-03 09:12" },
      { status: "sent", changedAt: "2026-02-04 08:40" },
    ],
  },
  {
    id: "inv_2",
    invoiceNumber: "INV-2026-003",
    customerId: "cus_3",
    customer: "Northwind Traders",
    status: "overdue",
    issueDate: "2026-01-11",
    dueDate: "2026-01-25",
    updatedAt: "2026-02-01",
    paidWith: null,
    currency: "EUR",
    taxMode: "line",
    taxRate: 0,
    pricesIncludeTax: false,
    roundingMode: "line",
    discount: 0,
    paymentTerms: "Due in 14 days",
    notes: null,
    shareToken: "shr_4b7e02",
    items: [
      {
        id: "it_2a",
        productId: "prod_2",
        description: "Implementation day",
        quantity: 2,
        unit: "day",
        unitPrice: 850,
        taxPercent: 21,
        notes: null,
      },
      {
        id: "it_2b",
        productId: "prod_4",
        description: "Hardware bundle",
        quantity: 1,
        unit: "piece",
        unitPrice: 299.5,
        taxPercent: 21,
        notes: "Shipped separately",
      },
    ],
    statusHistory: [
      { status: "draft", changedAt: "2026-01-11 10:02" },
      { status: "sent", changedAt: "2026-01-11 16:30" },
      { status: "overdue", changedAt: "2026-02-01 00:05" },
    ],
  },
  {
    id: "inv_3",
    invoiceNumber: "INV-2026-002",
    customerId: "cus_2",
    customer: "Casper Holdings",
    status: "paid",
    issueDate: "2026-01-06",
    dueDate: "2026-02-05",
    updatedAt: "2026-01-20",
    paidWith: "Bank Transfer",
    currency: "EUR",
    taxMode: "invoice",
    taxRate: 9,
    pricesIncludeTax: true,
    roundingMode: "total",
    discount: 25,
    paymentTerms: "Due in 30 days",
    notes: "Discount applied per the framework agreement.",
    shareToken: "shr_c10d55",
    items: [
      {
        id: "it_3a",
        productId: "prod_3",
        description: "Support retainer",
        quantity: 1,
        unit: "piece",
        unitPrice: 300,
        taxPercent: 9,
        notes: null,
      },
    ],
    statusHistory: [
      { status: "draft", changedAt: "2026-01-06 11:45" },
      { status: "sent", changedAt: "2026-01-07 09:00" },
      {
        status: "paid",
        changedAt: "2026-01-20 14:22",
        paymentMethod: "Bank Transfer",
      },
    ],
  },
  {
    id: "inv_4",
    invoiceNumber: "INV-2026-001",
    customerId: "cus_4",
    customer: "Vandelay Industries",
    status: "complete",
    issueDate: "2026-01-02",
    dueDate: "2026-01-16",
    updatedAt: "2026-01-18",
    paidWith: "PayPal",
    currency: "EUR",
    taxMode: "invoice",
    taxRate: 21,
    pricesIncludeTax: false,
    roundingMode: "line",
    discount: 0,
    paymentTerms: "Due in 14 days",
    notes: null,
    shareToken: "shr_77aa31",
    items: [
      {
        id: "it_4a",
        productId: "prod_2",
        description: "Implementation day",
        quantity: 8,
        unit: "day",
        unitPrice: 850,
        taxPercent: 21,
        notes: "Latex import rollout",
      },
      {
        id: "it_4b",
        productId: null,
        description: "Travel and accommodation",
        quantity: 1,
        unit: "lump_sum",
        unitPrice: 540,
        taxPercent: 21,
        notes: null,
      },
    ],
    statusHistory: [
      { status: "draft", changedAt: "2026-01-02 08:15" },
      { status: "sent", changedAt: "2026-01-02 12:00" },
      {
        status: "paid",
        changedAt: "2026-01-17 10:31",
        paymentMethod: "PayPal",
      },
      { status: "complete", changedAt: "2026-01-18 09:00" },
    ],
  },
  {
    id: "inv_5",
    invoiceNumber: "INV-2025-092",
    customerId: "cus_1",
    customer: "Demo Corp",
    status: "draft",
    issueDate: "2025-12-28",
    dueDate: null,
    updatedAt: "2025-12-28",
    paidWith: null,
    currency: "EUR",
    taxMode: "invoice",
    taxRate: 21,
    pricesIncludeTax: false,
    roundingMode: "line",
    discount: 0,
    paymentTerms: "Due in 30 days",
    notes: "Thank you for your business!",
    shareToken: null,
    items: [
      {
        id: "it_5a",
        productId: "prod_1",
        description: "Consulting hour",
        quantity: 4,
        unit: "hour",
        unitPrice: 120,
        taxPercent: 21,
        notes: null,
      },
    ],
    statusHistory: [{ status: "draft", changedAt: "2025-12-28 15:40" }],
  },
  {
    id: "inv_6",
    invoiceNumber: "INV-2025-091",
    customerId: "cus_2",
    customer: "Casper Holdings",
    status: "voided",
    issueDate: "2025-12-14",
    dueDate: "2026-01-13",
    updatedAt: "2025-12-19",
    paidWith: null,
    currency: "EUR",
    taxMode: "invoice",
    taxRate: 21,
    pricesIncludeTax: false,
    roundingMode: "line",
    discount: 0,
    paymentTerms: "Due in 30 days",
    notes: "Replaced by INV-2026-002.",
    shareToken: "shr_2e8f40",
    items: [
      {
        id: "it_6a",
        productId: "prod_3",
        description: "Support retainer",
        quantity: 3,
        unit: "piece",
        unitPrice: 300,
        taxPercent: 9,
        notes: null,
      },
    ],
    statusHistory: [
      { status: "draft", changedAt: "2025-12-14 09:00" },
      { status: "sent", changedAt: "2025-12-14 09:20" },
      { status: "voided", changedAt: "2025-12-19 11:05" },
    ],
  },
];

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

/** §10.10/§10.11 tax option + detail label. */
export const taxLabel = (t: MockTaxDefinition) =>
  `${t.name || t.code || `${t.percent}%`} (${t.percent}%)`;

export const findProduct = (id: string) => PRODUCTS.find((p) => p.id === id);

export const findCustomer = (id: string) => CUSTOMERS.find((c) => c.id === id);

export const findInvoice = (id: string) => INVOICES.find((i) => i.id === id);

/** §10.12/§10.13. `passwordHash` never reaches the client, so it isn't here. */
export type MockUser = {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
  isActive: boolean;
  /** `perm.{resource}.{action}` keys — see lib/permissions. */
  permissions: string[];
};

export const USERS: MockUser[] = [
  {
    id: "usr_1",
    username: "admin",
    email: "admin@orqenta.app",
    displayName: "Yash Kothiya",
    isAdmin: true,
    isActive: true,
    permissions: [],
  },
  {
    id: "usr_2",
    username: "maria",
    email: "maria@demo.corp",
    displayName: "Maria Lang",
    isAdmin: false,
    isActive: true,
    permissions: [
      "perm.invoices.read",
      "perm.invoices.create",
      "perm.invoices.update",
      "perm.invoices.publish",
      "perm.customers.read",
      "perm.products.read",
    ],
  },
  {
    id: "usr_3",
    username: "tom",
    email: "tom.reed@northwind.test",
    displayName: null,
    isAdmin: false,
    isActive: false,
    permissions: ["perm.invoices.read", "perm.customers.read"],
  },
  {
    id: "usr_4",
    username: "kai",
    email: null,
    displayName: null,
    isAdmin: false,
    isActive: true,
    permissions: [],
  },
];

/** ponytail: stands in for the §5 session user until auth lands. */
export const CURRENT_USER = USERS[0];

/**
 * §10.12 display name. The spec's chain starts with `displayName → name`, but
 * the §2.14 users table has no `name` column, so it starts one link later.
 */
export const userLabel = (u: MockUser) =>
  u.displayName || u.username || u.email?.split("@")[0] || "Unnamed";

/** §10.14. `html` lives server-side; the list only ever shows these two fields. */
export type MockTemplate = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
};

export const TEMPLATES: MockTemplate[] = [
  {
    id: "tpl_1",
    name: "Default A4",
    description: "Built-in A4 layout with a logo box and floated invoice meta.",
    isDefault: true,
  },
  {
    id: "tpl_2",
    name: "Minimal",
    description: null,
    isDefault: false,
  },
  {
    id: "tpl_3",
    name: "Letterhead",
    description: "Company logo band across the top, tax summary in the footer.",
    isDefault: false,
  },
];

export const findUser = (id: string) => USERS.find((u) => u.id === id);

/** §10.16 — the public page is reached by share token, never by id. */
export const findInvoiceByToken = (token: string) =>
  INVOICES.find((i) => i.shareToken === token);
