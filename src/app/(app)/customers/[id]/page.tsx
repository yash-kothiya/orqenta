import { notFound } from "next/navigation";
import { getCustomer } from "@/app/(app)/customers/actions";
import { CustomerDetail } from "@/components/customer-detail";

/** Read on the server: the title needs the row before anything renders. */
async function load(id: string) {
  const result = await getCustomer(id);
  return result.ok ? result.data : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/customers/[id]">) {
  const customer = await load((await params).id);
  return { title: `${customer?.name ?? "Customer"} | Orqenta` };
}

export default async function CustomerPage({
  params,
}: PageProps<"/customers/[id]">) {
  const customer = await load((await params).id);
  if (!customer) notFound();
  return <CustomerDetail customer={customer} />;
}
