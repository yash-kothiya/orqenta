import { describe, expect, it } from "vitest";
import { SETTING_DEFAULTS, type Settings } from "../settings";
import type { InvoiceWithDetails } from "../types";
import { buildUblInvoice } from "./ubl";

const settings = (over: Partial<Settings> = {}): Settings => ({
  ...SETTING_DEFAULTS,
  companyName: "Northwind BV",
  companyAddress: "Keizersgracht 1\nUnit 4",
  companyCity: "Amsterdam",
  companyPostalCode: "1015 CW",
  companyCountryCode: "NL",
  companyTaxId: "NL812345678B01",
  ...over,
});

const invoice = (over: Partial<InvoiceWithDetails> = {}): InvoiceWithDetails =>
  ({
    invoiceNumber: "INV-2026-001",
    currency: "EUR",
    status: "sent",
    issueDate: "2026-09-11",
    dueDate: "2026-10-11",
    subtotal: "150.00",
    discountAmount: "0.00",
    discountPercentage: "0.000",
    taxRate: "19.000",
    taxAmount: "28.50",
    total: "178.50",
    paymentTerms: null,
    notes: null,
    customer: {
      name: "Tom & Co",
      address: "Main St 1\nFloor 2",
      city: "Rotterdam",
      postalCode: "3011 AA",
      countryCode: "NL",
      taxId: null,
      email: null,
      phone: null,
    },
    items: [
      {
        description: "Design work",
        quantity: "4.0000",
        unit: null,
        unitPrice: "37.50",
        lineTotal: "150.00",
        notes: null,
        taxes: [],
      },
    ],
    taxes: [{ percent: "19.000", taxableAmount: "150.00", taxAmount: "28.50" }],
    statusHistory: [],
    ...over,
  }) as unknown as InvoiceWithDetails;

describe("buildUblInvoice", () => {
  it("declares UBL 2.1 and the invoice identity", () => {
    const xml = buildUblInvoice(invoice(), settings());
    expect(xml).toContain("<cbc:UBLVersionID>2.1</cbc:UBLVersionID>");
    expect(xml).toContain("<cbc:ID>INV-2026-001</cbc:ID>");
    expect(xml).toContain("<cbc:IssueDate>2026-09-11</cbc:IssueDate>");
    expect(xml).toContain("<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>");
  });

  it("carries the PEPPOL identifiers only on the ubl21 profile", () => {
    expect(buildUblInvoice(invoice(), settings(), "ubl21")).toContain(
      "peppol.eu:2017:poacc:billing",
    );
    expect(buildUblInvoice(invoice(), settings(), "ubl")).not.toContain(
      "peppol.eu",
    );
  });

  it("writes plain decimals, never formatted money", () => {
    const xml = buildUblInvoice(invoice(), settings());
    expect(xml).toContain(
      '<cbc:PayableAmount currencyID="EUR">178.50</cbc:PayableAmount>',
    );
    expect(xml).not.toContain("€");
  });

  it("escapes a customer name that would otherwise break the document", () => {
    const xml = buildUblInvoice(invoice(), settings());
    expect(xml).toContain("<cbc:Name>Tom &amp; Co</cbc:Name>");
  });

  it("takes only the first address line as the street", () => {
    const xml = buildUblInvoice(invoice(), settings());
    expect(xml).toContain("<cbc:StreetName>Keizersgracht 1</cbc:StreetName>");
    expect(xml).not.toContain("Unit 4");
  });

  it("omits an element rather than emitting an empty one", () => {
    const xml = buildUblInvoice(
      invoice({ dueDate: null, notes: null }),
      settings(),
    );
    expect(xml).not.toContain("<cbc:DueDate>");
    expect(xml).not.toContain("<cbc:Note>");
  });

  it("writes one TaxSubtotal per summary row", () => {
    const xml = buildUblInvoice(
      invoice({
        taxes: [
          { percent: "19.000", taxableAmount: "100.00", taxAmount: "19.00" },
          { percent: "7.000", taxableAmount: "50.00", taxAmount: "3.50" },
        ],
      } as Partial<InvoiceWithDetails>),
      settings(),
    );
    expect(xml.match(/<cac:TaxSubtotal>/g)).toHaveLength(2);
  });

  it("still writes a TaxSubtotal when the invoice has no summary rows", () => {
    const xml = buildUblInvoice(invoice({ taxes: [] }), settings());
    expect(xml).toContain("<cac:TaxSubtotal>");
    expect(xml).toContain("<cbc:Percent>19.00</cbc:Percent>");
  });

  it("marks a zero rate as category Z rather than S", () => {
    const xml = buildUblInvoice(
      invoice({
        taxes: [
          { percent: "0.000", taxableAmount: "150.00", taxAmount: "0.00" },
        ],
      } as Partial<InvoiceWithDetails>),
      settings(),
    );
    expect(xml).toContain("<cbc:ID>Z</cbc:ID>");
  });

  it("numbers the lines from one and defaults the unit to C62", () => {
    const xml = buildUblInvoice(invoice(), settings());
    expect(xml).toContain("<cac:InvoiceLine>");
    expect(xml).toContain('<cbc:InvoicedQuantity unitCode="C62">4<');
  });
});
