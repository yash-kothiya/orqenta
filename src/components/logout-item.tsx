"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

/**
 * §6.3 rule 5 — the cache is cleared before the redirect, so the next person to
 * sign in on this browser does not read the previous one's rows.
 *
 * A form, not a link: signing out is a write, and GET would let an <img> do it.
 */
export function LogoutItem() {
  const queryClient = useQueryClient();

  return (
    <form
      action={logout}
      onSubmit={() => queryClient.clear()}
      className="contents"
    >
      {/* A button sizes to its content even as a flex item, so it needs w-full
          to match the plain <div> items around it. */}
      <DropdownMenuItem
        className="w-full"
        render={<button type="submit" />}
        nativeButton={true}
      >
        <LogOut className="size-4" />
        Logout
      </DropdownMenuItem>
    </form>
  );
}
