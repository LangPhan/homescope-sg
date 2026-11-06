"use client";

import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, Heart, MapPin, Maximize } from "lucide-react";
import { useState } from "react";
import { money } from "@/lib/api";
import { Listing } from "@/lib/types";
import { Eyebrow } from "@/components/ui/eyebrow";

export function ListingCard({ listing, onNavigate }: { listing: Listing; onNavigate?: () => void }) {
  const [saved, setSaved] = useState(false);
  async function toggleSaved(event: React.MouseEvent) {
    event.preventDefault();
    setSaved((value) => !value);
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/me/favourites/${listing.id}`, { method: saved ? "DELETE" : "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => setSaved(saved));
  }
  return <Link href={`/listings/${listing.slug}`} className="listing-card group overflow-hidden rounded-[14px] border border-line bg-white transition duration-200 hover:-translate-y-1 hover:shadow-soft" aria-label={`View ${listing.title}`} onClick={(event) => { if (!event.defaultPrevented) onNavigate?.(); }}>
    <div className="relative h-[230px] overflow-hidden bg-[#dde5e1] sm:h-[180px]">
      <Image className="object-cover transition duration-[400ms] group-hover:scale-[1.025]" src={listing.image_url} alt={listing.title} fill sizes="(max-width: 620px) 100vw, 33vw" />
      {listing.is_featured && <span className="absolute top-3.5 left-3.5 rounded-md bg-coral px-2.5 py-1.5 text-[.71rem] font-extrabold tracking-[.06em] text-white uppercase">Curated pick</span>}
      <button className="absolute top-3.5 right-3.5 grid size-[38px] place-items-center rounded-full border-0 bg-white/92 text-ink" aria-label={saved ? "Remove from saved homes" : "Save home"} onClick={toggleSaved}><Heart size={18} fill={saved ? "var(--coral)" : "none"} color={saved ? "var(--coral)" : "currentColor"} /></button>
    </div>
    <div className="p-5">
      <Eyebrow>{listing.property_type} · {listing.tenure}</Eyebrow>
      <h3 className="my-2 text-xl font-bold">{listing.title}</h3>
      <div className="flex items-center gap-1.5 text-[.8rem] text-muted-copy"><MapPin size={13} /> {listing.address}, {listing.district}</div>
      <div className="mt-4 flex items-baseline gap-2"><span className="font-serif text-[1.55rem] font-medium text-teal">{money(listing.price)}</span><span className="text-[.75rem] text-muted-copy">{money(listing.psf)} psf</span></div>
      <div className="mt-4 flex gap-4 border-t border-line pt-3.5 text-[.82rem] text-muted-copy"><span className="flex items-center gap-1"><BedDouble size={15}/>{listing.bedrooms}</span><span className="flex items-center gap-1"><Bath size={15}/>{listing.bathrooms}</span><span className="flex items-center gap-1"><Maximize size={15}/>{listing.floor_area.toLocaleString()} sqft</span></div>
    </div>
  </Link>;
}
