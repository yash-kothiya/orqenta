/**
 * §11 — the object every rendering path shares.
 *
 * Built once and reused for the owner's HTML, the PDF and the public page, so
 * those three can never disagree about what an invoice says. Every money value
 * is already a formatted string: the template is not allowed to do arithmetic.
 */
import Color from "color";
import { formatDate, formatMoney, formatPostalCityLine } from "@/lib/format";
import type { Settings } from "@/lib/settings";
import type { TemplateContext } from "@/lib/template";
import { multiline } from "@/lib/template";
import type { InvoiceWithDetails } from "@/lib/types";

/** A wash of the highlight colour, for table headers and rules. */
function lighten(highlight: string) {
  try {
    return Color(highlight).mix(Color("white"), 0.85).hex();
  } catch {
    // The setting is free text, so an unparseable value must not break a render.
    return "#f1f5f9";
  }
}

export function buildInvoiceContext(
  invoice: InvoiceWithDetails,
  settings: Settings,
): TemplateContext {
  const { currency } = invoice;
  const money = (amount: string | number) =>
    formatMoney(amount, currency, settings.numberFormat);
  const date = (value?: string | null) =>
    formatDate(value, settings.dateFormat);

  const customer = invoice.customer;
  const taxAmount = Number(invoice.taxAmount);
  const discountAmount = Number(invoice.discountAmount);

  return {
    companyName: settings.companyName,
    companyAddress: settings.companyAddress,
    companyCity: settings.companyCity,
    companyPostalCode: settings.companyPostalCode,
    companyPostalCity: formatPostalCityLine(
      settings.companyCity,
      settings.companyPostalCode,
      settings.companyCountryCode,
    ),
    companyEmail: settings.companyEmail,
    companyPhone: settings.companyPhone,
    companyTaxId: settings.companyTaxId,

    invoiceNumber: invoice.invoiceNumber,
    issueDate: date(invoice.issueDate),
    dueDate: date(invoice.dueDate),
    currency,
    status: invoice.status,

    customerName: customer?.name ?? "",
    customerContactName: customer?.contactName ?? "",
    customerEmail: customer?.email ?? "",
    customerPhone: customer?.phone ?? "",
    customerAddress: customer?.address ?? "",
    customerCity: customer?.city ?? "",
    customerPostalCode: customer?.postalCode ?? "",
    customerCountryCode: customer?.countryCode ?? "",
    customerPostalCity: formatPostalCityLine(
      customer?.city,
      customer?.postalCode,
      customer?.countryCode,
    ),
    customerTaxId: customer?.taxId ?? "",

    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: trimZeros(item.quantity),
      unit: item.unit ?? "",
      unitPrice: money(item.unitPrice),
      lineTotal: money(item.lineTotal),
      notes: item.notes ?? "",
      /** Prepared for {{{notesHtml}}}: item notes are the one wrapping field. */
      notesHtml: multiline(item.notes),
    })),
    /** The Unit column is dropped entirely when no line has one. */
    hasItemUnits: invoice.items.some((item) => Boolean(item.unit)),

    subtotal: money(invoice.subtotal),
    discountAmount: money(invoice.discountAmount),
    discountPercentage: trimZeros(invoice.discountPercentage),
    taxRate: trimZeros(invoice.taxRate),
    taxAmount: money(invoice.taxAmount),
    total: money(invoice.total),

    taxSummary: invoice.taxes.map((tax) => ({
      label: `${settings.taxLabel || "Tax"} ${trimZeros(tax.percent)}%`,
      percent: trimZeros(tax.percent),
      taxable: money(tax.taxableAmount),
      amount: money(tax.taxAmount),
    })),
    hasTaxSummary: invoice.taxes.length > 0,
    hasDiscount: discountAmount > 0,
    hasTax: taxAmount > 0,

    paymentTerms: invoice.paymentTerms ?? settings.paymentTerms,
    paymentMethods: settings.paymentMethods,
    bankAccount: settings.bankAccount,
    notes: invoice.notes ?? "",
    notesHtml: multiline(invoice.notes),
    bankAccountHtml: multiline(settings.bankAccount),
    companyAddressHtml: multiline(settings.companyAddress),
    customerAddressHtml: multiline(customer?.address),

    highlightColor: settings.highlight,
    highlightColorLight: lighten(settings.highlight),
    logo: settings.logo,
  };
}

/** `4.0000` reads as `4`, but `1.5000` has to stay `1.5`. */
function trimZeros(value: string | number) {
  const text = String(value);
  return text.includes(".") ? text.replace(/0+$/, "").replace(/\.$/, "") : text;
}
