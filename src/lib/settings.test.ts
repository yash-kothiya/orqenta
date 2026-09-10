import { describe, expect, it } from "vitest";
import {
  CLEARABLE_SETTING_KEYS,
  isSettingKey,
  rowsToSettings,
  SETTING_DEFAULTS,
} from "./settings";

const row = (key: string, value: string) => ({ key, value });

describe("rowsToSettings", () => {
  it("falls back to the §7 defaults for anything unstored", () => {
    expect(rowsToSettings([])).toEqual(SETTING_DEFAULTS);
  });

  it("turns stored text back into booleans", () => {
    const settings = rowsToSettings([
      row("invoiceNumberingEnabled", "false"),
      row("embedXmlInPdf", "true"),
    ]);

    expect(settings.invoiceNumberingEnabled).toBe(false);
    expect(settings.embedXmlInPdf).toBe(true);
    // Anything that is not "true" is false, never the string.
    expect(settings.defaultPricesIncludeTax).toBe(false);
  });

  it("reads a legacy key forward into its §7 name", () => {
    const settings = rowsToSettings([
      row("logoUrl", "/uploads/logos/old.png"),
      row("taxId", "NL812345678B01"),
    ]);

    expect(settings.logo).toBe("/uploads/logos/old.png");
    expect(settings.companyTaxId).toBe("NL812345678B01");
  });

  it("prefers the canonical row over the legacy one it aliases", () => {
    const settings = rowsToSettings([
      row("logoUrl", "/uploads/logos/old.png"),
      row("logo", "/uploads/logos/new.svg"),
    ]);

    expect(settings.logo).toBe("/uploads/logos/new.svg");
  });

  it("ignores a key that is not in the §7 list", () => {
    expect(rowsToSettings([row("locale", "nl-NL")])).toEqual(SETTING_DEFAULTS);
  });

  it("keeps an explicitly stored empty string", () => {
    expect(rowsToSettings([row("companyName", "")]).companyName).toBe("");
  });
});

describe("setting keys", () => {
  it("recognises only §7 keys", () => {
    expect(isSettingKey("companyName")).toBe(true);
    expect(isSettingKey("locale")).toBe(false);
  });

  it("only lets company fields be cleared away entirely", () => {
    for (const key of CLEARABLE_SETTING_KEYS) {
      expect(isSettingKey(key)).toBe(true);
      expect(SETTING_DEFAULTS[key]).toBeTypeOf("string");
    }
  });
});
