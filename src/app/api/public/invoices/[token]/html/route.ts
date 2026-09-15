import { getPublicInvoice } from "@/app/(app)/invoices/actions";
import { renderInvoiceHtml } from "@/lib/render-invoice";

/** §11 — the public render, reached by share token and never by id (§10.16). */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/public/invoices/[token]/html">,
) {
  const invoice = await getPublicInvoice((await params).token);
  if (!invoice) return new Response("Not found", { status: 404 });

  return new Response(await renderInvoiceHtml(invoice), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // A share link is a bearer token, so nothing shared may be cached.
      "cache-control": "no-store",
    },
  });
}
