import { notFound } from "next/navigation";
import { getCustomer } from "@/app/(app)/customers/actions";
import { CustomerEditor } from "@/components/customer-editor";

async function load(id: string) {
  const result = await getCustomer(id);
  return result.ok ? result.data : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/customers/[id]/edit">) {
  const customer = await load((await params).id);
  return { title: `Edit ${customer?.name ?? "Customer"} | Orqenta` };
}

export default async function EditCustomerPage({
  params,
}: PageProps<"/customers/[id]/edit">) {
  const customer = await load((await params).id);
  if (!customer) notFound();
  return <CustomerEditor customer={customer} />;
}
