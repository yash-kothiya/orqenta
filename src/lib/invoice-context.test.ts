import { describe, expect, it } from "vitest";
import { BUILTIN_TEMPLATE_HTML } from "./builtin-template";
import { buildInvoiceContext } from "./invoice-context";
import { SETTING_DEFAULTS, type Settings } from "./settings";
import { renderTemplate } from "./template";
import type { InvoiceWithDetails } from "./types";

const settings = (over: Partial<Settings> = {}): Settings => ({
  ...SETTING_DEFAULTS,
  companyName: "Northwind BV",
  companyAddress: "Keizersgracht 1\nUnit 4",
  companyCity: "Amsterdam",
  companyPostalCode: "1015 CW",
  companyCountryCode: "NL",
  taxLabel: "VAT",
  highlight: "#059669",
  ...over,
});

const invoice = (over: Partial<InvoiceWithDetails> = {}): InvoiceWithDetails =>
  ({
    id: "inv_1",
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
      contactName: null,
      email: null,
      phone: null,
      address: "Main St 1\nFloor 2",
      city: "Rotterdam",
      postalCode: "3011 AA",
      countryCode: "NL",
      taxId: null,
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

describe("buildInvoiceContext", () => {
  it("pre-formats every money value in the invoice currency", () => {
    const context = buildInvoiceContext(invoice(), settings());
    expect(context.subtotal).toBe("€150.00");
    expect(context.total).toBe("€178.50");
  });

  it("honours the number format setting", () => {
    const context = buildInvoiceContext(
      invoice(),
      settings({ numberFormat: "period" }),
    );
    expect(String(context.total)).toContain("178,50");
  });

  it("honours the date format setting", () => {
    expect(buildInvoiceContext(invoice(), settings()).issueDate).toBe(
      "2026-09-11",
    );
    expect(
      buildInvoiceContext(invoice(), settings({ dateFormat: "DD.MM.YYYY" }))
        .issueDate,
    ).toBe("11.09.2026");
  });

  it("trims the trailing zeros a numeric column carries", () => {
    const context = buildInvoiceContext(invoice(), settings());
    expect((context.items as { quantity: string }[])[0].quantity).toBe("4");
    expect(context.taxRate).toBe("19");
  });

  it("builds the postal line per §4.8", () => {
    const context = buildInvoiceContext(invoice(), settings());
    expect(context.companyPostalCity).toBe("1015 CW Amsterdam");
    expect(context.customerPostalCity).toBe("3011 AA Rotterdam");
  });

  it("drops the unit column when no line has one", () => {
    expect(buildInvoiceContext(invoice(), settings()).hasItemUnits).toBe(false);
  });

  it("labels each tax summary row with the configured tax label", () => {
    const [row] = buildInvoiceContext(invoice(), settings()).taxSummary as {
      label: string;
    }[];
    expect(row.label).toBe("VAT 19%");
  });

  it("survives an invoice with no customer", () => {
    const context = buildInvoiceContext(
      invoice({ customer: null }),
      settings(),
    );
    expect(context.customerName).toBe("");
    expect(context.customerPostalCity).toBe("");
  });

  it("falls back to a readable colour when the highlight is nonsense", () => {
    const context = buildInvoiceContext(
      invoice(),
      settings({ highlight: "not a colour" }),
    );
    expect(context.highlightColorLight).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("the built-in template", () => {
  it("renders the invoice into a document", () => {
    const html = renderTemplate(
      BUILTIN_TEMPLATE_HTML,
      buildInvoiceContext(invoice(), settings()),
    );

    expect(html).toContain("INV-2026-001");
    expect(html).toContain("Design work");
    expect(html).toContain("€178.50");
    expect(html).toContain("@page { size: A4; margin: 10mm; }");
  });

  it("escapes a hostile customer name instead of running it", () => {
    const html = renderTemplate(
      BUILTIN_TEMPLATE_HTML,
      buildInvoiceContext(
        invoice({
          customer: {
            name: "<script>alert(1)</script>",
          } as InvoiceWithDetails["customer"],
        }),
        settings(),
      ),
    );

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("keeps the line breaks in an address", () => {
    const html = renderTemplate(
      BUILTIN_TEMPLATE_HTML,
      buildInvoiceContext(invoice(), settings()),
    );
    expect(html).toContain("Keizersgracht 1<br />Unit 4");
    expect(html).toContain("Main St 1<br />Floor 2");
  });

  it("leaves no token unresolved", () => {
    const html = renderTemplate(
      BUILTIN_TEMPLATE_HTML,
      buildInvoiceContext(invoice(), settings()),
    );
    expect(html).not.toMatch(/\{\{/);
  });
});
