import { getInvoice } from "@/app/(app)/invoices/actions";
import { requirePermission } from "@/lib/auth/session";
import { htmlToPdf, pdfHeaders } from "@/lib/pdf";
import { renderInvoiceHtml } from "@/lib/render-invoice";

/** §11 — the same document, printed. Exporting is its own permission. */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/invoices/[id]/pdf">,
) {
  await requirePermission("invoices", "export");

  const result = await getInvoice((await params).id);
  if (!result.ok) return new Response(result.error, { status: 403 });
  if (!result.data) return new Response("Not found", { status: 404 });

  const html = await renderInvoiceHtml(result.data);
  const pdf = await htmlToPdf(html, new URL(request.url).origin);

  return new Response(pdf, { headers: pdfHeaders(result.data.invoiceNumber) });
}
