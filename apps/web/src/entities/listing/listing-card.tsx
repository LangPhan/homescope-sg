"use client";

import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, MapPin, Maximize } from "lucide-react";
import { SaveHomeButton } from "./save-home-button";
import { money, type Listing } from "@/shared/api";
import { Eyebrow } from "@/shared/ui";

export function ListingCard({ listing, onNavigate }: { listing: Listing; onNavigate?: () => void }) {
  return <article className="listing-card group relative overflow-hidden rounded-[14px] border border-line bg-white transition duration-200 hover:-translate-y-1 hover:shadow-soft">
    <Link href={`/listings/${listing.slug}`} className="block" aria-label={`View ${listing.title}`} onClick={onNavigate}>
      <div className="relative h-[230px] overflow-hidden bg-[#dde5e1] sm:h-[180px]">
        <Image className="object-cover transition duration-[400ms] group-hover:scale-[1.025]" src={listing.image_url} alt={listing.title} fill sizes="(max-width: 620px) 100vw, 33vw" />
        {listing.is_featured && <span className="absolute top-3.5 left-3.5 rounded-md bg-coral px-2.5 py-1.5 text-[.71rem] font-extrabold tracking-[.06em] text-white uppercase">Curated pick</span>}
      </div>
      <div className="p-5">
        <Eyebrow>{listing.property_type} · {listing.tenure}</Eyebrow>
        <h3 className="my-2 text-xl font-bold">{listing.title}</h3>
        <div className="flex items-center gap-1.5 text-[.8rem] text-muted-copy"><MapPin size={13} /> {listing.address}, {listing.district}</div>
        <div className="mt-4 flex items-baseline gap-2"><span className="font-serif text-[1.55rem] font-medium text-teal">{money(listing.price)}</span><span className="text-[.75rem] text-muted-copy">{money(listing.psf)} psf</span></div>
        <div className="mt-4 flex gap-4 border-t border-line pt-3.5 text-[.82rem] text-muted-copy"><span className="flex items-center gap-1"><BedDouble size={15}/>{listing.bedrooms}</span><span className="flex items-center gap-1"><Bath size={15}/>{listing.bathrooms}</span><span className="flex items-center gap-1"><Maximize size={15}/>{listing.floor_area.toLocaleString()} sqft</span></div>
      </div>
    </Link>
    <SaveHomeButton listing={listing} compact />
  </article>;
}
