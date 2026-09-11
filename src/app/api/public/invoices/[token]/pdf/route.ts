import { getPublicInvoice } from "@/app/(app)/invoices/actions";
import { htmlToPdf, pdfHeaders } from "@/lib/pdf";
import { renderInvoiceHtml } from "@/lib/render-invoice";

/** §11 — the public download, reached by share token and never by id. */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/public/invoices/[token]/pdf">,
) {
  const invoice = await getPublicInvoice((await params).token);
  if (!invoice) return new Response("Not found", { status: 404 });

  const html = await renderInvoiceHtml(invoice);
  const pdf = await htmlToPdf(html, new URL(request.url).origin);

  return new Response(pdf, { headers: pdfHeaders(invoice.invoiceNumber) });
}
