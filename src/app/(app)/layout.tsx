import { SiteHeader } from "@/components/site-header";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
