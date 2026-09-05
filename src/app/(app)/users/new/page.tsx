import { UserEditor } from "@/components/user-editor";
import pageMeta from "@/lib/page-meta.json";

export const metadata = pageMeta.userNew;

export default function NewUserPage() {
  return <UserEditor />;
}
