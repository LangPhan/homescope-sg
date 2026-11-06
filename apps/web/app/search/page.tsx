import { Suspense } from "react";
import { ExploreResults } from "@/components/explore-results";
import { SearchForm } from "@/components/search-form";
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
      <ExploreResults initialResult={result} filters={filters}/>
    </div>
  </main>;
}
