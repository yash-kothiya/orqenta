import { getInvoice } from "@/app/(app)/invoices/actions";
import { requirePermission } from "@/lib/auth/session";
import { xmlResponse } from "@/lib/xml/respond";

/** §10.5 — the owner's e-invoice download. Exporting is its own permission. */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/invoices/[id]/xml">,
) {
  await requirePermission("invoices", "export");

  const result = await getInvoice((await params).id);
  if (!result.ok) return new Response(result.error, { status: 403 });
  if (!result.data) return new Response("Not found", { status: 404 });

  return xmlResponse(
    result.data,
    new URL(request.url).searchParams.get("profile"),
  );
}
