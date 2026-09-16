"use client";

import { useCallback } from "react";
import { useUser } from "@/hooks/use-user";
import { hasPermission, type Action, type Resource } from "@/lib/types";
import { getUserPermissions as getResourcePermissions } from "@/lib/permission-helpers";

export function usePermission() {
  const { user } = useUser();

  const can = useCallback(
    (resource: Resource, action: Action) => {
      if (!user) return false;
      return hasPermission(user, resource, action);
    },
    [user],
  );

  const canAny = useCallback(
    (permissions: Array<{ resource: Resource; action: Action }>) => {
      if (!user) return false;
      return permissions.some(({ resource, action }) =>
        hasPermission(user, resource, action),
      );
    },
    [user],
  );

  const canAll = useCallback(
    (permissions: Array<{ resource: Resource; action: Action }>) => {
      if (!user) return false;
      return permissions.every(({ resource, action }) =>
        hasPermission(user, resource, action),
      );
    },
    [user],
  );

  // Helper to get all CRUD permissions for a resource at once
  const getPermissions = useCallback(
    (resource: Resource) => {
      return getResourcePermissions(user ?? null, resource);
    },
    [user],
  );

  return { can, canAny, canAll, getPermissions };
}
