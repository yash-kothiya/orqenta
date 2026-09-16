"use client";

import { usePermission } from "@/hooks/use-permission";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import type { Action, Resource } from "@/lib/types";
import { ReactNode } from "react";

/**
 * Wraps a button to check permissions before showing it.
 * If user lacks permission, shows a disabled button with tooltip.
 */
export function PermissionGatedButton({
  resource,
  action,
  children,
  disabled,
  ...props
}: {
  resource: Resource;
  action: Action;
  children: ReactNode;
  disabled?: boolean;
} & React.ComponentProps<typeof Button>) {
  const { can } = usePermission();
  const hasPermission = can(resource, action);

  if (hasPermission) {
    return (
      <Button disabled={disabled} {...props}>
        {children}
      </Button>
    );
  }

  // Show disabled button with tooltip explaining lack of permission
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Button disabled {...props}>
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          You do not have permission to {action} {resource}.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Check if user has permission before rendering content.
 * Returns null if user lacks permission.
 */
export function IfPermitted({
  resource,
  action,
  children,
  fallback,
}: {
  resource: Resource;
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can } = usePermission();
  const hasPermission = can(resource, action);

  if (!hasPermission) {
    return fallback ?? null;
  }

  return children;
}
