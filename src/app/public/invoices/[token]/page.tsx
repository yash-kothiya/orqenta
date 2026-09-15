import { notFound } from "next/navigation";
import { getPublicInvoice } from "@/app/(app)/invoices/actions";
import { PublicInvoice } from "@/components/public-invoice";

export async function generateMetadata({
  params,
}: PageProps<"/public/invoices/[token]">) {
  const invoice = await getPublicInvoice((await params).token);
  return { title: `Invoice ${invoice?.invoiceNumber ?? ""} | Orqenta`.trim() };
}

export default async function PublicInvoicePage({
  params,
}: PageProps<"/public/invoices/[token]">) {
  const { token } = await params;
  const invoice = await getPublicInvoice(token);
  if (!invoice) notFound();
  return <PublicInvoice token={token} />;
}
