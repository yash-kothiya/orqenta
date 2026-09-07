/**
 * §4.1–4.3 — the invoice money math, ported step for step.
 *
 * `r2` is applied at every intermediate step on purpose: the results have to
 * match the original system cent for cent, so folding the roundings together
 * would be a behaviour change, not a simplification.
 */
import type { RoundingMode } from "./types";

/** §4.1 */
export const r2 = (n: number) => Math.round(n * 100) / 100;

export type MoneyLine = { quantity: number; unitPrice: number };
export type LineTax = { percent: number };

export type DiscountInput = {
  /** Wins over `discountAmount` whenever it is above zero. */
  discountPercentage?: number;
  discountAmount?: number;
};

export type InvoiceTotals = {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
};

export type InvoiceTotalsInput = DiscountInput & {
  items: MoneyLine[];
  taxRate?: number;
  pricesIncludeTax?: boolean;
  roundingMode?: RoundingMode;
};

export type PerLineItem = MoneyLine & { taxes: LineTax[] };

export type PerLineTotalsInput = DiscountInput & {
  items: PerLineItem[];
  pricesIncludeTax?: boolean;
};

export type PerLineTotals = InvoiceTotals & {
  /** One entry per item, in order — persisted into `invoice_item_taxes`. */
  perItem: { taxable: number; taxes: { percent: number; amount: number }[] }[];
  /** Grouped by rate, ascending — persisted into `invoice_taxes`. */
  summary: { percent: number; taxable: number; amount: number }[];
};

const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

/** The discount the invoice actually carries: percentage wins, clamped to the subtotal. */
function resolveDiscount(input: DiscountInput, subtotal: number) {
  const percentage = input.discountPercentage ?? 0;
  const amount =
    percentage > 0
      ? (subtotal * percentage) / 100
      : (input.discountAmount ?? 0);
  return Math.min(Math.max(amount, 0), subtotal);
}

/**
 * Split the discount across lines in proportion to their gross. The last line
 * takes whatever the rounding left over, so the parts always sum to the whole.
 */
function distributeDiscount(lineGrosses: number[], discount: number) {
  const subtotal = sum(lineGrosses);
  if (subtotal <= 0) return lineGrosses.map(() => 0);

  let distributed = 0;
  return lineGrosses.map((gross, i) => {
    if (i === lineGrosses.length - 1) return r2(discount - distributed);
    const share = r2((discount * gross) / subtotal);
    distributed += share;
    return share;
  });
}

/** §4.2 — one rate for the whole invoice. */
export function calculateInvoiceTotals(
  input: InvoiceTotalsInput,
): InvoiceTotals {
  const rate = Math.max(0, input.taxRate ?? 0) / 100;
  const lineGrosses = input.items.map((i) => i.quantity * i.unitPrice);
  const subtotal = sum(lineGrosses);
  const discount = resolveDiscount(input, subtotal);

  let taxAmount: number;
  let total: number;

  if (input.roundingMode === "line" && subtotal > 0) {
    const discounts = distributeDiscount(lineGrosses, discount);
    let taxes = 0;
    let totals = 0;

    lineGrosses.forEach((gross, i) => {
      const afterDiscount = Math.max(0, gross - discounts[i]);
      if (input.pricesIncludeTax) {
        const net = rate > 0 ? afterDiscount / (1 + rate) : afterDiscount;
        taxes += r2(afterDiscount - net);
        totals += r2(afterDiscount);
      } else {
        const tax = r2(afterDiscount * rate);
        taxes += tax;
        totals += r2(afterDiscount + tax);
      }
    });

    taxAmount = r2(taxes);
    total = r2(totals);
  } else {
    const afterDiscount = subtotal - discount;
    if (input.pricesIncludeTax) {
      const net = rate > 0 ? afterDiscount / (1 + rate) : afterDiscount;
      taxAmount = r2(afterDiscount - net);
      total = r2(afterDiscount);
    } else {
      taxAmount = r2(afterDiscount * rate);
      total = r2(afterDiscount + taxAmount);
    }
  }

  return {
    subtotal: r2(subtotal),
    discountAmount: r2(discount),
    taxAmount,
    total,
  };
}

/** §4.3 — each line carries its own set of taxes. Always distributes per line. */
export function calculatePerLineTotals(
  input: PerLineTotalsInput,
): PerLineTotals {
  const lineGrosses = input.items.map((i) => i.quantity * i.unitPrice);
  const subtotal = sum(lineGrosses);
  const discount = resolveDiscount(input, subtotal);
  const discounts = distributeDiscount(lineGrosses, discount);
  const summary = new Map<number, PerLineTotals["summary"][number]>();

  let taxAmount = 0;
  let total = 0;

  const perItem = input.items.map((item, i) => {
    const afterDiscount = Math.max(0, lineGrosses[i] - discounts[i]);
    const rateSum = sum(item.taxes.map((t) => t.percent)) / 100;
    const net =
      input.pricesIncludeTax && rateSum > 0
        ? afterDiscount / (1 + rateSum)
        : afterDiscount;

    const taxes = item.taxes.map((tax) => {
      const amount = r2((net * tax.percent) / 100);
      const percent = r2(tax.percent);
      const group = summary.get(percent) ?? { percent, taxable: 0, amount: 0 };
      group.taxable = r2(group.taxable + net);
      group.amount = r2(group.amount + amount);
      summary.set(percent, group);
      return { percent: tax.percent, amount };
    });

    const itemTaxSum = r2(sum(taxes.map((t) => t.amount)));
    taxAmount += itemTaxSum;
    total += input.pricesIncludeTax ? r2(afterDiscount) : r2(net + itemTaxSum);

    return { taxable: r2(net), taxes };
  });

  return {
    subtotal: r2(subtotal),
    discountAmount: r2(discount),
    taxAmount: r2(taxAmount),
    total: r2(total),
    perItem,
    summary: [...summary.values()].sort((a, b) => a.percent - b.percent),
  };
}
