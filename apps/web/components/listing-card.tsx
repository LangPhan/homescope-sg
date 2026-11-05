"use client";
import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, Heart, MapPin, Maximize } from "lucide-react";
import { useState } from "react";
import { money } from "@/lib/api";
import { Listing } from "@/lib/types";

export function ListingCard({ listing }: { listing: Listing }) {
  const [saved, setSaved] = useState(false);
  async function toggleSaved(event: React.MouseEvent) {
    event.preventDefault();
    setSaved((value) => !value);
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/me/favourites/${listing.id}`, { method: saved ? "DELETE" : "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => setSaved(saved));
  }
  return <Link href={`/listings/${listing.slug}`} className="listing-card" aria-label={`View ${listing.title}`}>
    <div className="listing-image-wrap">
      <Image className="listing-image" src={listing.image_url} alt={listing.title} fill sizes="(max-width: 620px) 100vw, 33vw" />
      {listing.is_featured && <span className="card-badge">Curated pick</span>}
      <button className="save-button" aria-label={saved ? "Remove from saved homes" : "Save home"} onClick={toggleSaved}><Heart size={18} fill={saved ? "var(--coral)" : "none"} color={saved ? "var(--coral)" : "currentColor"} /></button>
    </div>
    <div className="listing-body">
      <div className="eyebrow">{listing.property_type} · {listing.tenure}</div>
      <h3>{listing.title}</h3>
      <div className="muted" style={{ fontSize: ".8rem", display: "flex", alignItems: "center", gap: 5 }}><MapPin size={13} /> {listing.address}, {listing.district}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 16 }}><span className="price">{money(listing.price)}</span><span className="muted" style={{ fontSize: ".75rem" }}>{money(listing.psf)} psf</span></div>
      <div className="facts"><span><BedDouble size={15}/>{listing.bedrooms}</span><span><Bath size={15}/>{listing.bathrooms}</span><span><Maximize size={15}/>{listing.floor_area.toLocaleString()} sqft</span></div>
    </div>
  </Link>;
}
