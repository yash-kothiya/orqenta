import { getInvoice } from "@/app/(app)/invoices/actions";
import { renderInvoiceHtml } from "@/lib/render-invoice";

/** §11 — the owner's render. getInvoice already gates on invoices:read. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/invoices/[id]/html">,
) {
  const result = await getInvoice((await params).id);
  if (!result.ok) return new Response(result.error, { status: 403 });
  if (!result.data) return new Response("Not found", { status: 404 });

  return new Response(await renderInvoiceHtml(result.data), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
