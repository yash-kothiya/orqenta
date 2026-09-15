/**
 * §10.16 — UBL 2.1 invoice export.
 *
 * Two shapes from one builder: plain UBL, and the same document carrying the
 * PEPPOL BIS Billing 3.0 identifiers. They differ by two elements, so a second
 * builder would be two elements of value and a whole file of drift.
 */
import type { Settings } from "@/lib/settings";
import { escapeHtml } from "@/lib/template";
import type { InvoiceWithDetails } from "@/lib/types";

export type UblProfile = "ubl" | "ubl21";

const PEPPOL_CUSTOMIZATION =
  "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0";
const PEPPOL_PROFILE = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";

/** XML and HTML escape the same five characters, so this is the same function. */
const esc = escapeHtml;

/** An element, or nothing at all when the value is empty. */
function tag(name: string, value: unknown): string {
  const text = String(value ?? "").trim();
  return text ? "<" + name + ">" + esc(text) + "</" + name + ">" : "";
}

/** UBL wants a plain decimal, never a formatted one. */
function money(name: string, value: string | number, currency: string): string {
  const open = "<" + name + ' currencyID="' + esc(currency) + '">';
  return open + Number(value).toFixed(2) + "</" + name + ">";
}

type PartyFields = {
  name: string;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
};

function party(role: string, fields: PartyFields): string {
  const taxScheme = fields.taxId
    ? "<cac:PartyTaxScheme>" +
      tag("cbc:CompanyID", fields.taxId) +
      "<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>"
    : "";

  const contact =
    fields.email || fields.phone
      ? "<cac:Contact>" +
        tag("cbc:Telephone", fields.phone) +
        tag("cbc:ElectronicMail", fields.email) +
        "</cac:Contact>"
      : "";

  // Only the first line of the address is the street; UBL has no free-text
  // address element to put the rest in.
  const street = (fields.address ?? "").split("\n")[0];

  return [
    "<cac:" + role + "><cac:Party>",
    "<cac:PartyName>" + tag("cbc:Name", fields.name) + "</cac:PartyName>",
    "<cac:PostalAddress>",
    tag("cbc:StreetName", street),
    tag("cbc:CityName", fields.city),
    tag("cbc:PostalZone", fields.postalCode),
    "<cac:Country>" +
      tag("cbc:IdentificationCode", fields.countryCode) +
      "</cac:Country>",
    "</cac:PostalAddress>",
    taxScheme,
    contact,
    "</cac:Party></cac:" + role + ">",
  ]
    .filter(Boolean)
    .join("\n  ");
}

export function buildUblInvoice(
  invoice: InvoiceWithDetails,
  settings: Settings,
  profile: UblProfile = "ubl21",
): string {
  const currency = invoice.currency;
  const taxable = (
    Number(invoice.subtotal) - Number(invoice.discountAmount)
  ).toFixed(2);

  // A summary row per rate when the invoice has them, else the single rate it
  // was totalled at — UBL always wants at least one TaxSubtotal.
  const subtotals = invoice.taxes.length
    ? invoice.taxes.map((tax) => ({
        percent: tax.percent,
        taxable: tax.taxableAmount,
        amount: tax.taxAmount,
      }))
    : [{ percent: invoice.taxRate, taxable, amount: invoice.taxAmount }];

  const taxSubtotals = subtotals.map((row) =>
    [
      "<cac:TaxSubtotal>",
      money("cbc:TaxableAmount", row.taxable, currency),
      money("cbc:TaxAmount", row.amount, currency),
      "<cac:TaxCategory>",
      // S is a standard rate, Z is a zero rate; UBL has no "no tax" category.
      "<cbc:ID>" + (Number(row.percent) > 0 ? "S" : "Z") + "</cbc:ID>",
      "<cbc:Percent>" + Number(row.percent).toFixed(2) + "</cbc:Percent>",
      "<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>",
      "</cac:TaxCategory>",
      "</cac:TaxSubtotal>",
    ].join("\n    "),
  );

  const lines = invoice.items.map((item, index) =>
    [
      "<cac:InvoiceLine>",
      "<cbc:ID>" + (index + 1) + "</cbc:ID>",
      // C62 is the UN/ECE code for "one"; it is the unit for a bare count.
      '<cbc:InvoicedQuantity unitCode="' +
        esc(item.unit || "C62") +
        '">' +
        Number(item.quantity) +
        "</cbc:InvoicedQuantity>",
      money("cbc:LineExtensionAmount", item.lineTotal, currency),
      tag("cbc:Note", item.notes),
      "<cac:Item>" + tag("cbc:Name", item.description) + "</cac:Item>",
      "<cac:Price>" +
        money("cbc:PriceAmount", item.unitPrice, currency) +
        "</cac:Price>",
      "</cac:InvoiceLine>",
    ]
      .filter(Boolean)
      .join("\n    "),
  );

  const identifiers =
    profile === "ubl21"
      ? [
          "<cbc:CustomizationID>" +
            PEPPOL_CUSTOMIZATION +
            "</cbc:CustomizationID>",
          "<cbc:ProfileID>" + PEPPOL_PROFILE + "</cbc:ProfileID>",
        ]
      : [];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"',
    '  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"',
    '  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">',
    "  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>",
    ...identifiers.map((line) => "  " + line),
    "  " + tag("cbc:ID", invoice.invoiceNumber),
    "  " + tag("cbc:IssueDate", invoice.issueDate),
    "  " + tag("cbc:DueDate", invoice.dueDate),
    "  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>",
    "  " + tag("cbc:Note", invoice.notes),
    "  " + tag("cbc:DocumentCurrencyCode", currency),
    "  " +
      party("AccountingSupplierParty", {
        name: settings.companyName,
        address: settings.companyAddress,
        city: settings.companyCity,
        postalCode: settings.companyPostalCode,
        countryCode: settings.companyCountryCode,
        taxId: settings.companyTaxId,
        email: settings.companyEmail,
        phone: settings.companyPhone,
      }),
    "  " +
      party("AccountingCustomerParty", {
        name: invoice.customer?.name ?? "",
        address: invoice.customer?.address,
        city: invoice.customer?.city,
        postalCode: invoice.customer?.postalCode,
        countryCode: invoice.customer?.countryCode,
        taxId: invoice.customer?.taxId,
        email: invoice.customer?.email,
        phone: invoice.customer?.phone,
      }),
    invoice.paymentTerms
      ? "  <cac:PaymentTerms>" +
        tag("cbc:Note", invoice.paymentTerms) +
        "</cac:PaymentTerms>"
      : "",
    "  <cac:TaxTotal>",
    "    " + money("cbc:TaxAmount", invoice.taxAmount, currency),
    ...taxSubtotals.map((line) => "    " + line),
    "  </cac:TaxTotal>",
    "  <cac:LegalMonetaryTotal>",
    "    " + money("cbc:LineExtensionAmount", invoice.subtotal, currency),
    "    " + money("cbc:TaxExclusiveAmount", taxable, currency),
    "    " + money("cbc:TaxInclusiveAmount", invoice.total, currency),
    Number(invoice.discountAmount) > 0
      ? "    " +
        money("cbc:AllowanceTotalAmount", invoice.discountAmount, currency)
      : "",
    "    " + money("cbc:PayableAmount", invoice.total, currency),
    "  </cac:LegalMonetaryTotal>",
    ...lines.map((line) => "  " + line),
    "</Invoice>",
    "",
  ]
    .filter((line) => line.trim() !== "")
    .join("\n");
}
