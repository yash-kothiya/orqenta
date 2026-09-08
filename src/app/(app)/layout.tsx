import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Every page in this group is behind the session; /public/invoices/[token] is
  // the one app page outside it (§5).
  const user = await requireUser();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
