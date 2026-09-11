/**
 * §4.8 — `comma` is 1,000.00 and `period` is 1.000,00; the two locales below
 * are the shortest way to get each grouping without a formatter of our own.
 *
 * Accepts a string: drizzle hands `numeric` columns back as strings.
 */
export function formatMoney(
  amount: number | string,
  currency = "EUR",
  numberFormat: string = "comma",
) {
  const value = Number(amount);
  try {
    return new Intl.NumberFormat(
      numberFormat === "period" ? "de-DE" : "en-US",
      { style: "currency", currency },
    ).format(value);
  } catch {
    // An unknown currency code throws rather than degrading; §4.8 wants the
    // number shown regardless.
    return `${currency} ${value.toFixed(2)}`;
  }
}

/**
 * §4.8 — a `date` column is already `YYYY-MM-DD`, so this is string work, not
 * Date work: parsing it would drag the server's timezone into a calendar day.
 */
export function formatDate(value?: string | null, dateFormat = "YYYY-MM-DD") {
  const iso = (value ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return value ?? "";

  const [year, month, day] = iso.split("-");
  return dateFormat === "DD.MM.YYYY" ? `${day}.${month}.${year}` : iso;
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

/** §10.10 / §10.11 — the option and detail label for a tax definition. */
export const taxDefinitionLabel = (tax: {
  code: string | null;
  name: string | null;
  percent: string;
}) => `${tax.name || tax.code || `${tax.percent}%`} (${tax.percent}%)`;
