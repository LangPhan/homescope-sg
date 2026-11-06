import { ListingCardSkeleton } from "@/components/listing-card-skeleton";

export default function SearchLoading() {
  return <main className="search-page" aria-busy="true" aria-label="Loading homes">
    <div className="search-toolbar"><div className="container"><div className="skeleton-block" style={{ height: 46, borderRadius: 9 }} /></div></div>
    <div className="search-layout">
      <section className="results-panel">
        <div className="results-head"><div><div className="eyebrow">Explore Singapore</div><h1>Finding homes…</h1></div></div>
        <div className="search-results">{Array.from({ length: 6 }, (_, index) => <ListingCardSkeleton key={index}/>)}</div>
      </section>
      <div className="map-panel skeleton-block" />
    </div>
  </main>;
}
