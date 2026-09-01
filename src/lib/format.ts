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

/** §4.8 — most of the world writes the postal code first; these write the city first. */
const CITY_FIRST = new Set(["US", "GB", "BR", "AU", "CA", "NZ", "IE", "MX"]);

export function formatPostalCityLine(
  city?: string | null,
  postalCode?: string | null,
  countryCode?: string | null,
) {
  const place = city?.trim() ?? "";
  const postal = postalCode?.trim() ?? "";
  if (!place || !postal) return place || postal;
  return CITY_FIRST.has((countryCode ?? "").trim().toUpperCase())
    ? `${place} ${postal}`
    : `${postal} ${place}`;
}
