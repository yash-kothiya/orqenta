/**
 * §11 — the invoice template language.
 *
 * Templates are HTML documents in the `templates` table, so they are data, not
 * code: this renders them without ever evaluating what they contain. The syntax
 * is deliberately four things and no more.
 *
 *   {{name}}                escaped value
 *   {{name || "fallback"}}  escaped, with a default when missing or blank
 *   {{{name}}}              raw, for values already prepared with multiline()
 *   {{#items}}…{{/items}}   repeat for an array, or show once when truthy
 */

export type TemplateValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | TemplateContext
  | TemplateValue[];

export type TemplateContext = { [key: string]: TemplateValue };

const RE_NEWLINE = /\r\n?|\n/g;

/** Escapes the five characters that can break out of text or an attribute. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * §11 — for the fields that carry line breaks, such as an address or notes.
 * Escapes first, so the result is safe to interpolate with {{{…}}}.
 */
export function multiline(value: unknown): string {
  return escapeHtml(value).replaceAll(RE_NEWLINE, "<br />");
}

const SECTION = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
const RAW = /\{\{\{\s*([\w.]+)\s*\}\}\}/g;
const TOKEN = /\{\{\s*([\w.]+)\s*(?:\|\|\s*"([^"]*)")?\s*\}\}/g;

const isContext = (value: TemplateValue): value is TemplateContext =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Innermost scope wins, then outwards — so a row can say {{currency}} and get
 * it from the invoice without every row having to carry a copy.
 */
function lookup(path: string, scopes: TemplateContext[]): TemplateValue {
  for (let i = scopes.length - 1; i >= 0; i--) {
    let value: TemplateValue = scopes[i];
    let found = true;

    for (const part of path.split(".")) {
      // hasOwn, not `in`: templates are rows a user can install (§10.14), and
      // `in` would walk the prototype chain and hand out Object internals.
      if (isContext(value) && Object.hasOwn(value, part)) value = value[part];
      else {
        found = false;
        break;
      }
    }

    if (found) return value;
  }
  return undefined;
}

const isBlank = (value: TemplateValue) =>
  value === undefined || value === null || value === "" || value === false;

const stringify = (value: TemplateValue) =>
  value === undefined || value === null || value === false ? "" : String(value);

function renderScoped(template: string, scopes: TemplateContext[]): string {
  // Sections first: their bodies contain tokens that need the row's scope.
  const withSections = template.replace(SECTION, (_match, name, body) => {
    const value = lookup(name, scopes);

    if (Array.isArray(value)) {
      return value
        .map((entry) =>
          renderScoped(body, isContext(entry) ? [...scopes, entry] : scopes),
        )
        .join("");
    }

    if (isBlank(value)) return "";
    return renderScoped(body, isContext(value) ? [...scopes, value] : scopes);
  });

  return withSections
    .replace(RAW, (_match, name) => stringify(lookup(name, scopes)))
    .replace(TOKEN, (_match, name, fallback) => {
      const value = lookup(name, scopes);
      return escapeHtml(isBlank(value) ? (fallback ?? "") : stringify(value));
    });
}

/**
 * ponytail: one pass, no caching. A template is a few kilobytes and an invoice
 * renders once per request; parse into a tree the day that shows up in a trace.
 */
export const renderTemplate = (template: string, context: TemplateContext) =>
  renderScoped(template, [context]);
