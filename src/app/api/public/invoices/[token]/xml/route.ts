import { getPublicInvoice } from "@/app/(app)/invoices/actions";
import { xmlResponse } from "@/lib/xml/respond";

/** §10.16 — the XML Data menu on the public page points here. */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/public/invoices/[token]/xml">,
) {
  const invoice = await getPublicInvoice((await params).token);
  if (!invoice) return new Response("Not found", { status: 404 });

  return xmlResponse(invoice, new URL(request.url).searchParams.get("profile"));
}
