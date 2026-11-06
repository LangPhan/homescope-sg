"use client";
import { useEffect, useRef, useState } from "react";
import type { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { useRouter } from "next/navigation";
import { Listing } from "@/lib/types";

type MapProvider = "loading" | "google" | "maplibre" | "error";
type GoogleMapSession = {
  map: google.maps.Map;
  markerClass: typeof google.maps.marker.AdvancedMarkerElement;
  markers: google.maps.marker.AdvancedMarkerElement[];
  clusterer: MarkerClusterer;
};
type PersistentMapSession = {
  container: HTMLDivElement | null;
  provider: MapProvider;
  initPromise: Promise<void> | null;
  maplibre: MapLibreMap | null;
  google: GoogleMapSession | null;
  listings: Listing[];
  navigate: ((slug: string) => void) | null;
  listeners: Set<(provider: MapProvider) => void>;
};

const mapSession: PersistentMapSession = {
  container: null,
  provider: "loading",
  initPromise: null,
  maplibre: null,
  google: null,
  listings: [],
  navigate: null,
  listeners: new Set()
};

function setProvider(provider: MapProvider) {
  mapSession.provider = provider;
  mapSession.listeners.forEach((listener) => listener(provider));
}

function listingFeatures(listings: Listing[]) {
  return {
    type: "FeatureCollection" as const,
    features: listings.map((listing) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [listing.longitude, listing.latitude] },
      properties: { id: listing.id, slug: listing.slug, title: listing.title, price: `$${Math.round(listing.price / 1000)}k` }
    }))
  };
}

function updateListings(listings: Listing[]) {
  mapSession.listings = listings;
  const source = mapSession.maplibre?.getSource("homes") as GeoJSONSource | undefined;
  source?.setData(listingFeatures(listings));
  const googleSession = mapSession.google;
  if (!googleSession) return;
  googleSession.clusterer.clearMarkers();
  googleSession.markers.forEach((marker) => { marker.map = null; });
  googleSession.markers = listings.map((listing) => {
    const marker = new googleSession.markerClass({ position: { lat: listing.latitude, lng: listing.longitude }, title: listing.title, gmpClickable: true });
    marker.addListener("click", () => mapSession.navigate?.(listing.slug));
    return marker;
  });
  googleSession.clusterer.addMarkers(googleSession.markers);
}

async function mountGoogleMap(key: string) {
  const { setOptions, importLibrary } = await import("@googlemaps/js-api-loader");
  setOptions({ key, v: "weekly" });
  const { Map } = await importLibrary("maps") as google.maps.MapsLibrary;
  const { AdvancedMarkerElement } = await importLibrary("marker") as google.maps.MarkerLibrary;
  const { MarkerClusterer } = await import("@googlemaps/markerclusterer");
  if (!mapSession.container) return;
  const map = new Map(mapSession.container, { center: { lat: 1.3521, lng: 103.8198 }, zoom: 11, mapId: "DEMO_MAP_ID", disableDefaultUI: true, zoomControl: true });
  mapSession.google = { map, markerClass: AdvancedMarkerElement, markers: [], clusterer: new MarkerClusterer({ map, markers: [] }) };
  updateListings(mapSession.listings);
  setProvider("google");
}

