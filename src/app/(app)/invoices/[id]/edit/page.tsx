import { notFound } from "next/navigation";
import { InvoiceEditor } from "@/components/invoice-editor";
import { findInvoice } from "@/lib/mock-data";

export async function generateMetadata({
  params,
}: PageProps<"/invoices/[id]/edit">) {
  const invoice = findInvoice((await params).id);
  return { title: `Edit ${invoice?.invoiceNumber ?? "Invoice"} | Orqenta` };
}

export default async function EditInvoicePage({
  params,
}: PageProps<"/invoices/[id]/edit">) {
  const invoice = findInvoice((await params).id);
  if (!invoice) notFound();
  return <InvoiceEditor invoice={invoice} />;
}
