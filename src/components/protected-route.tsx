"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePermission } from "@/hooks/use-permission";
import { Skeleton } from "@/components/ui/skeleton";
import type { Action, Resource } from "@/lib/types";

export function ProtectedRoute({
  resource,
  action,
  children,
  fallback,
}: {
  resource: Resource;
  action: Action;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const router = useRouter();
  const { can } = usePermission();

  const hasPermission = can(resource, action);

  useEffect(() => {
    if (!hasPermission) {
      router.replace("/unauthorized");
    }
  }, [hasPermission, router]);

  if (!hasPermission) {
    return fallback ?? <Skeleton className="h-96 w-full rounded-xl" />;
  }

  return children;
}
