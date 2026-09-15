import { InvoiceDetail } from "@/components/invoice-detail";

export async function generateMetadata({
  params,
}: PageProps<"/invoices/[id]">) {
  return { title: `Invoice | Orqenta` };
}

export default async function InvoicePage({
  params,
}: PageProps<"/invoices/[id]">) {
  const id = (await params).id;
  return <InvoiceDetail invoiceId={id} />;
}
