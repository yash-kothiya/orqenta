/**
 * §5 / §6.1 — the gate every server action opens with.
 *
 * `hasPermission` itself lives in `@/lib/types` because the client needs it too
 * (the nav hides what you cannot reach); this file is the server-side half that
 * refuses rather than hides.
 */
import { resourceLabel } from "@/lib/permissions";
import {
  type Action,
  hasPermission,
  type Resource,
  type SessionUser,
} from "@/lib/types";

export class PermissionError extends Error {
  constructor(
    readonly resource: Resource,
    readonly action: Action,
  ) {
    super(
      `You do not have permission to ${action} ${resourceLabel(resource).toLowerCase()}`,
    );
    this.name = "PermissionError";
  }
}

/** Admins bypass this entirely — that check lives inside `hasPermission`. */
export function assertPermission(
  user: SessionUser | null,
  resource: Resource,
  action: Action,
): void {
  if (!hasPermission(user, resource, action)) {
    throw new PermissionError(resource, action);
  }
}
