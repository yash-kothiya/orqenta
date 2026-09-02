import { notFound } from "next/navigation";
import { CustomerDetail } from "@/components/customer-detail";
import { findCustomer } from "@/lib/mock-data";

export async function generateMetadata({
  params,
}: PageProps<"/customers/[id]">) {
  const customer = findCustomer((await params).id);
  return { title: `${customer?.name ?? "Customer"} | Orqenta` };
}

export default async function CustomerPage({
  params,
}: PageProps<"/customers/[id]">) {
  const customer = findCustomer((await params).id);
  if (!customer) notFound();
  return <CustomerDetail customer={customer} />;
}
