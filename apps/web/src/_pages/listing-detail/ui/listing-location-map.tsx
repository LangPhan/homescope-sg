"use client";

import { ExternalLink, MapPin, Train } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { InsightSection } from "./insight-section";

export function ListingLocationMap({ title, address, latitude, longitude, mrtName, mrtDistance }: {
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  mrtName?: string;
  mrtDistance?: number | null;
}) {
  const mapNode = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  useEffect(() => {
    const container = mapNode.current;
    if (!container || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setUnavailable(true);
      return;
    }
    let disposed = false;
    let map: import("maplibre-gl").Map | undefined;
    void import("maplibre-gl").then((maplibregl) => {
      if (disposed) return;
      maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
      map = new maplibregl.Map({
        container,
        center: [longitude, latitude],
        zoom: 15.7,
        attributionControl: false,
        style: {
          version: 8,
          sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
      const popupContent = document.createElement("div");
      const popupTitle = document.createElement("strong");
      const popupAddress = document.createElement("div");
      popupTitle.textContent = title;
      popupAddress.textContent = address;
      popupContent.append(popupTitle, popupAddress);
      new maplibregl.Marker({ color: "#ec6a4d" })
        .setLngLat([longitude, latitude])
        .setPopup(new maplibregl.Popup({ offset: 24 }).setDOMContent(popupContent))
        .addTo(map);
    }).catch((error) => {
      console.error("Could not initialize listing map", error);
      setUnavailable(true);
    });
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [address, latitude, longitude, title]);

  return (
    <InsightSection
      eyebrow="Location"
      title="See where this home sits"
      description="Explore the immediate neighbourhood and open the exact coordinates for directions."
      aside={<a href={mapsUrl} target="_blank" rel="noreferrer" className="hidden shrink-0 items-center gap-2 rounded-xl border border-line px-3 py-2 text-xs font-bold transition hover:border-teal hover:text-teal sm:inline-flex">Open in Maps <ExternalLink size={14}/></a>}
    >
      <div className="relative h-[360px] bg-[#dfe8df] sm:h-[420px]" aria-label={`Map showing ${title} at ${address}`}>
        <div ref={mapNode} className="absolute inset-0" />
        {unavailable && <div className="absolute inset-0 grid place-items-center bg-[#e5ebe3] text-sm font-bold text-muted-copy">Map tiles are temporarily unavailable</div>}
        <div className="absolute top-4 left-4 z-[2] max-w-[calc(100%-32px)] rounded-xl border border-white/60 bg-paper/95 p-3 shadow-[0_8px_30px_rgba(16,42,46,.16)] backdrop-blur">
          <div className="flex items-start gap-2 text-sm font-bold"><MapPin className="mt-0.5 shrink-0 text-coral" size={16}/><span>{address}</span></div>
          {mrtName && <div className="mt-2 flex items-center gap-2 text-xs text-muted-copy"><Train size={14}/><span>{mrtName} MRT{mrtDistance != null ? ` · ${mrtDistance} m` : ""}</span></div>}
        </div>
      </div>
    </InsightSection>
  );
}
