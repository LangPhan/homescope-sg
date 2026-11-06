import { Suspense } from "react";
import { ExploreResults } from "./explore-results";
import { SearchForm } from "./search-form";
import { type SearchFilters } from "@/shared/api";

export const metadata = { title: "Explore homes", description: "Search Singapore property by map, budget, type and bedrooms." };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const filters = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])) as SearchFilters;
  return <main className="min-h-[calc(100vh-72px)]">
    <div className="search-toolbar sticky top-[72px] z-[25] border-b border-line bg-white px-0 pt-6 pb-4"><div className="mx-auto w-[min(1200px,calc(100%-40px))]"><Suspense><SearchForm /></Suspense></div></div>
    <div className="grid h-[calc(100vh-158px)] grid-cols-[57%_43%] max-[900px]:block max-[900px]:h-auto">
      <ExploreResults filters={filters}/>
    </div>
  </main>;
}
