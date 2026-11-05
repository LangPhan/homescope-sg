import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Footer } from "@/components/footer";
import { ListingCard } from "@/components/listing-card";
import { getListings } from "@/lib/api";

export default async function Home() {
  const { data } = await getListings();
  return <main>
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">Singapore, seen more clearly</div>
          <h1 className="serif">A better view of <em>home.</em></h1>
          <p>Search by what matters — commute, space and true market context. HomeScope brings every signal together so your next move feels considered, not rushed.</p>
          <form action="/search" className="search-bar"><input name="q" placeholder="Try “near Tiong Bahru MRT”" aria-label="Search homes"/><button className="button button-primary"><Search size={18}/> Explore homes</button></form>
          <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}><span className="pill"><ShieldCheck size={14}/> Synthetic, transparent data</span><span className="pill"><Sparkles size={14}/> Built for thoughtful discovery</span></div>
        </div>
        <div className="hero-visual">
          <Image className="hero-image" src="https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1400&q=88" alt="Singapore skyline and modern waterfront homes" fill priority sizes="50vw" />
          <div className="hero-stat"><strong>300+</strong><span>curated demo homes across 28 districts</span></div>
          <div className="hero-note">● Live market context</div>
        </div>
      </div>
    </section>
    <section className="section">
      <div className="container">
        <div className="section-head"><div><div className="eyebrow">Homes worth a closer look</div><h2 className="serif">Fresh to market</h2></div><Link href="/search" className="button button-ghost">See all homes <ArrowRight size={17}/></Link></div>
        <div className="listing-grid">{data.slice(0, 6).map((listing) => <ListingCard key={listing.id} listing={listing}/>)}</div>
      </div>
    </section>
    <section className="section story-band"><div className="container story-grid"><div><div className="eyebrow" style={{ color: "#7ed3ca" }}>Made for decisions, not scrolling</div><h2 className="serif">The whole picture, before the viewing.</h2><p>Filter fast, explore spatially and understand how a home sits within its market. Every interaction is designed to remove uncertainty.</p><Link href="/engineering" className="button" style={{ background: "var(--coral)", color: "white", marginTop: 18 }}>See how it is built <ArrowRight size={17}/></Link></div><div className="story-points"><div className="story-point"><strong>01</strong><div><h3>Search the way you think</h3><p>Combine district, budget, tenure and transit filters without losing your place.</p></div></div><div className="story-point"><strong>02</strong><div><h3>Move through the map</h3><p>Viewport queries return only what is relevant as the island shifts beneath you.</p></div></div><div className="story-point"><strong>03</strong><div><h3>Read the market signal</h3><p>Price history and PSF context turn a listing into a better-informed decision.</p></div></div></div></div></section>
    <Footer />
  </main>;
}
