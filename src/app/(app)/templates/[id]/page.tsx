import { TemplateEditor } from "@/components/template-editor";

export async function generateMetadata({
  params,
}: PageProps<"/templates/[id]">) {
  return { title: `Template | Orqenta` };
}

export default async function TemplateEditPage({
  params,
}: PageProps<"/templates/[id]">) {
  const id = (await params).id;
  return <TemplateEditor templateId={id} />;
}
