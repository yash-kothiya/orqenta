import { InvoiceList } from "@/components/invoice-list";
import pageMeta from "@/lib/page-meta.json";

export const metadata = pageMeta.invoices;

export default function InvoicesPage() {
  return <InvoiceList />;
}
