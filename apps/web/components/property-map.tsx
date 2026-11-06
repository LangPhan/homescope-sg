"use client";
import { useEffect, useRef, useState } from "react";
import { Listing } from "@/lib/types";

type MapProvider = "loading" | "google" | "maplibre" | "error";

export function PropertyMap({ listings }: { listings: Listing[] }) {
  const mapNode = useRef<HTMLDivElement>(null);
  const [provider, setProvider] = useState<MapProvider>("loading");
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!mapNode.current) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;

    async function mountGoogleMap() {
      const { setOptions, importLibrary } = await import("@googlemaps/js-api-loader");
      setOptions({ key: key as string, v: "weekly" });
      const { Map } = await importLibrary("maps") as google.maps.MapsLibrary;
      const { AdvancedMarkerElement } = await importLibrary("marker") as google.maps.MarkerLibrary;
      if (cancelled || !mapNode.current) return;
      const map = new Map(mapNode.current, { center: { lat: 1.3521, lng: 103.8198 }, zoom: 11, mapId: "DEMO_MAP_ID", disableDefaultUI: true, zoomControl: true });
      const { MarkerClusterer } = await import("@googlemaps/markerclusterer");
      const markers = listings.map((listing) => new AdvancedMarkerElement({ map, position: { lat: listing.latitude, lng: listing.longitude }, title: listing.title }));
      const clusterer = new MarkerClusterer({ map, markers });
      dispose = () => { clusterer.clearMarkers(); markers.forEach((marker) => { marker.map = null; }); };
      setProvider("google");
    }

    async function mountMapLibre() {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !mapNode.current) return;
      maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
      const map = new maplibregl.Map({
        container: mapNode.current,
        center: [103.8198, 1.3521],
        zoom: 10.6,
        minZoom: 9.5,
        maxZoom: 18,
        attributionControl: false,
        style: {
          version: 8,
          glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors"
            }
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }]
        }
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
      map.on("load", () => {
        if (cancelled) return;
        map.addSource("homes", {
          type: "geojson",
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 46,
          data: {
            type: "FeatureCollection",
            features: listings.map((listing) => ({
              type: "Feature",
              geometry: { type: "Point", coordinates: [listing.longitude, listing.latitude] },
              properties: { id: listing.id, slug: listing.slug, title: listing.title, price: `$${Math.round(listing.price / 1000)}k` }
            }))
          }
        });
        map.addLayer({ id: "home-clusters", type: "circle", source: "homes", filter: ["has", "point_count"], paint: { "circle-color": "#0d6b64", "circle-radius": ["step", ["get", "point_count"], 21, 10, 27, 30, 34], "circle-stroke-width": 3, "circle-stroke-color": "#fffdf8" } });
        map.addLayer({ id: "cluster-count", type: "symbol", source: "homes", filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 }, paint: { "text-color": "#ffffff" } });
        map.addLayer({ id: "home-points", type: "circle", source: "homes", filter: ["!", ["has", "point_count"]], paint: { "circle-color": "#ec6a4d", "circle-radius": 8, "circle-stroke-width": 3, "circle-stroke-color": "#fffdf8" } });
        map.addLayer({ id: "home-prices", type: "symbol", source: "homes", filter: ["!", ["has", "point_count"]], layout: { "text-field": ["get", "price"], "text-size": 11, "text-font": ["Open Sans Bold"], "text-offset": [0, -1.8], "text-allow-overlap": false }, paint: { "text-color": "#102a2e", "text-halo-color": "#fffdf8", "text-halo-width": 2 } });
        setProvider("maplibre");
      });
      map.on("click", "home-clusters", async (event) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: ["home-clusters"] })[0];
        const clusterId = feature?.properties?.cluster_id;
        const source = map.getSource("homes") as import("maplibre-gl").GeoJSONSource;
        if (clusterId !== undefined) map.easeTo({ center: (feature.geometry as unknown as { coordinates: [number, number] }).coordinates, zoom: await source.getClusterExpansionZoom(clusterId) });
      });
      map.on("click", "home-points", (event) => { const slug = event.features?.[0]?.properties?.slug; if (slug) window.location.assign(`/listings/${slug}`); });
      for (const layer of ["home-clusters", "home-points"]) {
        map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
      }
      dispose = () => map.remove();
    }

    (async () => {
      if (key) {
        try { await mountGoogleMap(); return; }
        catch { if (mapNode.current) mapNode.current.replaceChildren(); }
      }
      await mountMapLibre();
    })().catch(() => setProvider("error"));

    return () => { cancelled = true; dispose?.(); };
  }, [listings]);

  return <div className="map-panel" aria-label="Map of search results">
    <div ref={mapNode} style={{ position: "absolute", inset: 0 }} />
    {provider === "error" && <div className="map-fallback" />}
    <div className="map-label">{provider === "google" ? "Google Maps · drag to explore" : provider === "maplibre" ? "MapLibre · OpenStreetMap" : provider === "error" ? "Map unavailable" : "Loading map…"}</div>
  </div>;
}
