import { notFound } from "next/navigation";
import { getProduct } from "@/app/(app)/products/actions";
import { ProductDetail } from "@/components/product-detail";

/** Read on the server: the title needs the row before anything renders. */
async function load(id: string) {
  const result = await getProduct(id);
  return result.ok ? result.data : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[id]">) {
  const product = await load((await params).id);
  return { title: `${product?.name ?? "Product"} | Orqenta` };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[id]">) {
  const product = await load((await params).id);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
