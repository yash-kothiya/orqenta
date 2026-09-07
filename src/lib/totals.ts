// The UI keeps every number as a string and carries one tax percent per row;
// this adapts that shape onto the §4.2 / §4.3 algorithms in `money.ts`.
import { calculateInvoiceTotals, calculatePerLineTotals } from "./money";
import type { RoundingMode, TaxMode } from "./types";

type Numeric = string | number;

/** Loose on purpose: the editor keeps numbers as strings, the fixtures don't. */
export type TotalsInput = {
  items: {
    quantity: Numeric;
    unitPrice: Numeric;
    taxPercent: Numeric;
  }[];
  taxMode: TaxMode;
  taxRate: Numeric;
  pricesIncludeTax: boolean | "yes" | "no";
  roundingMode?: RoundingMode;
  discount?: Numeric;
};

const num = (v: Numeric) => Number(v) || 0;

export function computeTotals(input: TotalsInput) {
  const pricesIncludeTax =
    input.pricesIncludeTax === true || input.pricesIncludeTax === "yes";
  const discountAmount = num(input.discount ?? 0);
  const items = input.items.map((i) => ({
    quantity: num(i.quantity),
    unitPrice: num(i.unitPrice),
  }));

  const totals =
    input.taxMode === "line"
      ? calculatePerLineTotals({
          items: items.map((item, i) => ({
            ...item,
            taxes: [{ percent: num(input.items[i].taxPercent) }],
          })),
          discountAmount,
          pricesIncludeTax,
        })
      : calculateInvoiceTotals({
          items,
          taxRate: num(input.taxRate),
          discountAmount,
          pricesIncludeTax,
          roundingMode: input.roundingMode ?? "total",
        });

  return {
    subtotal: totals.subtotal,
    tax: totals.taxAmount,
    discount: totals.discountAmount,
    total: totals.total,
  };
}
