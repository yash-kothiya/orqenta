// ponytail: §7 dateFormat/numberFormat settings aren't wired yet — this is the
// plain en-US default. Read them from settings when that page exists.
export function formatMoney(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function compareText(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}
