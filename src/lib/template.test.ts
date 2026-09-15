import { describe, expect, it } from "vitest";
import { escapeHtml, multiline, renderTemplate } from "./template";

describe("escapeHtml", () => {
  it("escapes the five characters that break out of markup", () => {
    expect(escapeHtml(`<a href="x">Tom & 'co'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;co&#39;&lt;/a&gt;",
    );
  });

  it("escapes the ampersand first, so entities are not double-broken", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("renders null and undefined as nothing", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});

describe("multiline", () => {
  it("escapes first, then converts newlines", () => {
    expect(multiline("Main St 1\n<b>Amsterdam</b>")).toBe(
      "Main St 1<br />&lt;b&gt;Amsterdam&lt;/b&gt;",
    );
  });

  it("handles Windows and old Mac line endings", () => {
    expect(multiline("a\r\nb\rc")).toBe("a<br />b<br />c");
  });
});

describe("renderTemplate", () => {
  it("interpolates and escapes a value", () => {
    expect(renderTemplate("<p>{{name}}</p>", { name: "Tom & Co" })).toBe(
      "<p>Tom &amp; Co</p>",
    );
  });

  it("tolerates spaces inside the braces", () => {
    expect(renderTemplate("{{ name }}", { name: "Kim" })).toBe("Kim");
  });

  it("leaves a missing value blank rather than printing the token", () => {
    expect(renderTemplate("[{{nope}}]", {})).toBe("[]");
  });

  it("uses the fallback when the value is missing or blank", () => {
    expect(renderTemplate('{{taxId || "—"}}', {})).toBe("—");
    expect(renderTemplate('{{taxId || "—"}}', { taxId: "" })).toBe("—");
    expect(renderTemplate('{{taxId || "—"}}', { taxId: "NL1" })).toBe("NL1");
  });

  it("escapes the fallback too", () => {
    expect(renderTemplate('{{x || "<b>"}}', {})).toBe("&lt;b&gt;");
  });

  it("passes a triple-braced value through unescaped", () => {
    expect(
      renderTemplate("{{{address}}}", { address: multiline("a\nb") }),
    ).toBe("a<br />b");
  });

  it("repeats a section once per array entry", () => {
    const out = renderTemplate("{{#items}}<li>{{description}}</li>{{/items}}", {
      items: [{ description: "Design" }, { description: "Build" }],
    });
    expect(out).toBe("<li>Design</li><li>Build</li>");
  });

  it("falls back to the outer scope inside a row", () => {
    const out = renderTemplate("{{#items}}{{qty}} {{currency}};{{/items}}", {
      currency: "EUR",
      items: [{ qty: "1" }, { qty: "2" }],
    });
    expect(out).toBe("1 EUR;2 EUR;");
  });

  it("drops a section whose value is empty or false", () => {
    expect(renderTemplate("{{#hasTax}}TAX{{/hasTax}}", { hasTax: false })).toBe(
      "",
    );
    expect(renderTemplate("{{#items}}x{{/items}}", { items: [] })).toBe("");
    expect(renderTemplate("{{#items}}x{{/items}}", {})).toBe("");
  });

  it("shows a truthy non-array section exactly once", () => {
    expect(
      renderTemplate("{{#hasTax}}Tax {{taxRate}}{{/hasTax}}", {
        hasTax: true,
        taxRate: "19%",
      }),
    ).toBe("Tax 19%");
  });

  it("keeps two sections of different names apart", () => {
    const out = renderTemplate("{{#a}}A{{/a}}{{#b}}B{{/b}}", {
      a: true,
      b: false,
    });
    expect(out).toBe("A");
  });

  it("never evaluates what a template contains", () => {
    // Templates are rows in a table; a token is a lookup, never an expression.
    expect(renderTemplate("{{constructor}}", {})).toBe("");
    expect(renderTemplate("{{__proto__}}", {})).toBe("");
  });

  it("does not re-render a value that looks like a token", () => {
    expect(
      renderTemplate("{{name}}", { name: "{{secret}}", secret: "x" }),
    ).toBe("{{name}}".replace("{{name}}", "{{secret}}"));
  });
});
