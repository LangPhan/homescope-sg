"use client";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";

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
  return <form className="filter-row" onSubmit={submit}>
    <input className="field" name="q" defaultValue={current.get("q") || ""} placeholder="Neighbourhood, MRT or project" aria-label="Search location" />
    <select className="field" name="property_type" defaultValue={current.get("property_type") || ""} aria-label="Property type"><option value="">All homes</option><option>Condo</option><option>HDB</option><option>Apartment</option><option>Landed</option></select>
    <select className="field" name="max_price" defaultValue={current.get("max_price") || ""} aria-label="Maximum price"><option value="">Any price</option><option value="800000">Up to $800k</option><option value="1500000">Up to $1.5m</option><option value="3000000">Up to $3m</option><option value="6000000">Up to $6m</option></select>
    <select className="field" name="bedrooms" defaultValue={current.get("bedrooms") || ""} aria-label="Minimum bedrooms"><option value="">Any beds</option><option value="1">1+ bed</option><option value="2">2+ beds</option><option value="3">3+ beds</option><option value="4">4+ beds</option></select>
    <select className="field" name="sort" defaultValue={current.get("sort") || "newest"} aria-label="Sort listings"><option value="newest">Newest</option><option value="price_asc">Lowest price</option><option value="price_desc">Highest price</option><option value="psf_asc">Lowest PSF</option></select>
    <button className="button button-primary" type="submit"><Search size={17}/> Search</button>
  </form>;
}
