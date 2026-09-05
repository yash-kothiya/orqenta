import { Suspense } from "react";
import { SettingsForm } from "@/components/settings-form";
import pageMeta from "@/lib/page-meta.json";

export const metadata = pageMeta.settings;

export default function SettingsPage() {
  // useSearchParams reads ?section= client-side, so it needs a boundary.
  return (
    <Suspense>
      <SettingsForm />
    </Suspense>
  );
}
