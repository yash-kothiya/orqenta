/**
 * §2.0 ids: `<prefix>_<uuid v4>` — 4-char prefix + 36 = 41, inside varchar(50).
 * The spec calls for the `uuid` package; crypto.randomUUID is the same v4 format
 * from the platform, so there is no dependency here.
 */
export const generateId = (prefix: string): string =>
  `${prefix}_${crypto.randomUUID()}`;
