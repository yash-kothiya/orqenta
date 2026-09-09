/**
 * §4.4 — invoice numbering.
 *
 * The sequence tokens need to read existing invoice numbers, so the counter
 * lookup is passed in rather than imported: the §6 actions hand over a
 * db-backed one, and the tests hand over an array.
 */

/** No I, O, 0 or 1 — nobody should have to guess which character they are reading. */
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type NumberingSettings = {
  invoiceNumberPattern: string;
  invoiceNumberingEnabled: boolean;
  invoicePrefix: string;
  invoiceIncludeYear: boolean;
  invoiceNumberPadding: string | number;
};

/**
 * Highest sequence already issued under `likePrefix`, scoped to one customer
 * when `customerId` is given. 0 when nothing matches.
 */
export type FindMaxSequence = (
  likePrefix: string,
  customerId?: string,
) => Promise<number> | number;

/** 256 divides evenly by the 32-character alphabet, so `%` introduces no bias. */
export function randomCode(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join(
    "",
  );
}

/** The placeholder a draft carries until it is published and earns a real number. */
export const draftInvoiceNumber = () => `DRAFT-${randomCode(6)}`;

const SEQUENCE_TOKEN = /\{(SEQ|CSEQ|CNUM)\}/;

/** Whether a pattern allocates a real number, or is just a formatted string. */
export const hasSequenceToken = (pattern: string) =>
  SEQUENCE_TOKEN.test(pattern);

const pad = (n: number | string, width: number) =>
  String(n).padStart(width, "0");

/** Date and random tokens — everything that resolves without touching the database. */
export function expandVolatileTokens(
  pattern: string,
  now = new Date(),
  rand4 = randomCode(4),
) {
  const yyyy = String(now.getFullYear());
  const mm = pad(now.getMonth() + 1, 2);
  const dd = pad(now.getDate(), 2);

  return pattern
    .replaceAll("{YYYY}", yyyy)
    .replaceAll("{YY}", yyyy.slice(2))
    .replaceAll("{MM}", mm)
    .replaceAll("{DD}", dd)
    .replaceAll("{DATE}", `${yyyy}${mm}${dd}`)
    .replaceAll("{RAND4}", rand4);
}

/** Legacy mode's fully literal prefix: `INV-2026-` , or `INV-` without the year. */
export const legacyPrefix = (s: NumberingSettings, now = new Date()) =>
  s.invoiceIncludeYear
    ? `${s.invoicePrefix}-${now.getFullYear()}-`
    : `${s.invoicePrefix}-`;

/** Legacy mode pads to a configurable width; the pattern tokens always pad to 3. */
export const sequencePadding = (s: NumberingSettings) =>
  Math.min(8, Math.max(2, Number(s.invoiceNumberPadding) || 3));

/**
 * The digits straight after `likePrefix`, highest wins. Give it the rows a
 * `LIKE '<likePrefix>%'` query returned. String-sliced rather than built into
 * a regex, so a prefix full of punctuation needs no escaping.
 */
export function maxSequenceIn(numbers: string[], likePrefix: string): number {
  let max = 0;
  for (const number of numbers) {
    if (!number.startsWith(likePrefix)) continue;
    const digits = /^\d+/.exec(number.slice(likePrefix.length));
    if (digits) max = Math.max(max, Number(digits[0]));
  }
  return max;
}

export type NextNumberOptions = {
  customerId?: string;
  /** The customer's permanent `customer_number`, for `{CNUM}`. */
  customerNumber?: number | null;
  now?: Date;
};

export async function getNextInvoiceNumber(
  settings: NumberingSettings,
  findMaxSequence: FindMaxSequence,
  options: NextNumberOptions = {},
): Promise<string> {
  const { customerId, customerNumber, now = new Date() } = options;
  const pattern = (settings.invoiceNumberPattern ?? "").trim();

  if (!pattern || !settings.invoiceNumberingEnabled) {
    const prefix = legacyPrefix(settings, now);
    const next = (await findMaxSequence(prefix)) + 1;
    return prefix + pad(next, sequencePadding(settings));
  }

  let number = expandVolatileTokens(pattern, now);
  if (!hasSequenceToken(number)) return number;

  // {CNUM} first: the counters below use everything to their left as a LIKE
  // prefix, so any token still sitting there would freeze the counter at 1.
  number = number.replaceAll(
    "{CNUM}",
    customerNumber == null ? "" : pad(customerNumber, 3),
  );

  for (const token of ["{SEQ}", "{CSEQ}"] as const) {
    while (number.includes(token)) {
      const prefix = number.slice(0, number.indexOf(token));
      const scope = token === "{CSEQ}" ? customerId : undefined;
      const next = (await findMaxSequence(prefix, scope)) + 1;
      number = number.replace(token, pad(next, 3));
    }
  }

  return number;
}
