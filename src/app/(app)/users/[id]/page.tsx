import { notFound } from "next/navigation";
import { UserEditor } from "@/components/user-editor";
import { findUser, userLabel } from "@/lib/mock-data";

export async function generateMetadata({ params }: PageProps<"/users/[id]">) {
  const user = findUser((await params).id);
  return { title: `${user ? userLabel(user) : "User"} | Orqenta` };
}

export default async function UserPage({ params }: PageProps<"/users/[id]">) {
  const user = findUser((await params).id);
  if (!user) notFound();
  return <UserEditor user={user} />;
}
