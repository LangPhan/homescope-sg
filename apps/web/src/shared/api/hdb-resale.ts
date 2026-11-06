import { z } from "zod";

const dataset = "d_8b84c4ee58e3cfc0ece0d773c8ca6abc";
export const hdbResaleSource = `https://data.gov.sg/datasets/${dataset}/view`;
export const hdbTownSchema = z.string().trim().min(1).max(40).regex(/^[a-z0-9 /-]+$/i);
const transaction = z.object({
  _id: z.number().int(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  town: z.string(),
  block: z.string(),
  street_name: z.string(),
  flat_type: z.string(),
  floor_area_sqm: z.coerce.number().positive(),
  resale_price: z.coerce.number().positive(),
});
const responseSchema = z.object({
  success: z.literal(true),
  result: z.object({ records: z.array(transaction) }),
});

export async function getHdbResales(town?: string, signal?: AbortSignal) {
  const url = new URL("https://data.gov.sg/api/action/datastore_search");
  url.search = new URLSearchParams({
    resource_id: dataset,
    limit: "10",
    sort: "month desc, _id desc",
    ...(town ? { filters: JSON.stringify({ town: hdbTownSchema.parse(town).toUpperCase() }) } : {}),
  }).toString();
  const timeout = AbortSignal.timeout(6_000);
  const response = await fetch(url, {
    next: { revalidate: 3600 },
    signal: signal ? AbortSignal.any([timeout, signal]) : timeout,
  });
  if (!response.ok) throw new Error(`HDB resale API returned ${response.status}`);
  return responseSchema.parse(await response.json()).result.records;
}
