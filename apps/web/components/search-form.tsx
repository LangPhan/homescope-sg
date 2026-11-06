"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const fieldClass = "h-[46px] min-w-[145px] rounded-[9px] border border-line bg-white px-3 text-ink outline-none transition focus-visible:border-teal focus-visible:ring-4 focus-visible:ring-teal/10";

export function SearchForm() {
  const router = useRouter();
  const current = useSearchParams();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of form.entries()) if (String(value)) params.set(key, String(value));
    router.push(`/search?${params}`);
  }
  return <form className="flex gap-2.5 overflow-x-auto pb-1 lg:grid lg:grid-cols-[minmax(220px,1.6fr)_repeat(4,minmax(125px,.7fr))_auto] lg:overflow-visible" onSubmit={submit}>
    <Input className="h-[46px] min-w-[230px] rounded-[9px] border-line bg-white px-3 text-ink shadow-none focus-visible:border-teal focus-visible:ring-4 focus-visible:ring-teal/10 lg:min-w-0" name="q" defaultValue={current.get("q") || ""} placeholder="Neighbourhood, MRT or project" aria-label="Search location" />
    <select className={fieldClass} name="property_type" defaultValue={current.get("property_type") || ""} aria-label="Property type"><option value="">All homes</option><option>Condo</option><option>HDB</option><option>Apartment</option><option>Landed</option></select>
    <select className={fieldClass} name="max_price" defaultValue={current.get("max_price") || ""} aria-label="Maximum price"><option value="">Any price</option><option value="800000">Up to $800k</option><option value="1500000">Up to $1.5m</option><option value="3000000">Up to $3m</option><option value="6000000">Up to $6m</option></select>
    <select className={fieldClass} name="bedrooms" defaultValue={current.get("bedrooms") || ""} aria-label="Minimum bedrooms"><option value="">Any beds</option><option value="1">1+ bed</option><option value="2">2+ beds</option><option value="3">3+ beds</option><option value="4">4+ beds</option></select>
    <select className={fieldClass} name="sort" defaultValue={current.get("sort") || "newest"} aria-label="Sort listings"><option value="newest">Newest</option><option value="price_asc">Lowest price</option><option value="price_desc">Highest price</option><option value="psf_asc">Lowest PSF</option></select>
    <Button type="submit" className="h-[46px] min-w-fit rounded-[10px] bg-teal px-[18px] font-bold shadow-[0_8px_18px_rgba(13,107,100,.2)] hover:bg-teal-dark"><Search size={17}/> Search</Button>
  </form>;
}
