import { describe, expect, it } from "vitest";
import {
  CODE_ALPHABET,
  draftInvoiceNumber,
  expandVolatileTokens,
  getNextInvoiceNumber,
  hasSequenceToken,
  maxSequenceIn,
  type NumberingSettings,
  randomCode,
} from "./numbering";

const SEP_7_2026 = new Date(2026, 8, 7);

const settings = (
  over: Partial<NumberingSettings> = {},
): NumberingSettings => ({
  invoiceNumberPattern: "",
  invoiceNumberingEnabled: true,
  invoicePrefix: "INV",
  invoiceIncludeYear: true,
  invoiceNumberPadding: "3",
  ...over,
});

/** Stands in for the database scan, and records what it was asked for. */
function lookup(highest: number | Record<string, number> = 0) {
  const calls: { prefix: string; customerId?: string }[] = [];
  return {
    calls,
    fn: (prefix: string, customerId?: string) => {
      calls.push({ prefix, customerId });
      return typeof highest === "number" ? highest : (highest[prefix] ?? 0);
    },
  };
}

describe("randomCode", () => {
  it("draws from an alphabet without I, O, 0 or 1", () => {
    const code = randomCode(200);
    expect(code).toHaveLength(200);
    expect([...code].every((c) => CODE_ALPHABET.includes(c))).toBe(true);
    expect(code).not.toMatch(/[IO01]/);
  });

  it("shapes a draft placeholder", () => {
    expect(draftInvoiceNumber()).toMatch(/^DRAFT-[A-HJ-NP-Z2-9]{6}$/);
  });
});

describe("maxSequenceIn", () => {
  const numbers = [
    "INV-2026-001",
    "INV-2026-042",
    "INV-2025-999",
    "INV-2026-007-A",
    "INV-2026-draft",
  ];

  it("takes the highest run of digits after the prefix", () => {
    expect(maxSequenceIn(numbers, "INV-2026-")).toBe(42);
  });

  it("ignores anything under a different prefix", () => {
    expect(maxSequenceIn(numbers, "ACME-")).toBe(0);
  });

  it("does not need the prefix escaped", () => {
    expect(maxSequenceIn(["A.B(1)-005"], "A.B(1)-")).toBe(5);
  });

  it("is zero when nothing has been issued", () => {
    expect(maxSequenceIn([], "INV-")).toBe(0);
  });
});

describe("expandVolatileTokens", () => {
  it("resolves every date token", () => {
    expect(
      expandVolatileTokens("{YYYY}|{YY}|{MM}|{DD}|{DATE}", SEP_7_2026, "AAAA"),
    ).toBe("2026|26|09|07|20260907");
  });

  it("resolves {RAND4} to four characters", () => {
    expect(expandVolatileTokens("X-{RAND4}", SEP_7_2026)).toMatch(
      /^X-[A-HJ-NP-Z2-9]{4}$/,
    );
  });

  it("leaves the sequence tokens alone", () => {
    const out = expandVolatileTokens("{YY}{SEQ}{CSEQ}{CNUM}", SEP_7_2026);
    expect(out).toBe("26{SEQ}{CSEQ}{CNUM}");
    expect(hasSequenceToken(out)).toBe(true);
  });
});

describe("getNextInvoiceNumber", () => {
  it("never scans for a pattern that has no counter in it", async () => {
    const db = lookup(9);
    expect(
      await getNextInvoiceNumber(
        settings({ invoiceNumberPattern: "{YYYY}-{MM}" }),
        db.fn,
        { now: SEP_7_2026 },
      ),
    ).toBe("2026-09");
    expect(db.calls).toHaveLength(0);
  });

  it("scans on everything left of {SEQ} and pads to three", async () => {
    const db = lookup(41);
    expect(
      await getNextInvoiceNumber(
        settings({ invoiceNumberPattern: "INV-{YYYY}-{SEQ}" }),
        db.fn,
        { now: SEP_7_2026 },
      ),
    ).toBe("INV-2026-042");
    expect(db.calls).toEqual([{ prefix: "INV-2026-", customerId: undefined }]);
  });

  it("scopes {CSEQ} to the customer", async () => {
    const db = lookup(2);
    expect(
      await getNextInvoiceNumber(
        settings({ invoiceNumberPattern: "A-{CSEQ}" }),
        db.fn,
        { customerId: "cus_1", now: SEP_7_2026 },
      ),
    ).toBe("A-003");
    expect(db.calls).toEqual([{ prefix: "A-", customerId: "cus_1" }]);
  });

  it("resolves {CNUM} before the counters, so the scan prefix is literal", async () => {
    const db = lookup(0);
    expect(
      await getNextInvoiceNumber(
        settings({ invoiceNumberPattern: "{CNUM}-{SEQ}" }),
        db.fn,
        { customerNumber: 7, now: SEP_7_2026 },
      ),
    ).toBe("007-001");
    // The counter would be stuck at 1 forever if this read "{CNUM}-".
    expect(db.calls[0].prefix).toBe("007-");
  });

  it("drops {CNUM} when the customer is unknown", async () => {
    const db = lookup(0);
    expect(
      await getNextInvoiceNumber(
        settings({ invoiceNumberPattern: "X{CNUM}-{SEQ}" }),
        db.fn,
        { now: SEP_7_2026 },
      ),
    ).toBe("X-001");
  });

  it("resolves each counter against its own prefix", async () => {
    const db = lookup({ "": 4, "005-": 8 });
    expect(
      await getNextInvoiceNumber(
        settings({ invoiceNumberPattern: "{SEQ}-{CSEQ}" }),
        db.fn,
        { now: SEP_7_2026 },
      ),
    ).toBe("005-009");
  });

  it("falls back to prefix-year-sequence with no pattern", async () => {
    const db = lookup(41);
    expect(
      await getNextInvoiceNumber(settings(), db.fn, { now: SEP_7_2026 }),
    ).toBe("INV-2026-042");
    expect(db.calls).toEqual([{ prefix: "INV-2026-", customerId: undefined }]);
  });

  it("drops the year and honours the padding", async () => {
    expect(
      await getNextInvoiceNumber(
        settings({ invoiceIncludeYear: false, invoiceNumberPadding: "8" }),
        lookup(41).fn,
        { now: SEP_7_2026 },
      ),
    ).toBe("INV-00000042");
  });

  it("clamps the padding to 2-8", async () => {
    const narrow = await getNextInvoiceNumber(
      settings({ invoiceNumberPadding: "1" }),
      lookup(0).fn,
      { now: SEP_7_2026 },
    );
    const wide = await getNextInvoiceNumber(
      settings({ invoiceNumberPadding: "99" }),
      lookup(0).fn,
      { now: SEP_7_2026 },
    );
    expect(narrow).toBe("INV-2026-01");
    expect(wide).toBe("INV-2026-00000001");
  });

  it("ignores the pattern when numbering is switched off", async () => {
    expect(
      await getNextInvoiceNumber(
        settings({
          invoiceNumberPattern: "{YYYY}-{SEQ}",
          invoiceNumberingEnabled: false,
        }),
        lookup(0).fn,
        { now: SEP_7_2026 },
      ),
    ).toBe("INV-2026-001");
  });
});
