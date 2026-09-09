import { Suspense } from "react";
import { SettingsForm } from "@/components/settings-form";
import { getSessionUser } from "@/lib/auth/session";
import pageMeta from "@/lib/page-meta.json";
import { hasPermission } from "@/lib/types";

export const metadata = pageMeta.settings;

export default async function SettingsPage() {
  const user = await getSessionUser();

  // useSearchParams reads ?section= client-side, so it needs a boundary.
  return (
    <Suspense>
      <SettingsForm canEdit={hasPermission(user, "settings", "update")} />
    </Suspense>
  );
}
