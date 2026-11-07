import { Listing, ListingResponse, SearchFilters } from "./listing";
import { demoPropertyPhotos } from "./demo-listings";
import { originRequestHeaders, serverApiBaseUrl } from "./origin";

const publicApiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
export const API_URL = publicApiUrl;

function requestApiUrl(): string {
  return typeof window === "undefined" ? serverApiBaseUrl() : publicApiUrl;
}

function serverHeaders(): HeadersInit | undefined {
  return typeof window === "undefined" ? originRequestHeaders() : undefined;
}

function withIllustrativePhotos(listing: Listing): Listing {
  if (!listing.source_url || listing.image_url !== "/listing-placeholder.svg") return listing;
  let hash = 0;
  for (const char of listing.slug) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  const pool = [...demoPropertyPhotos];
  const images = Array.from({ length: 3 }, () => {
    const index = hash % pool.length;
    hash = Math.floor(hash / pool.length);
    return pool.splice(index, 1)[0];
  });
  return { ...listing, image_url: images[0], images };
}

export async function getListings(filters: SearchFilters = {}): Promise<ListingResponse> {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value).map(([key, value]) => [key, String(value)]));
  try {
    const response = await fetch(`${requestApiUrl()}/listings?${params}`, { headers: serverHeaders(), next: { revalidate: 30 }, signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("API unavailable");
    const result: ListingResponse = await response.json();
    return { ...result, data: result.data.map(withIllustrativePhotos) };
  } catch (error) {
    if (typeof window !== "undefined") throw error;
    return { data: [], meta: { total: 0, next_cursor: null } };
  }
}

export async function getListing(slug: string): Promise<Listing | null> {
  const response = await fetch(`${requestApiUrl()}/listings/${encodeURIComponent(slug)}`, { headers: serverHeaders(), next: { revalidate: 60 }, signal: AbortSignal.timeout(2500) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Listing API returned ${response.status}`);
  const result: { data: Listing } = await response.json();
  return withIllustrativePhotos(result.data);
}

export const money = (value: number) => new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 }).format(value);
