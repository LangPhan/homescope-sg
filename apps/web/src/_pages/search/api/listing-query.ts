import { infiniteQueryOptions } from "@tanstack/react-query";
import { getListings, type SearchFilters } from "@/shared/api";

const pageSize = "20";

export const searchListingQueries = {
  infinite: (filters: SearchFilters) => infiniteQueryOptions({
    queryKey: ["listings", filters],
    queryFn: ({ pageParam }) => getListings({ ...filters, cursor: pageParam || undefined, limit: pageSize }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor,
    staleTime: 30_000,
    gcTime: 30 * 60_000,
    refetchOnMount: false,
  }),
};
