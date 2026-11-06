import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Footer } from "@/components/footer";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Pill } from "@/components/ui/pill";
import { getListings } from "@/lib/api";

const container = "mx-auto w-[min(1200px,calc(100%-40px))] max-[620px]:w-[min(1200px,calc(100%-28px))]";
const primaryButton = "h-[46px] rounded-[10px] bg-teal px-[18px] font-bold text-white shadow-[0_8px_18px_rgba(13,107,100,.2)] hover:bg-teal-dark";

export default async function Home() {
  const { data } = await getListings();
  return <main>
    <section className="relative flex min-h-[680px] items-center overflow-hidden bg-cream before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_12%_20%,rgba(236,106,77,.12),transparent_28%),linear-gradient(105deg,transparent_0_57%,rgba(13,107,100,.06)_57%)] max-[620px]:min-h-0">
      <div className={`${container} relative grid grid-cols-[1.02fr_.98fr] items-center gap-[60px] py-[70px] max-[900px]:grid-cols-1 max-[900px]:gap-10 max-[620px]:py-[50px]`}>
        <div><Eyebrow>Singapore, seen more clearly</Eyebrow><h1 className="my-[18px] mb-6 font-serif text-[clamp(3.4rem,6vw,6.6rem)] leading-[.9] font-medium tracking-[-.035em]">A better view of <em className="text-teal">home.</em></h1><p className="max-w-[560px] text-[1.08rem] leading-[1.7] text-muted-copy">Search by what matters — commute, space and true market context. HomeScope brings every signal together so your next move feels considered, not rushed.</p>
          <form action="/search" className="mt-[34px] grid max-w-[600px] grid-cols-[1fr_auto] rounded-[14px] bg-white p-2 shadow-soft"><input className="min-w-0 border-0 px-3.5 text-ink outline-none" name="q" placeholder="Try “near Tiong Bahru MRT”" aria-label="Search homes"/><Button type="submit" className={primaryButton}><Search size={18}/> Explore homes</Button></form>
          <div className="mt-5 flex flex-wrap gap-3"><Pill><ShieldCheck size={14}/> Synthetic, transparent data</Pill><Pill><Sparkles size={14}/> Built for thoughtful discovery</Pill></div>
        </div>
        <div className="relative min-h-[520px] max-[900px]:min-h-[420px] max-[620px]:min-h-[340px]"><div className="absolute inset-y-0 right-0 bottom-[34px] left-[50px] overflow-hidden rounded-[140px_8px_140px_8px] shadow-soft max-[620px]:inset-[0_0_35px_22px] max-[620px]:rounded-[80px_6px_80px_6px]"><Image className="object-cover" src="https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1400&q=88" alt="Singapore skyline and modern waterfront homes" fill priority sizes="50vw"/></div><div className="absolute bottom-[5px] left-0 w-[210px] rounded-xl bg-teal p-[22px] text-white shadow-soft max-[620px]:w-[175px] max-[620px]:p-4"><strong className="block font-serif text-[2.25rem] font-medium">300+</strong><span>curated demo homes across 28 districts</span></div><div className="absolute top-[34px] right-[-15px] rounded-full bg-white px-[15px] py-3 text-[.8rem] font-bold shadow-soft">● Live market context</div></div>
      </div>
    </section>
    <section className="py-[100px] max-[620px]:py-[70px]"><div className={container}><div className="mb-9 flex items-end justify-between gap-8 max-[620px]:block"><div><Eyebrow>Homes worth a closer look</Eyebrow><h2 className="mt-2.5 font-serif text-[clamp(2.3rem,4vw,4rem)] leading-none font-medium tracking-[-.035em]">Fresh to market</h2></div><Link href="/search" className="inline-flex h-[46px] items-center justify-center gap-2 rounded-[10px] border border-line bg-white px-[18px] font-bold transition hover:-translate-y-px">See all homes <ArrowRight size={17}/></Link></div><div className="grid grid-cols-3 gap-[22px] max-[900px]:grid-cols-2 max-[620px]:grid-cols-1">{data.slice(0, 6).map((listing) => <ListingCard key={listing.id} listing={listing}/>)}</div></div></section>
    <section className="bg-ink py-[100px] text-white max-[620px]:py-[70px]"><div className={`${container} grid grid-cols-[.85fr_1.15fr] items-center gap-[90px] max-[900px]:grid-cols-1`}><div><Eyebrow className="text-[#7ed3ca]">Made for decisions, not scrolling</Eyebrow><h2 className="my-[15px] mb-6 font-serif text-[clamp(2.7rem,5vw,5rem)] leading-[.96] font-medium tracking-[-.035em]">The whole picture, before the viewing.</h2><p className="leading-[1.8] text-[#b9c8c8]">Filter fast, explore spatially and understand how a home sits within its market. Every interaction is designed to remove uncertainty.</p><Link href="/engineering" className="mt-[18px] inline-flex h-[46px] items-center gap-2 rounded-[10px] bg-coral px-[18px] font-bold text-white">See how it is built <ArrowRight size={17}/></Link></div><div className="grid gap-0.5">{[["01","Search the way you think","Combine district, budget, tenure and transit filters without losing your place."],["02","Move through the map","Viewport queries return only what is relevant as the island shifts beneath you."],["03","Read the market signal","Price history and PSF context turn a listing into a better-informed decision."]].map(([number,title,copy])=><div className="grid grid-cols-[56px_1fr] gap-4 border-b border-white/15 py-[25px]" key={number}><strong className="font-serif text-[1.8rem] font-medium text-[#7ed3ca]">{number}</strong><div><h3>{title}</h3><p className="leading-[1.8] text-[#b9c8c8]">{copy}</p></div></div>)}</div></div></section>
    <Footer />
  </main>;
}
