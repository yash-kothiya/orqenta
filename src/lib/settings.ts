import {
  Building2,
  CreditCard,
  FileCode,
  Hash,
  Languages,
  LayoutTemplate,
  Package,
  Palette,
  Percent,
  Sun,
} from "lucide-react";
import {
  expandVolatileTokens,
  legacyPrefix,
  sequencePadding,
} from "./numbering";

/** §7 keys the §10.15 panels render, with their spec defaults. */
export const SETTING_DEFAULTS = {
  companyName: "Your Company",
  companyAddress: "123 Business St, City, State 12345",
  companyCity: "",
  companyPostalCode: "",
  companyEmail: "contact@yourcompany.com",
  companyPhone: "+1 (555) 123-4567",
  companyTaxId: "TAX123456789",
  companyCountryCode: "US",
  currency: "USD",
  logo: "",
  templateId: "",
  highlight: "#059669",
  dateFormat: "YYYY-MM-DD",
  numberFormat: "comma",
  postalCityFormat: "auto",
  paymentMethods: "Bank Transfer, PayPal, Credit Card",
  bankAccount: "Account: 1234567890, Routing: 021000021",
  paymentTerms: "Due in 30 days",
  defaultNotes: "Thank you for your business!",
  allowProtectedInvoiceChanges: false,
  taxLabel: "VAT",
  defaultTaxRate: "0",
  defaultPricesIncludeTax: false,
  defaultRoundingMode: "line",
  invoiceNumberingEnabled: true,
  invoiceNumberPattern: "",
  invoicePrefix: "INV",
  invoiceIncludeYear: true,
  invoiceNumberPadding: "3",
  xmlProfileId: "ubl21",
  embedXmlInPdf: false,
  embedXmlInHtml: false,
};

export type Settings = typeof SETTING_DEFAULTS;

type KeysOfType<T> = {
  [K in keyof Settings]: Settings[K] extends T ? K : never;
}[keyof Settings];

export type TextKey = KeysOfType<string>;
export type BoolKey = KeysOfType<boolean>;

export const SECTIONS = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "appearance", label: "Appearance", icon: Sun },
  { id: "formatting", label: "Formatting", icon: Languages },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "tax", label: "Tax", icon: Percent },
  { id: "products", label: "Products", icon: Package },
  { id: "numbering", label: "Numbering", icon: Hash },
  { id: "xml", label: "XML Export", icon: FileCode },
] as const;

export const DATE_FORMATS = [
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
  { value: "DD.MM.YYYY", label: "DD.MM.YYYY" },
];

export const NUMBER_FORMATS = [
  { value: "comma", label: "1,000.00" },
  { value: "period", label: "1.000,00" },
];

export const POSTAL_CITY_FORMATS = [
  { value: "auto", label: "Auto (from country)" },
  { value: "postal-city", label: "Postal Code + City" },
  { value: "city-postal", label: "City + Postal Code" },
];

export const ROUNDING_MODES = [
  { value: "line", label: "Per line" },
  { value: "total", label: "On the total" },
];

export const XML_PROFILES = [
  { value: "ubl21", label: "UBL 2.1 (PEPPOL BIS Billing 3.0)" },
  { value: "facturx22", label: "Factur-X / ZUGFeRD 2.2 (EN 16931)" },
  { value: "fatturapa", label: "FatturaPA (Italian eInvoice)" },
];

/** §4.4 pattern tokens, for the help text under the pattern field. */
export const NUMBER_TOKENS = [
  ["{YYYY}", "Four-digit year"],
  ["{YY}", "Two-digit year"],
  ["{MM}", "Two-digit month"],
  ["{DD}", "Two-digit day"],
  ["{DATE}", "YYYYMMDD"],
  ["{RAND4}", "Four random characters"],
  ["{SEQ}", "Global sequence, padded to 3"],
  ["{CSEQ}", "Per-customer sequence, padded to 3"],
  ["{CNUM}", "The customer's permanent number"],
];

/**
 * §4.4 preview only. The sequence tokens resolve to 001 because the real
 * counters scan existing invoice numbers server-side, and {RAND4} is fixed so
 * the server and client render the same string.
 */
export function previewInvoiceNumber(s: Settings) {
  if (!s.invoiceNumberingEnabled) return "DRAFT-7KQM2X";

  const pattern = s.invoiceNumberPattern.trim();
  if (!pattern) return legacyPrefix(s) + "1".padStart(sequencePadding(s), "0");

  return expandVolatileTokens(pattern, new Date(), "K7QM")
    .replaceAll("{SEQ}", "001")
    .replaceAll("{CSEQ}", "001")
    .replaceAll("{CNUM}", "007");
}
