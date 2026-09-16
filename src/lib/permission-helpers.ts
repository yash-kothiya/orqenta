import type { Action, Resource, SessionUser } from "@/lib/types";
import { hasPermission } from "@/lib/types";

/**
 * Check if user can perform a specific action on a resource.
 * Takes admin bypass into account.
 */
export function canPerform(
  user: SessionUser | null,
  resource: Resource,
  action: Action,
): boolean {
  return hasPermission(user, resource, action);
}

/**
 * Helper to check multiple permissions at once.
 * Useful for conditionally showing CRUD buttons.
 */
export function getUserPermissions(
  user: SessionUser | null,
  resource: Resource,
) {
  if (!user) {
    return {
      canRead: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canPublish: false,
      canVoid: false,
      canExport: false,
      canInstall: false,
    };
  }

  return {
    canRead: hasPermission(user, resource, "read"),
    canCreate: hasPermission(user, resource, "create"),
    canUpdate: hasPermission(user, resource, "update"),
    canDelete: hasPermission(user, resource, "delete"),
    canPublish: hasPermission(user, resource, "publish"),
    canVoid: hasPermission(user, resource, "void"),
    canExport: hasPermission(user, resource, "export"),
    canInstall: hasPermission(user, resource, "install"),
  };
}
