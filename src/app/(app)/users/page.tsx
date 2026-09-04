import { UserList } from "@/components/user-list";
import pageMeta from "@/lib/page-meta.json";

export const metadata = pageMeta.users;

export default function UsersPage() {
  return <UserList />;
}
