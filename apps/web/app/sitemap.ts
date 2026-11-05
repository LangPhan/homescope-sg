import { MetadataRoute } from "next";
import { demoListings } from "@/lib/demo-data";
export default function sitemap(): MetadataRoute.Sitemap { const base=process.env.APP_URL||"http://localhost:3000"; return [{url:base,priority:1},{url:`${base}/search`,priority:.9},{url:`${base}/engineering`,priority:.7},...demoListings.map(item=>({url:`${base}/listings/${item.slug}`,priority:.8}))]; }
