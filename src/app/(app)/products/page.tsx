import { ProductList } from "@/components/product-list";
import pageMeta from "@/lib/page-meta.json";

export const metadata = pageMeta.products;

export default function ProductsPage() {
  return <ProductList />;
}