async function mountMapLibre() {
  const maplibregl = await import("maplibre-gl");
  if (!mapSession.container) return;
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
  const map = new maplibregl.Map({
    container: mapSession.container,
    center: [103.8198, 1.3521],
    zoom: 10.6,
    minZoom: 9.5,
    maxZoom: 18,
    attributionControl: false,
    style: {
      version: 8,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } },
      layers: [{ id: "osm", type: "raster", source: "osm" }]
    }
  });
  mapSession.maplibre = map;
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
  map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
  map.on("load", () => {
    map.addSource("homes", { type: "geojson", cluster: true, clusterMaxZoom: 14, clusterRadius: 46, data: listingFeatures(mapSession.listings) });
    map.addLayer({ id: "home-clusters", type: "circle", source: "homes", filter: ["has", "point_count"], paint: { "circle-color": "#0d6b64", "circle-radius": ["step", ["get", "point_count"], 21, 10, 27, 30, 34], "circle-stroke-width": 3, "circle-stroke-color": "#fffdf8" } });
    map.addLayer({ id: "cluster-count", type: "symbol", source: "homes", filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Open Sans Semibold"], "text-size": 12 }, paint: { "text-color": "#ffffff" } });
    map.addLayer({ id: "home-points", type: "circle", source: "homes", filter: ["!", ["has", "point_count"]], paint: { "circle-color": "#ec6a4d", "circle-radius": 8, "circle-stroke-width": 3, "circle-stroke-color": "#fffdf8" } });
    map.addLayer({ id: "home-prices", type: "symbol", source: "homes", filter: ["!", ["has", "point_count"]], layout: { "text-field": ["get", "price"], "text-size": 11, "text-font": ["Open Sans Semibold"], "text-offset": [0, -1.8], "text-allow-overlap": false }, paint: { "text-color": "#102a2e", "text-halo-color": "#fffdf8", "text-halo-width": 2 } });
    setProvider("maplibre");
  });
  map.on("click", "home-clusters", async (event) => {
    const feature = map.queryRenderedFeatures(event.point, { layers: ["home-clusters"] })[0];
    const clusterId = feature?.properties?.cluster_id;
    const source = map.getSource("homes") as GeoJSONSource;
    if (clusterId !== undefined) map.easeTo({ center: (feature.geometry as unknown as { coordinates: [number, number] }).coordinates, zoom: await source.getClusterExpansionZoom(clusterId) });
  });
  map.on("click", "home-points", (event) => { const slug = event.features?.[0]?.properties?.slug; if (slug) mapSession.navigate?.(slug); });
  for (const layer of ["home-clusters", "home-points"]) {
    map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
  }
}

async function initializeMap() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (key) {
    try { await mountGoogleMap(key); return; }
    catch { mapSession.container?.replaceChildren(); }
  }
  await mountMapLibre();
}

export function PropertyMap({ listings, onNavigate }: { listings: Listing[]; onNavigate?: () => void }) {
  const mapNode = useRef<HTMLDivElement>(null);
  const [provider, setLocalProvider] = useState<MapProvider>(mapSession.provider);
  const router = useRouter();

  useEffect(() => { updateListings(listings); }, [listings]);
  useEffect(() => {
    mapSession.navigate = (slug) => { onNavigate?.(); router.push(`/listings/${slug}`); };
    return () => { mapSession.navigate = null; };
  }, [onNavigate, router]);

  useEffect(() => {
    const host = mapNode.current;
    if (!host) return;
    const listener = (nextProvider: MapProvider) => setLocalProvider(nextProvider);
    mapSession.listeners.add(listener);
    if (!mapSession.container) {
      mapSession.container = document.createElement("div");
      mapSession.container.className = "persistent-map-container";
    }
    const container = mapSession.container;
    host.appendChild(container);
    container.style.display = "block";
    setLocalProvider(mapSession.provider);
    requestAnimationFrame(() => mapSession.maplibre?.resize());
    if (!mapSession.initPromise) mapSession.initPromise = initializeMap().catch(() => setProvider("error"));
    return () => {
      mapSession.listeners.delete(listener);
      if (container.parentElement === host) {
        container.style.display = "none";
        document.body.appendChild(container);
      }
    };
  }, []);

  return <div className="map-panel" aria-label="Map of search results">
    <div ref={mapNode} style={{ position: "absolute", inset: 0 }} />
    {provider === "error" && <div className="map-fallback" />}
    <div className="map-label">{provider === "google" ? "Google Maps · drag to explore" : provider === "maplibre" ? "MapLibre · OpenStreetMap" : provider === "error" ? "Map unavailable" : "Loading map…"}</div>
  </div>;
}
