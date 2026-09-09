import { notFound } from "next/navigation";
import { getProduct } from "@/app/(app)/products/actions";
import { ProductEditor } from "@/components/product-editor";

async function load(id: string) {
  const result = await getProduct(id);
  return result.ok ? result.data : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[id]/edit">) {
  const product = await load((await params).id);
  return { title: `Edit ${product?.name ?? "Product"} | Orqenta` };
}

export default async function EditProductPage({
  params,
}: PageProps<"/products/[id]/edit">) {
  const product = await load((await params).id);
  if (!product) notFound();
  return <ProductEditor product={product} />;
}
