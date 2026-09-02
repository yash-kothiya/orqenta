import { CustomerList } from "@/components/customer-list";
import pageMeta from "@/lib/page-meta.json";

export const metadata = pageMeta.customers;

export default function CustomersPage() {
  return <CustomerList />;
}
