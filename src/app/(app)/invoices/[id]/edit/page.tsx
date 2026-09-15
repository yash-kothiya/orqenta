import { InvoiceEditor } from "@/components/invoice-editor";

export async function generateMetadata({
  params,
}: PageProps<"/invoices/[id]/edit">) {
  return { title: `Edit Invoice | Orqenta` };
}

export default async function EditInvoicePage({
  params,
}: PageProps<"/invoices/[id]/edit">) {
  const id = (await params).id;
  return <InvoiceEditor invoiceId={id} />;
}
