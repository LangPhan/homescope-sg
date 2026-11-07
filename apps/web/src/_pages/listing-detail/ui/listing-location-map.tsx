"use client";

import { ExternalLink, MapPin, Train } from "lucide-react";
import { useState } from "react";
import { InsightSection } from "./insight-section";

export function ListingLocationMap({ title, address, latitude, longitude, mrtName, mrtDistance }: {
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  mrtName?: string;
  mrtDistance?: number | null;
}) {
  const [unavailable, setUnavailable] = useState(false);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  const latitudeDelta = 0.008;
  const longitudeDelta = 0.011;
  const bbox = [longitude - longitudeDelta, latitude - latitudeDelta, longitude + longitudeDelta, latitude + latitudeDelta].join(",");
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`;

  return (
    <InsightSection
      eyebrow="Location"
      title="See where this home sits"
      description="Explore the immediate neighbourhood and open the exact coordinates for directions."
      aside={<a href={mapsUrl} target="_blank" rel="noreferrer" className="hidden shrink-0 items-center gap-2 rounded-xl border border-line px-3 py-2 text-xs font-bold transition hover:border-teal hover:text-teal sm:inline-flex">Open in Maps <ExternalLink size={14}/></a>}
    >
      <div className="relative h-[360px] bg-[#dfe8df] sm:h-[420px]" aria-label={`Map showing ${title} at ${address}`}>
        {!unavailable && <iframe title={`Map showing ${title}`} src={embedUrl} className="absolute inset-0 size-full border-0" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" onError={() => setUnavailable(true)}/>}
        {unavailable && <div className="absolute inset-0 grid place-items-center bg-[#e5ebe3] text-sm font-bold text-muted-copy">Map tiles are temporarily unavailable</div>}
        <div className="absolute top-4 left-4 z-[2] max-w-[calc(100%-32px)] rounded-xl border border-white/60 bg-paper/95 p-3 shadow-[0_8px_30px_rgba(16,42,46,.16)] backdrop-blur">
          <div className="flex items-start gap-2 text-sm font-bold"><MapPin className="mt-0.5 shrink-0 text-coral" size={16}/><span>{address}</span></div>
          {mrtName && <div className="mt-2 flex items-center gap-2 text-xs text-muted-copy"><Train size={14}/><span>{mrtName} MRT{mrtDistance != null ? ` · ${mrtDistance} m` : ""}</span></div>}
        </div>
      </div>
    </InsightSection>
  );
}
