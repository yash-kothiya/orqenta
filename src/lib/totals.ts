// ponytail: deliberately naive — enough to make the totals move while you review
// the UI. Replace with the §4.2 / §4.3 algorithms (per-line vs total rounding,
// discount remainder distribution) when money.ts lands.

type Numeric = string | number;

/** Loose on purpose: the editor keeps numbers as strings, the fixtures don't. */
export type TotalsInput = {
  items: {
    quantity: Numeric;
    unitPrice: Numeric;
    taxPercent: Numeric;
  }[];
  taxMode: "invoice" | "line";
  taxRate: Numeric;
  pricesIncludeTax: boolean | "yes" | "no";
  discount?: Numeric;
};

const num = (v: Numeric) => Number(v) || 0;

export function computeTotals(input: TotalsInput) {
  const inclusive =
    input.pricesIncludeTax === true || input.pricesIncludeTax === "yes";
  let net = 0;
  let tax = 0;

  for (const item of input.items) {
    const gross = num(item.quantity) * num(item.unitPrice);
    const rate =
      (input.taxMode === "line" ? num(item.taxPercent) : num(input.taxRate)) /
      100;

    if (inclusive) {
      const lineNet = gross / (1 + rate);
      net += lineNet;
      tax += gross - lineNet;
    } else {
      net += gross;
      tax += gross * rate;
    }
  }

  const discount = num(input.discount ?? 0);
  return { subtotal: net, tax, discount, total: net + tax - discount };
}
