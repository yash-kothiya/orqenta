/**
 * §10.16 — one place that turns an invoice into an XML response, so the owner
 * route and the public route cannot drift apart.
 */
import { db } from "@/db";
import { settings } from "@/db/schema/tables";
import { rowsToSettings } from "@/lib/settings";
import type { InvoiceWithDetails } from "@/lib/types";
import { buildUblInvoice, type UblProfile } from "./ubl";

const UBL_PROFILES: Record<string, UblProfile> = {
  ubl: "ubl",
  ubl21: "ubl21",
};

export async function xmlResponse(
  invoice: InvoiceWithDetails,
  requested: string | null,
) {
  const config = rowsToSettings(await db.select().from(settings));
  // No profile on the query means the one configured in §7.
  const key = requested ?? config.xmlProfileId;
  const profile = UBL_PROFILES[key];

  if (!profile) {
    // Factur-X and FatturaPA are listed in the settings dropdown but not built.
    // Saying so is better than handing over a UBL file under another name.
    return new Response(`The ${key} profile is not implemented yet.`, {
      status: 501,
    });
  }

  const filename = invoice.invoiceNumber.replace(/[^\w.-]/g, "_");

  return new Response(buildUblInvoice(invoice, config, profile), {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}.xml"`,
      "cache-control": "no-store",
    },
  });
}
