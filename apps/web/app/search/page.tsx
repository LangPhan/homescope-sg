import { Suspense } from "react";
import { ListingCard } from "@/components/listing-card";
import { PropertyMap } from "@/components/property-map";
import { SearchForm } from "@/components/search-form";
import { SaveSearchButton } from "@/components/save-search-button";
import { getListings } from "@/lib/api";
import { SearchFilters } from "@/lib/types";

export const metadata = { title: "Explore homes", description: "Search Singapore property by map, budget, type and bedrooms." };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const filters = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])) as SearchFilters;
  const result = await getListings(filters);
  return <main className="search-page">
    <div className="search-toolbar"><div className="container"><Suspense><SearchForm /></Suspense></div></div>
    <div className="search-layout">
      <section className="results-panel"><div className="results-head"><div><div className="eyebrow">Explore Singapore</div><h1>{result.meta.total} homes match</h1></div><div style={{display:"flex",gap:8}}><SaveSearchButton filters={filters}/><span className="pill">Map + list</span></div></div>
        {result.data.length ? <div className="search-results">{result.data.map((listing) => <ListingCard key={listing.id} listing={listing}/>)}</div> : <div style={{ padding: "80px 20px", textAlign: "center" }}><h2 className="serif" style={{ fontSize: "2.4rem" }}>No homes in this view</h2><p className="muted">Try widening your budget or removing a filter.</p></div>}
      </section>
      <PropertyMap listings={result.data}/>
    </div>
  </main>;
}
