"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ListingCard } from "@/components/listing-card";
import { ListingCardSkeleton } from "@/components/listing-card-skeleton";
import { PropertyMap } from "@/components/property-map";
import { SaveSearchButton } from "@/components/save-search-button";
import { getListings } from "@/lib/api";
import { SearchFilters } from "@/lib/types";

const PAGE_SIZE = "20";

export function ExploreResults({ filters }: { filters: SearchFilters }) {
  const panelRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const restoredKeyRef = useRef<string | null>(null);
  const persistFrameRef = useRef<number | null>(null);
  const returningFromDetailRef = useRef<boolean | null>(null);
  if (returningFromDetailRef.current === null && typeof window !== "undefined") {
    returningFromDetailRef.current = sessionStorage.getItem("homescope:returning-from-detail") === "true";
  }
  const returningFromDetail = returningFromDetailRef.current === true;
  const [headerDocked, setHeaderDocked] = useState(false);
  const storageKey = useMemo(() => {
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value).map(([key, value]) => [key, String(value)]));
    params.sort();
    return `homescope:search-position:${params.toString() || "all"}`;
  }, [filters]);
  const query = useInfiniteQuery({
    queryKey: ["listings", filters],
    queryFn: ({ pageParam }) => getListings({ ...filters, cursor: pageParam || undefined, limit: PAGE_SIZE }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor,
    staleTime: 30_000,
    gcTime: 30 * 60_000,
    refetchOnMount: returningFromDetail ? false : true,
    refetchOnWindowFocus: returningFromDetail ? false : true,
    refetchOnReconnect: returningFromDetail ? false : true
  });

  const listings = useMemo(() => {
    const unique = new Map((query.data?.pages || []).flatMap((page) => page.data).map((listing) => [listing.id, listing]));
    return [...unique.values()];
  }, [query.data?.pages]);
  const total = query.data?.pages[0]?.meta.total;

  const updateHeaderState = useCallback(() => {
    const panel = panelRef.current;
    const header = headerRef.current;
    if (!panel || !header) return;
    const panelScrolls = getComputedStyle(panel).overflowY !== "visible";
    const stickyTop = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--results-sticky-top")) || 0;
    setHeaderDocked(panelScrolls ? panel.scrollTop > 10 : header.getBoundingClientRect().top <= stickyTop + 1);
  }, []);

  const writePosition = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    sessionStorage.setItem(storageKey, JSON.stringify({ panel: panel.scrollTop, window: window.scrollY }));
    updateHeaderState();
  }, [storageKey, updateHeaderState]);

  const persistPosition = useCallback(() => {
    if (persistFrameRef.current !== null) return;
    persistFrameRef.current = requestAnimationFrame(() => {
      persistFrameRef.current = null;
      writePosition();
    });
  }, [writePosition]);

  const rememberSearchJourney = useCallback(() => {
    if (persistFrameRef.current !== null) cancelAnimationFrame(persistFrameRef.current);
    persistFrameRef.current = null;
    writePosition();
    sessionStorage.setItem("homescope:return-to-search", `${window.location.pathname}${window.location.search}`);
    sessionStorage.setItem("homescope:navigated-from-search", "true");
    sessionStorage.removeItem("homescope:returning-from-detail");
  }, [writePosition]);

  useEffect(() => {
    if (!returningFromDetail) return;
    const timer = window.setTimeout(() => sessionStorage.removeItem("homescope:returning-from-detail"), 1_000);
    return () => window.clearTimeout(timer);
  }, [returningFromDetail]);

  useEffect(() => {
    const siteHeader = document.querySelector<HTMLElement>(".site-header");
    const toolbar = document.querySelector<HTMLElement>(".search-toolbar");
    const updateStickyOffset = () => {
      const offset = (siteHeader?.offsetHeight || 0) + (toolbar?.offsetHeight || 0);
      document.documentElement.style.setProperty("--results-sticky-top", `${offset}px`);
      updateHeaderState();
    };
    const observer = new ResizeObserver(updateStickyOffset);
    if (siteHeader) observer.observe(siteHeader);
    if (toolbar) observer.observe(toolbar);
    updateStickyOffset();
    window.addEventListener("scroll", persistPosition, { passive: true });
    window.addEventListener("resize", updateStickyOffset);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", persistPosition);
      window.removeEventListener("resize", updateStickyOffset);
      if (persistFrameRef.current !== null) cancelAnimationFrame(persistFrameRef.current);
    };
  }, [persistPosition, updateHeaderState]);

  useEffect(() => {
    if (restoredKeyRef.current === storageKey) return;
    restoredKeyRef.current = storageKey;
    const shouldRestore = sessionStorage.getItem("homescope:returning-from-detail") === "true";
    if (!shouldRestore) {
      requestAnimationFrame(() => {
        if (panelRef.current) panelRef.current.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: "instant" });
        updateHeaderState();
      });
      return;
    }
    const saved = sessionStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const position = JSON.parse(saved) as { panel?: number; window?: number };
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (panelRef.current) panelRef.current.scrollTop = position.panel || 0;
        window.scrollTo({ top: position.window || 0, behavior: "instant" });
        updateHeaderState();
      }));
    } catch { sessionStorage.removeItem(storageKey); }
  }, [storageKey, updateHeaderState]);

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
    <section className="results-panel overflow-y-auto px-[max(20px,calc((100vw-1200px)/2))] pr-[22px] pb-7 max-[900px]:overflow-visible max-[620px]:px-3.5" ref={panelRef} onScroll={persistPosition}>
      <div className={`sticky top-0 z-[12] mb-5 flex items-center justify-between gap-5 border-b border-line/80 bg-paper/96 py-[28px] pb-[18px] backdrop-blur-xl transition-[padding,box-shadow,background-color] duration-300 ${headerDocked ? "bg-paper/99 pt-3.5 shadow-[0_14px_24px_-24px_rgba(16,42,46,.65)]" : ""}`} ref={headerRef}>
        <div><div className="text-xs font-extrabold tracking-[.15em] text-teal uppercase">Explore Singapore</div><h1 className="m-0 text-2xl max-[620px]:text-xl">{total === undefined ? "Finding homes…" : `${total} homes match`}</h1></div>
        <div className="flex shrink-0 gap-2"><SaveSearchButton filters={filters}/><span className="inline-flex items-center rounded-full border border-line bg-white/90 px-3 py-2 text-[.82rem]">Map + list</span></div>
      </div>
      {query.isPending ? <div className="grid grid-cols-2 gap-4 max-[620px]:grid-cols-1">{Array.from({ length: 6 }, (_, index) => <ListingCardSkeleton key={index}/>)}</div> : query.isError && !query.data ? <div className="grid min-h-[72px] place-items-center text-[.82rem] text-muted-copy"><button className="rounded-[10px] border border-line bg-white px-[18px] py-3 font-bold" onClick={() => query.refetch()}>Try loading homes again</button></div> : listings.length ? <>
        <div className="grid grid-cols-2 gap-4 max-[620px]:grid-cols-1">
          {listings.map((listing) => <ListingCard key={listing.id} listing={listing} onNavigate={rememberSearchJourney}/>)}
          {query.isFetchingNextPage && Array.from({ length: 4 }, (_, index) => <ListingCardSkeleton key={`skeleton-${index}`}/>)}
        </div>
        <div ref={sentinelRef} className="min-h-px" aria-hidden="true" />
        <div className="grid min-h-[72px] place-items-center text-[.82rem] text-muted-copy" role="status" aria-live="polite">
          {query.isFetchingNextPage ? "Loading more homes…" : query.isFetchNextPageError ? <button className="rounded-[10px] border border-line bg-white px-[18px] py-3 font-bold" onClick={() => query.fetchNextPage()}>Try loading again</button> : query.hasNextPage ? "Scroll for more homes" : `All ${listings.length} homes loaded`}
        </div>
      </> : <div className="px-5 py-20 text-center"><h2 className="font-serif text-[2.4rem] tracking-[-.035em]">No homes in this view</h2><p className="text-muted-copy">Try widening your budget or removing a filter.</p></div>}
    </section>
    {query.isPending ? <div className="min-h-[500px] animate-pulse bg-[#e8ece8] max-[900px]:h-[55vh]"/> : <PropertyMap listings={listings} onNavigate={rememberSearchJourney}/>}
  </>;
}
