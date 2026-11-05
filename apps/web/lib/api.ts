import { demoListings } from "./demo-data";
import { Listing, ListingResponse, SearchFilters } from "./types";

export const API_URL = typeof window === "undefined"
  ? process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
  : process.env.NEXT_PUBLIC_API_URL || "/api/v1";

function applyDemoFilters(filters: SearchFilters): Listing[] {
  return demoListings.filter((listing) => {
    if (filters.q && !`${listing.title} ${listing.address} ${listing.mrt_name}`.toLowerCase().includes(filters.q.toLowerCase())) return false;
    if (filters.property_type && listing.property_type !== filters.property_type) return false;
    if (filters.bedrooms && listing.bedrooms < Number(filters.bedrooms)) return false;
    if (filters.min_price && listing.price < Number(filters.min_price)) return false;
    if (filters.max_price && listing.price > Number(filters.max_price)) return false;
    if (filters.district && listing.district !== filters.district) return false;
    return true;
  });
}

export async function getListings(filters: SearchFilters = {}): Promise<ListingResponse> {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value).map(([key, value]) => [key, String(value)]));
  try {
    const response = await fetch(`${API_URL}/listings?${params}`, { next: { revalidate: 30 }, signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("API unavailable");
    return response.json();
  } catch {
    const data = applyDemoFilters(filters);
    return { data, meta: { total: data.length, next_cursor: null } };
  }
}

export async function getListing(slug: string): Promise<Listing | null> {
  try {
    const response = await fetch(`${API_URL}/listings/${slug}`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("Not found");
    return (await response.json()).data;
  } catch {
    return demoListings.find((listing) => listing.slug === slug) || null;
  }
}

export const money = (value: number) => new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 }).format(value);
