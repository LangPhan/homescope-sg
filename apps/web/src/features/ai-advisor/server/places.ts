import { z } from "zod";

const positionSchema = z.object({
  LATITUDE: z.coerce.number().min(1.1).max(1.6),
  LONGITUDE: z.coerce.number().min(103.5).max(104.2),
  SEARCHVAL: z.string(),
  ADDRESS: z.string(),
  POSTAL: z.string(),
});

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export async function resolvePlace(query: string, signal?: AbortSignal) {
  const normalized = normalize(query).replace(/ singapore$/, "");
  if (normalized === "domain of the istana" || normalized === "istana domain") {
    return { name: "Domain of the Istana", lat: 1.304729, lng: 103.843807, source: "OpenStreetMap way 41662337 (representative point)" };
  }
  const url = new URL("https://www.onemap.gov.sg/api/common/elastic/search");
  url.search = new URLSearchParams({ searchVal: query, returnGeom: "Y", getAddrDetails: "Y", pageNum: "1" }).toString();
  const timeout = AbortSignal.timeout(4000);
  const response = await fetch(url, { signal: signal ? AbortSignal.any([timeout, signal]) : timeout, next: { revalidate: 86400 } });
  if (!response.ok) throw new Error("Place lookup unavailable");
  const payload = z.object({ totalNumPages: z.number(), results: z.array(positionSchema) }).parse(await response.json());
  const matches = payload.results.filter((row) =>
    [row.SEARCHVAL, row.ADDRESS, row.POSTAL].some((name) => normalize(name) === normalized));
  if (payload.totalNumPages > 1 || matches.length !== 1) return null;
  const match = matches[0];
  return { name: match.SEARCHVAL, lat: match.LATITUDE, lng: match.LONGITUDE, source: "OneMap address search" };
}
