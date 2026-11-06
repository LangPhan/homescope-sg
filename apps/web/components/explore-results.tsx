"use client";
import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ListingCard } from "@/components/listing-card";
import { ListingCardSkeleton } from "@/components/listing-card-skeleton";
import { PropertyMap } from "@/components/property-map";
import { SaveSearchButton } from "@/components/save-search-button";
import { getListings } from "@/lib/api";
import { ListingResponse, SearchFilters } from "@/lib/types";

const PAGE_SIZE = "20";

export function ExploreResults({ initialResult, filters }: { initialResult: ListingResponse; filters: SearchFilters }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const query = useInfiniteQuery({
    queryKey: ["listings", filters],
    queryFn: ({ pageParam }) => getListings({ ...filters, cursor: pageParam || undefined, limit: PAGE_SIZE }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor,
    initialData: { pages: [initialResult], pageParams: [null] }
  });

  const listings = useMemo(() => {
    const unique = new Map(query.data.pages.flatMap((page) => page.data).map((listing) => [listing.id, listing]));
    return [...unique.values()];
  }, [query.data.pages]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !query.hasNextPage || query.isFetchNextPageError) return;
    const root = sentinel.closest(".results-panel");
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !query.isFetchingNextPage) query.fetchNextPage();
    }, { root: root instanceof HTMLElement && root.scrollHeight > root.clientHeight ? root : null, rootMargin: "500px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage, query.isFetchNextPageError]);

  return <>
    <section className="results-panel">
      <div className="results-head">
        <div><div className="eyebrow">Explore Singapore</div><h1>{initialResult.meta.total} homes match</h1></div>
        <div className="results-actions"><SaveSearchButton filters={filters}/><span className="pill">Map + list</span></div>
      </div>
      {listings.length ? <>
        <div className="search-results">
          {listings.map((listing) => <ListingCard key={listing.id} listing={listing}/>)}
          {query.isFetchingNextPage && Array.from({ length: 4 }, (_, index) => <ListingCardSkeleton key={`skeleton-${index}`}/>)}
        </div>
        <div ref={sentinelRef} className="infinite-sentinel" aria-hidden="true" />
        <div className="infinite-status" role="status" aria-live="polite">
          {query.isFetchingNextPage ? "Loading more homes…" : query.isFetchNextPageError ? <button className="button button-ghost" onClick={() => query.fetchNextPage()}>Try loading again</button> : query.hasNextPage ? "Scroll for more homes" : `All ${listings.length} homes loaded`}
        </div>
      </> : <div style={{ padding: "80px 20px", textAlign: "center" }}><h2 className="serif" style={{ fontSize: "2.4rem" }}>No homes in this view</h2><p className="muted">Try widening your budget or removing a filter.</p></div>}
    </section>
    <PropertyMap listings={listings}/>
  </>;
}
