import { UserEditor } from "@/components/user-editor";

export async function generateMetadata({
  params,
}: PageProps<"/users/[id]">) {
  return { title: `User | Orqenta` };
}

export default async function UserPage({
  params,
}: PageProps<"/users/[id]">) {
  const id = (await params).id;
  return <UserEditor userId={id} />;
}
