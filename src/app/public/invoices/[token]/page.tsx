import { notFound } from "next/navigation";
import { PublicInvoice } from "@/components/public-invoice";
import { findInvoiceByToken } from "@/lib/mock-data";

export async function generateMetadata({
  params,
}: PageProps<"/public/invoices/[token]">) {
  const invoice = findInvoiceByToken((await params).token);
  return { title: `Invoice ${invoice?.invoiceNumber ?? ""} | Orqenta`.trim() };
}

export default async function PublicInvoicePage({
  params,
}: PageProps<"/public/invoices/[token]">) {
  const { token } = await params;
  if (!findInvoiceByToken(token)) notFound();
  return <PublicInvoice token={token} />;
}
