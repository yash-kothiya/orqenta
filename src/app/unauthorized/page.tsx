import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Unauthorized | Orqenta",
};

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold">403</h1>
        <p className="mt-2 text-xl font-semibold">Access Denied</p>
        <p className="mt-2 text-muted-foreground">
          You do not have permission to access this resource.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Contact your administrator if you believe you should have access.
        </p>
        <div className="mt-6 flex gap-4 justify-center">
          <Button render={<Link href="/dashboard" />}>
            Back to Dashboard
          </Button>
          <Button variant="outline" render={<Link href="/settings?section=company" />}>
            Account Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
