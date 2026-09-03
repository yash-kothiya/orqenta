import { notFound } from "next/navigation";
import { InvoiceDetail } from "@/components/invoice-detail";
import { findInvoice } from "@/lib/mock-data";

export async function generateMetadata({
  params,
}: PageProps<"/invoices/[id]">) {
  const invoice = findInvoice((await params).id);
  return { title: `${invoice?.invoiceNumber ?? "Invoice"} | Orqenta` };
}

export default async function InvoicePage({
  params,
}: PageProps<"/invoices/[id]">) {
  const invoice = findInvoice((await params).id);
  if (!invoice) notFound();
  return <InvoiceDetail invoice={invoice} />;
}
