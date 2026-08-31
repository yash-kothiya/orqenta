import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/product-editor";
import { findProduct } from "@/lib/mock-data";

export async function generateMetadata({
  params,
}: PageProps<"/products/[id]/edit">) {
  const product = findProduct((await params).id);
  return { title: `Edit ${product?.name ?? "Product"} | Orqenta` };
}

export default async function EditProductPage({
  params,
}: PageProps<"/products/[id]/edit">) {
  const product = findProduct((await params).id);
  if (!product) notFound();
  return <ProductEditor product={product} />;
}
