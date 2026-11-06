import { Listing, ListingResponse, SearchFilters } from "./listing";

export const API_URL = typeof window === "undefined"
  ? process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
  : process.env.NEXT_PUBLIC_API_URL || "/api/v1";


export async function getListings(filters: SearchFilters = {}): Promise<ListingResponse> {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value).map(([key, value]) => [key, String(value)]));
  try {
    const response = await fetch(`${API_URL}/listings?${params}`, { next: { revalidate: 30 }, signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("API unavailable");
    return response.json();
  } catch (error) {
    if (typeof window !== "undefined") throw error;
    return { data: [], meta: { total: 0, next_cursor: null } };
  }
}

export async function getListing(slug: string): Promise<Listing | null> {
  try {
    const response = await fetch(`${API_URL}/listings/${slug}`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("Not found");
    return (await response.json()).data;
  } catch {
    return null;
  }
}

export const money = (value: number) => new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 }).format(value);
