"use client";

import { useQuery } from "@tanstack/react-query";
import { getSessionUser } from "@/lib/auth/actions";

export function useUser() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["session", "user"],
    queryFn: getSessionUser,
    staleTime: Infinity,
    retry: false,
  });

  return { user, isLoading, error };
}
