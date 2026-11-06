import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";
import { getHdbResales, hdbTownSchema } from "@/shared/api/hdb-resale";
import { resolvePlace } from "./places";

const listingCardSchema = z.object({
  slug: z.string(),
  title: z.string(),
  address: z.string(),
  district: z.string(),
  property_type: z.string(),
  tenure: z.string(),
  price: z.number(),
  psf: z.number(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  floor_area: z.number(),
  mrt_name: z.string(),
  mrt_distance: z.number().nullable(),
  image_url: z.string(),
  href: z.string(),
});

export type AdvisorListing = z.infer<typeof listingCardSchema>;

export const searchListingsInputSchema = z.object({
  keyword: z.string().trim().max(120).optional(),
  property_type: z.enum(["Condo", "HDB", "Apartment", "Landed"]).optional(),
  min_price: z.number().int().nonnegative().max(100_000_000).optional(),
  max_price: z.number().int().positive().max(100_000_000).optional(),
  bedrooms: z.number().int().min(0).max(10).optional(),
  district: z.string().trim().regex(/^D(?:0[1-9]|1[0-9]|2[0-8])$/).optional(),
  tenure: z.string().trim().max(40).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "psf_asc"]).optional(),
  limit: z.number().int().min(1).max(8).default(5),
}).strict().refine((value) => !value.min_price || !value.max_price || value.min_price <= value.max_price, {
  message: "min_price must be less than or equal to max_price",
});

export const listingSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120);

function internalApiUrl(): string {
  return process.env.API_INTERNAL_URL || "http://localhost:8080/api/v1";
}

function number(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeListing(value: Record<string, unknown>): AdvisorListing {
  const slug = listingSlugSchema.parse(value.slug);
  return listingCardSchema.parse({
    slug,
    title: String(value.title || ""),
    address: String(value.address || ""),
    district: String(value.district || ""),
    property_type: String(value.property_type || ""),
    tenure: String(value.tenure || ""),
    price: number(value.price),
    psf: number(value.psf),
    bedrooms: number(value.bedrooms),
    bathrooms: number(value.bathrooms),
    floor_area: number(value.floor_area),
    mrt_name: String(value.mrt_name || ""),
    mrt_distance: value.mrt_distance == null ? null : number(value.mrt_distance),
    image_url: String(value.image_url || ""),
    href: `/listings/${slug}`,
  });
}

async function fetchJson(path: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(`${internalApiUrl()}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(4_000)]) : AbortSignal.timeout(4_000),
  });
  if (!response.ok) throw new Error(`HomeScope listings API returned ${response.status}`);
  return response.json();
}

export const searchListingsDefinition = toolDefinition({
  name: "search_listings",
  description: "Search HomeScope's Singapore property listings snapshot using catalogue filters.",
  inputSchema: searchListingsInputSchema,
  outputSchema: z.object({ listings: z.array(listingCardSchema).max(8), synthetic: z.boolean(), presentation: z.enum(["cards", "comparison"]) }),
});

export const getListingDetailDefinition = toolDefinition({
  name: "get_listing_detail",
  description: "Get safe public details for one HomeScope listing by its catalogue slug.",
  inputSchema: z.object({ slug: listingSlugSchema }).strict(),
  outputSchema: z.object({ listing: listingCardSchema.extend({ description: z.string(), amenities: z.array(z.string()) }), synthetic: z.boolean(), presentation: z.enum(["cards", "comparison"]) }),
});

const lookupHdbResales = toolDefinition({
  name: "lookup_hdb_resales",
  description: "Look up up to ten recent completed HDB resale transactions, optionally for an exact HDB town. Prices are in SGD and areas in square metres.",
  inputSchema: z.object({ town: hdbTownSchema.optional() }).strict(),
}).server(async ({ town }, context) => {
  try {
    return {
      status: "ok",
      kind: "historical_hdb_transactions",
      href: town ? `/resale?${new URLSearchParams({ town })}` : "/resale",
      transactions: await getHdbResales(town, context?.abortSignal),
    };
  } catch {
    return { status: "unavailable" };
  }
});

export function createAdvisorTools(requestId: string, presentation: "cards" | "comparison" = "cards") {
  const searchListings = searchListingsDefinition.server(async (input, context) => {
    const startedAt = performance.now();
    const params = new URLSearchParams();
    const mapping: Record<string, unknown> = {
      q: input.keyword,
      property_type: input.property_type,
      min_price: input.min_price,
      max_price: input.max_price,
      bedrooms: input.bedrooms,
      district: input.district,
      tenure: input.tenure,
      sort: input.sort,
      limit: input.limit,
    };
    for (const [key, value] of Object.entries(mapping)) if (value !== undefined && value !== "") params.set(key, String(value));
    const payload = await fetchJson(`/listings?${params}`, context?.abortSignal) as { data?: Array<Record<string, unknown>> };
    const listings = (payload.data || []).slice(0, input.limit).map(sanitizeListing);
    console.info(JSON.stringify({ event: "ai_tool", request_id: requestId, tool: "search_listings", latency_ms: Math.round(performance.now() - startedAt), result_count: listings.length }));
    return { listings, synthetic: (payload.data || []).some((row) => !row.source_url), presentation };
  });

  const getListingDetail = getListingDetailDefinition.server(async ({ slug }, context) => {
    const startedAt = performance.now();
    const payload = await fetchJson(`/listings/${encodeURIComponent(slug)}`, context?.abortSignal) as { data?: Record<string, unknown> };
    if (!payload.data) throw new Error("Listing not found");
    const listing = {
      ...sanitizeListing(payload.data),
      description: String(payload.data.description || ""),
      amenities: Array.isArray(payload.data.amenities) ? payload.data.amenities.map(String).slice(0, 20) : [],
    };
    console.info(JSON.stringify({ event: "ai_tool", request_id: requestId, tool: "get_listing_detail", latency_ms: Math.round(performance.now() - startedAt) }));
    return { listing, synthetic: !payload.data.source_url, presentation };
  });

  const searchNearPlace = toolDefinition({
    name: "search_near_place",
    description: "Resolve a named Singapore landmark or exact address and rank verified catalogue pins within 3 km by straight-line distance. Use for homes near a named place.",
    inputSchema: z.object({
      place: z.string().trim().min(2).max(120),
      property_type: z.enum(["Condo", "HDB", "Apartment", "Landed"]).optional(),
      max_price: z.number().int().positive().optional(),
      min_price: z.number().int().nonnegative().optional(),
      bedrooms: z.number().int().min(0).max(10).optional(),
      district: z.string().regex(/^D(?:0[1-9]|1[0-9]|2[0-8])$/).optional(),
      tenure: z.enum(["99-year", "999-year", "Freehold"]).optional(),
    }).strict(),
  }).server(async ({ place, ...filters }, context) => {
    try {
      const anchor = await resolvePlace(place, context?.abortSignal);
      if (!anchor) return { status: "place_not_resolved" };
      const params = new URLSearchParams({ near: `${anchor.lat},${anchor.lng}`, limit: "5" });
      for (const [key, value] of Object.entries(filters)) if (value !== undefined) params.set(key, String(value));
      const payload = await fetchJson(`/listings?${params}`, context?.abortSignal) as { data: Array<Record<string, unknown>> };
      return {
        status: "ok", place: anchor.name, coordinate_source: anchor.source, distance_method: "straight_line",
        listings: payload.data.map((row) => ({ ...sanitizeListing(row), distance_m: Number(row.distance_m) })),
      };
    } catch {
      return { status: "unavailable" };
    }
  });
  return [searchListings, getListingDetail, lookupHdbResales, searchNearPlace] as const;
}
