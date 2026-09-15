/**
 * §11 — turn one invoice into an HTML document.
 *
 * Server-side only, and shared by the owner's route, the PDF printer and the
 * public page, so all three render the identical document.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, templates } from "@/db/schema/tables";
import {
  BUILTIN_TEMPLATE_HTML,
  BUILTIN_TEMPLATE_NAME,
} from "@/lib/builtin-template";
import { buildInvoiceContext } from "@/lib/invoice-context";
import { rowsToSettings } from "@/lib/settings";
import { renderTemplate } from "@/lib/template";
import type { InvoiceWithDetails } from "@/lib/types";

/**
 * The configured template, else the one marked default, else the built-in.
 * A missing row falls through rather than failing the render: an invoice that
 * cannot be shown is worse than one shown in the standard layout.
 */
async function resolveTemplate(templateId: string) {
  if (templateId) {
    const chosen = await db.query.templates.findFirst({
      where: eq(templates.id, templateId),
    });
    if (chosen?.html) return chosen.html;
  }

  const fallback = await db.query.templates.findFirst({
    where: eq(templates.isDefault, true),
  });
  if (fallback?.html) return fallback.html;

  const builtin = await db.query.templates.findFirst({
    where: eq(templates.name, BUILTIN_TEMPLATE_NAME),
  });
  return builtin?.html ?? BUILTIN_TEMPLATE_HTML;
}

export async function renderInvoiceHtml(invoice: InvoiceWithDetails) {
  const config = rowsToSettings(await db.select().from(settings));
  const html = await resolveTemplate(config.templateId);
  return renderTemplate(html, buildInvoiceContext(invoice, config));
}
