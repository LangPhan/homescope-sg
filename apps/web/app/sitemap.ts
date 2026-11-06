import { MetadataRoute } from "next";
import { getListings } from "@/shared/api";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL || "http://localhost:3000";
  const { data } = await getListings({ view: "map", limit: "300" });
  return ["/", "/search", "/resale", "/engineering", ...data.map((item) => `/listings/${item.slug}`)]
    .map((path) => ({ url: new URL(path, base).href }));
}
