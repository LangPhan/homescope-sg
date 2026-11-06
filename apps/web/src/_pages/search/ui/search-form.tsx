"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getListings } from "@/shared/api";
import { Button, Input } from "@/shared/ui";

const fieldClass = "h-[46px] min-w-[145px] rounded-[9px] border border-line bg-white px-3 text-ink outline-none transition focus-visible:border-teal focus-visible:ring-4 focus-visible:ring-teal/10";

export function SearchForm() {
  const router = useRouter();
  const current = useSearchParams();
  const [type, setType] = useState(current.get("subtype") || current.get("property_type") || "");
  const [price, setPrice] = useState(current.get("max_price") || "");
  const [beds, setBeds] = useState(current.get("bedrooms") || "");
  const { data } = useQuery({
    queryKey: ["filter-catalogue"],
    queryFn: () => getListings({ view: "map", limit: "300" }),
    staleTime: 60_000,
  });
  function available(candidateType: string, candidatePrice: string, candidateBeds: string) {
    return !data || data.data.some((home) =>
      (!candidateType || (candidateType === "Executive Condo" ? home.subtype === candidateType : home.property_type === candidateType)) &&
      (!candidatePrice || home.price <= Number(candidatePrice)) &&
      (!candidateBeds || home.bedrooms >= Number(candidateBeds)));
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of form.entries()) if (String(value)) params.set(key, String(value));
    if (type === "Executive Condo") {
      params.delete("property_type");
      params.set("subtype", type);
    }
    router.push(`/search?${params}`);
  }
  return <form className="flex gap-2.5 overflow-x-auto pb-1 lg:grid lg:grid-cols-[minmax(220px,1.6fr)_repeat(4,minmax(125px,.7fr))_auto] lg:overflow-visible" onSubmit={submit}>
    <Input className="h-[46px] min-w-[230px] rounded-[9px] border-line bg-white px-3 text-ink shadow-none focus-visible:border-teal focus-visible:ring-4 focus-visible:ring-teal/10 lg:min-w-0" name="q" defaultValue={current.get("q") || ""} placeholder="Neighbourhood, MRT or project" aria-label="Search location" />
    <select className={fieldClass} name="property_type" value={type} onChange={(event) => setType(event.target.value)} aria-label="Property type">
      <option value="">All homes</option>
      {["Condo", "Executive Condo", "Apartment", "HDB", "Landed"].map((option) => <option key={option} disabled={!available(option, price, beds)}>{option}</option>)}
    </select>
    <select className={fieldClass} name="max_price" value={price} onChange={(event) => setPrice(event.target.value)} aria-label="Maximum price">
      <option value="">Any price</option>
      {[["800000", "$800k"], ["1500000", "$1.5m"], ["3000000", "$3m"], ["6000000", "$6m"]].map(([value, label]) => <option key={value} value={value} disabled={!available(type, value, beds)}>Up to {label}</option>)}
    </select>
    <select className={fieldClass} name="bedrooms" value={beds} onChange={(event) => setBeds(event.target.value)} aria-label="Minimum bedrooms">
      <option value="">Any beds</option>
      {["1", "2", "3", "4"].map((option) => <option key={option} value={option} disabled={!available(type, price, option)}>{option}+ bed</option>)}
    </select>
    <select className={fieldClass} name="sort" defaultValue={current.get("sort") || "newest"} aria-label="Sort listings"><option value="newest">Newest</option><option value="price_asc">Lowest price</option><option value="price_desc">Highest price</option><option value="psf_asc">Lowest PSF</option></select>
    <Button type="submit" className="h-[46px] min-w-fit rounded-[10px] bg-teal px-[18px] font-bold shadow-[0_8px_18px_rgba(13,107,100,.2)] hover:bg-teal-dark"><Search size={17}/> Search</Button>
  </form>;
}
