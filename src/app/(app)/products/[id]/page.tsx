import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { findProduct } from "@/lib/mock-data";

export async function generateMetadata({
  params,
}: PageProps<"/products/[id]">) {
  const product = findProduct((await params).id);
  return { title: `${product?.name ?? "Product"} | Orqenta` };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[id]">) {
  const product = findProduct((await params).id);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
