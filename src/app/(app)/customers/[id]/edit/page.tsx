import { notFound } from "next/navigation";
import { CustomerEditor } from "@/components/customer-editor";
import { findCustomer } from "@/lib/mock-data";

export async function generateMetadata({
  params,
}: PageProps<"/customers/[id]/edit">) {
  const customer = findCustomer((await params).id);
  return { title: `Edit ${customer?.name ?? "Customer"} | Orqenta` };
}

export default async function EditCustomerPage({
  params,
}: PageProps<"/customers/[id]/edit">) {
  const customer = findCustomer((await params).id);
  if (!customer) notFound();
  return <CustomerEditor customer={customer} />;
}
