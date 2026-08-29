import { InvoiceEditor } from "@/components/invoice-editor";
import pageMeta from "@/lib/page-meta.json";

export const metadata = pageMeta.invoiceNew;

export default function NewInvoicePage() {
  return <InvoiceEditor />;
}
