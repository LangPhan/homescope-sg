"use client";

import { useQuery } from "@tanstack/react-query";
import { API_URL, type Listing } from "@/shared/api";
import { useAuthSession } from "@/shared/auth";

export function useSavedHomes() {
  const { user, ready, authenticatedFetch } = useAuthSession();

  return useQuery({
    queryKey: ["saved-homes", user?.email],
    enabled: ready && !!user,
    queryFn: async ({ signal }): Promise<Listing[]> => {
      const response = await authenticatedFetch(`${API_URL}/me/favourites`, { signal });
      if (!response.ok) throw new Error("Could not load saved homes.");
      return (await response.json()).data;
    },
  });
}
