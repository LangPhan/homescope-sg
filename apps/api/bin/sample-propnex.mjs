import { setTimeout as delay } from "node:timers/promises";

const origin = "https://propnex.com";
const quotas = { condo: 120, hdb: 100, landed: 80 };
const seen = new Set();

async function readPage(path) {
  await delay(400);
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  const html = await response.text();
  return [...html.matchAll(/self\.__next_f\.push\((\[1,"(?:[^"\\]|\\.)*"\])\)/g)]
    .map((match) => JSON.parse(match[1])[1]).join("");
}

function property(body, key) {
  const marker = JSON.stringify(key) + ":";
  const index = body.indexOf(marker);
  if (index === -1) return undefined;
  const rest = body.slice(index + marker.length);
  if (rest[0] === '"') return JSON.parse(rest.match(/^"(?:[^"\\]|\\.)*"/)[0]);
  if (rest[0] !== "{" && rest[0] !== "[") return undefined;
  let depth = 0;
  let quoted = false;
  for (let i = 0; i < rest.length; i++) {
    const char = rest[i];
    if (quoted && char === "\\") { i++; continue; }
    if (char === '"') quoted = !quoted;
    if (quoted) continue;
    if (char === "[" || char === "{") depth++;
    if ((char === "]" || char === "}") && --depth === 0) return JSON.parse(rest.slice(0, i + 1));
  }
}

async function feature(category, item) {
  const path = `/listing/${item.slug}`;
  const detail = await readPage(path);
  const pin = property(detail, "nearbyCenter");
  const address = property(detail, "address");
  const district = item.districtLocation?.match(/^D(\d{1,2})\b/)?.[1];
  if (!pin || !(pin.lat > 1.1 && pin.lat < 1.6 && pin.lng > 103.5 && pin.lng < 104.2) || !address || !district) return null;
  const station = [item.nearestMrt, item.nearestLrt].filter(Boolean)
    .filter((entry) => !entry.isUnopened && Number.isFinite(entry.distanceM))
    .sort((a, b) => a.distanceM - b.distanceM)[0];
  return {
    type: "Feature", id: `propnex-${item.listingExtId}`,
    geometry: { type: "Point", coordinates: [pin.lng, pin.lat] },
    properties: {
      name: item.name, address, district: `D${district.padStart(2, "0")}`,
      property_filter: category, property_type: item.subtype?.typeName ?? null,
      listing_url: new URL(path, origin).href,
      coordinate_precision: "publisher_map_pin",
      mrt_name: station?.name ?? null, mrt_distance: station?.distanceM ?? null,
      transit_type: station ? (station.isLrt ? "LRT" : "MRT") : null,
    },
  };
}

const features = [];
for (const [category, quota] of Object.entries(quotas)) {
  let count = 0;
  for (let page = 1; page <= 40 && count < quota; page++) {
    const body = await readPage(`/buy/${category}?page=${page}`);
    const result = property(body, "result");
    if (result?.page !== page || !Array.isArray(result.items)) throw new Error(`Unexpected results for ${category} page ${page}`);
    for (let offset = 0; offset < result.items.length && count < quota; offset += 3) {
      const batch = result.items.slice(offset, offset + Math.min(3, quota - count));
      const candidates = batch.filter((item) => {
        if (item.listingMode !== "Sale" || !/^for-sale-[a-z0-9-]+$/.test(item.slug) || !/^\d+$/.test(item.listingExtId) || seen.has(item.listingExtId)) return false;
        seen.add(item.listingExtId);
        return true;
      });
      for (const row of await Promise.all(candidates.map((item) => feature(category, item)))) {
        if (row) { features.push(row); count++; }
      }
    }
    console.error(`${category}: ${count}/${quota} (page ${page})`);
  }
  if (count !== quota) throw new Error(`Only collected ${count}/${quota} for ${category}`);
}
console.log(JSON.stringify({ type: "FeatureCollection", sources: Object.keys(quotas).map((type) => `${origin}/buy/${type}`), features }));
