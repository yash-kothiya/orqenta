import { describe, expect, it } from "vitest";
import { calculateInvoiceTotals, calculatePerLineTotals, r2 } from "./money";

const line = (quantity: number, unitPrice: number) => ({ quantity, unitPrice });

describe("r2", () => {
  it("rounds to two decimals", () => {
    expect(r2(0.1 + 0.2)).toBe(0.3);
    expect(r2(1.236)).toBe(1.24);
    expect(r2(-1.005)).toBe(-1);
  });
});

describe("calculateInvoiceTotals", () => {
  it("adds tax on top when prices exclude it", () => {
    expect(
      calculateInvoiceTotals({
        items: [line(2, 10), line(1, 5)],
        taxRate: 19,
        roundingMode: "total",
      }),
    ).toEqual({
      subtotal: 25,
      discountAmount: 0,
      taxAmount: 4.75,
      total: 29.75,
    });
  });

  it("rounds each line separately in line mode, which can differ by a cent", () => {
    const items = [line(1, 3.4), line(1, 3.4), line(1, 3.4)];

    // 3.40 * 7.5% = 0.255 → 0.26 per line → 0.78
    expect(
      calculateInvoiceTotals({ items, taxRate: 7.5, roundingMode: "line" }),
    ).toEqual({
      subtotal: 10.2,
      discountAmount: 0,
      taxAmount: 0.78,
      total: 10.98,
    });

    // 10.20 * 7.5% is 0.7649999… in binary floating point → 0.76 once
    expect(
      calculateInvoiceTotals({ items, taxRate: 7.5, roundingMode: "total" }),
    ).toEqual({
      subtotal: 10.2,
      discountAmount: 0,
      taxAmount: 0.76,
      total: 10.96,
    });
  });

  it("backs the tax out of the price when prices include it", () => {
    expect(
      calculateInvoiceTotals({
        items: [line(1, 119)],
        taxRate: 19,
        pricesIncludeTax: true,
        roundingMode: "total",
      }),
    ).toEqual({
      subtotal: 119,
      discountAmount: 0,
      taxAmount: 19,
      total: 119,
    });
  });

  it("prefers a discount percentage over a discount amount", () => {
    const totals = calculateInvoiceTotals({
      items: [line(1, 100)],
      discountPercentage: 10,
      discountAmount: 50,
      roundingMode: "total",
    });
    expect(totals.discountAmount).toBe(10);
    expect(totals.total).toBe(90);
  });

  it("clamps the discount to the subtotal", () => {
    expect(
      calculateInvoiceTotals({
        items: [line(1, 40)],
        discountAmount: 100,
        taxRate: 19,
        roundingMode: "line",
      }),
    ).toEqual({ subtotal: 40, discountAmount: 40, taxAmount: 0, total: 0 });
  });

  it("gives the discount remainder to the last line", () => {
    // 10 split three ways is 3.33 + 3.33 + 3.34, not 3.33 three times.
    const totals = calculateInvoiceTotals({
      items: [line(1, 10), line(1, 10), line(1, 10)],
      discountAmount: 10,
      roundingMode: "line",
    });
    expect(totals.discountAmount).toBe(10);
    expect(totals.total).toBe(20);
  });

  it("treats a negative rate as no tax", () => {
    const totals = calculateInvoiceTotals({
      items: [line(1, 100)],
      taxRate: -5,
      roundingMode: "total",
    });
    expect(totals.taxAmount).toBe(0);
    expect(totals.total).toBe(100);
  });

  it("returns zeros for an empty invoice", () => {
    expect(
      calculateInvoiceTotals({
        items: [],
        taxRate: 19,
        discountPercentage: 50,
        roundingMode: "line",
      }),
    ).toEqual({ subtotal: 0, discountAmount: 0, taxAmount: 0, total: 0 });
  });
});

describe("calculatePerLineTotals", () => {
  it("taxes each line at its own rate and groups the summary", () => {
    const totals = calculatePerLineTotals({
      items: [
        { ...line(1, 100), taxes: [{ percent: 19 }] },
        { ...line(1, 50), taxes: [{ percent: 7 }] },
      ],
    });

    expect(totals.subtotal).toBe(150);
    expect(totals.taxAmount).toBe(22.5);
    expect(totals.total).toBe(172.5);
    expect(totals.perItem.map((i) => i.taxable)).toEqual([100, 50]);
    expect(totals.summary).toEqual([
      { percent: 7, taxable: 50, amount: 3.5 },
      { percent: 19, taxable: 100, amount: 19 },
    ]);
  });

  it("divides an inclusive price by the summed rate of its taxes", () => {
    const totals = calculatePerLineTotals({
      items: [
        { ...line(1, 121.5), taxes: [{ percent: 19 }, { percent: 2.5 }] },
      ],
      pricesIncludeTax: true,
    });

    expect(totals.perItem[0].taxable).toBe(100);
    expect(totals.perItem[0].taxes).toEqual([
      { percent: 19, amount: 19 },
      { percent: 2.5, amount: 2.5 },
    ]);
    expect(totals.taxAmount).toBe(21.5);
    expect(totals.total).toBe(121.5);
  });

  it("accumulates lines that share a rate into one summary row", () => {
    const totals = calculatePerLineTotals({
      items: [
        { ...line(1, 100), taxes: [{ percent: 19 }] },
        { ...line(1, 20), taxes: [{ percent: 19 }] },
      ],
    });

    expect(totals.summary).toEqual([
      { percent: 19, taxable: 120, amount: 22.8 },
    ]);
  });

  it("distributes the discount before taxing, remainder last", () => {
    const totals = calculatePerLineTotals({
      items: [
        { ...line(1, 10), taxes: [{ percent: 10 }] },
        { ...line(1, 10), taxes: [{ percent: 10 }] },
        { ...line(1, 10), taxes: [{ percent: 10 }] },
      ],
      discountAmount: 10,
    });

    expect(totals.perItem.map((i) => i.taxable)).toEqual([6.67, 6.67, 6.66]);
    expect(totals.discountAmount).toBe(10);
    // 0.67 three times: the 6.66 line still rounds up, so the tax is 2.01, not 2.
    expect(totals.taxAmount).toBe(2.01);
    expect(totals.total).toBe(22.01);
  });
});
