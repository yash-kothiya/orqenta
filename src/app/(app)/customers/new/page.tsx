import { CustomerEditor } from "@/components/customer-editor";
import pageMeta from "@/lib/page-meta.json";

export const metadata = pageMeta.customerNew;

export default function NewCustomerPage() {
  return <CustomerEditor />;
}
