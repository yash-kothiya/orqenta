import { Dashboard } from "@/components/dashboard";
import pageMeta from "@/lib/page-meta.json";

export const metadata = pageMeta.dashboard;

export default function DashboardPage() {
  return <Dashboard />;
}
