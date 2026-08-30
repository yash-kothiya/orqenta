import { ProductEditor } from "@/components/product-editor";
import pageMeta from "@/lib/page-meta.json";

export const metadata = pageMeta.productNew;

export default function NewProductPage() {
  return <ProductEditor />;
}
