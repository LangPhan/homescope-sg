"use client";
import { useEffect, useRef, useState } from "react";
import { Listing } from "@/lib/types";

export function PropertyMap({ listings }: { listings: Listing[] }) {
  const mapNode = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !mapNode.current) return;
    let cancelled = false;
    (async () => {
      const { setOptions, importLibrary } = await import("@googlemaps/js-api-loader");
      setOptions({ key, v: "weekly" });
      const { Map } = await importLibrary("maps") as google.maps.MapsLibrary;
      const { AdvancedMarkerElement } = await importLibrary("marker") as google.maps.MarkerLibrary;
      if (cancelled || !mapNode.current) return;
      const map = new Map(mapNode.current, { center: { lat: 1.3521, lng: 103.8198 }, zoom: 11, mapId: "DEMO_MAP_ID", disableDefaultUI: true, zoomControl: true });
      const { MarkerClusterer } = await import("@googlemaps/markerclusterer");
      const markers = listings.map((listing) => new AdvancedMarkerElement({ map, position: { lat: listing.latitude, lng: listing.longitude }, title: listing.title }));
      new MarkerClusterer({ map, markers });
      setLive(true);
    })().catch(() => setLive(false));
    return () => { cancelled = true; };
  }, [listings]);

  return <div className="map-panel" aria-label="Map of search results">
    <div ref={mapNode} style={{ position: "absolute", inset: 0 }} />
    {!live && <div className="map-fallback">{listings.map((item, index) => <div className="map-pin" key={item.id} style={{ left: `${20 + (index * 17) % 66}%`, top: `${24 + (index * 23) % 55}%` }}>${Math.round(item.price / 1000)}k</div>)}</div>}
    <div className="map-label">{live ? "Drag the map to search this area" : "Add a Google Maps key for live viewport search"}</div>
  </div>;
}
