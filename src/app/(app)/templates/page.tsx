import { TemplateList } from "@/components/template-list";
import pageMeta from "@/lib/page-meta.json";

export const metadata = pageMeta.templates;

export default function TemplatesPage() {
  return <TemplateList />;
}
