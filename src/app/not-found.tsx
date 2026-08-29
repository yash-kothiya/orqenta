import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import Link from "next/link";

export const metadata = {
  title: "Page not found | Orqenta",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <SiteHeader />
      <Empty className="flex-1">
        <EmptyHeader>
          <span className="font-heading text-5xl font-semibold tracking-tight">
            404
          </span>
          <EmptyTitle>Page not found</EmptyTitle>
          <EmptyDescription>
            That page moved, or never existed. Check the URL or head back to
            your dashboard.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/dashboard" />}>Back to dashboard</Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
