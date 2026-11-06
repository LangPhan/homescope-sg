"use client";
import Link from "next/link";
import { Bell, Heart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ListingCard, useSavedHomes } from "@/entities/listing";
import { API_URL } from "@/shared/api";
import { useAuthSession } from "@/shared/auth";
import { Button } from "@/shared/ui";
type SavedSearch={id:number;name:string;filters:Record<string,string>;created_at:string};
const titleClass="font-serif text-[2.2rem] tracking-[-.035em]";
const cardClass="rounded-[14px] border border-line p-6 shadow-[0_14px_40px_rgba(16,42,46,.07)]";
export function AccountDashboard() {
  const { user, ready, authenticatedFetch } = useAuthSession();
  const savedHomes = useSavedHomes();
  const email = user?.email;
  const homes = savedHomes.data ?? [];
  const [searches, setSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    if (!email) return;
    const controller = new AbortController();
    authenticatedFetch(`${API_URL}/me/saved-searches`, { signal: controller.signal })
      .then((response) => response.json())
      .then((payload) => { if (!controller.signal.aborted) setSearches(payload.data || []); })
      .catch(() => {});
    return () => controller.abort();
  }, [email, authenticatedFetch]);

  async function removeSearch(id: number) {
    const response = await authenticatedFetch(`${API_URL}/me/saved-searches/${id}`, { method: "DELETE" });
    if (response.ok) setSearches((items) => items.filter((item) => item.id !== id));
  }

  if (!ready) return <p role="status">Loading your account…</p>;
  if(!user)return <div className="grid grid-cols-3 gap-[22px] max-[900px]:grid-cols-2 max-[620px]:grid-cols-1"><div className={cardClass}><Heart size={24} className="text-coral"/><h2 className="mt-4 font-serif text-[2rem] tracking-[-.035em]">Your shortlist is private</h2><p className="text-muted-copy">Sign in to load saved homes and searches from the PHP API.</p><Link href="/auth" className="mt-4 inline-flex h-[46px] items-center rounded-[10px] bg-teal px-[18px] font-bold text-white">Sign in</Link></div><div className={cardClass}><Bell size={24} className="text-teal"/><h2 className="mt-4 font-serif text-[2rem] tracking-[-.035em]">Keep useful filters</h2><p className="text-muted-copy">Run a search, then save its URL-backed filter set.</p><Link href="/search" className="mt-4 inline-flex h-[46px] items-center rounded-[10px] border border-line bg-white px-[18px] font-bold">Explore homes</Link></div></div>;
  return <><h2 className={titleClass}>Saved homes</h2>{savedHomes.isPending ? <p role="status">Loading saved homes…</p> : savedHomes.isError && !savedHomes.data ? <p role="status">Could not load saved homes.</p> : homes.length?<div className="grid grid-cols-3 gap-[22px] max-[900px]:grid-cols-2 max-[620px]:grid-cols-1">{homes.map(home=><ListingCard listing={home} key={home.id}/>)}</div>:<div className={cardClass}><p className="text-muted-copy">No saved homes yet. Use the heart on any listing.</p></div>}<h2 className={`${titleClass} mt-[50px]`}>Saved searches</h2>{searches.length?<div className="grid gap-2.5">{searches.map(item=><div className={`${cardClass} flex items-center justify-between p-[18px]`} key={item.id}><Link href={`/search?${new URLSearchParams(item.filters)}`}><strong>{item.name}</strong><div className="mt-1 text-[.75rem] text-muted-copy">{Object.entries(item.filters).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join(" · ")}</div></Link><Button variant="outline" size="icon" className="static rounded-full border-0 bg-white" aria-label={`Delete ${item.name}`} onClick={()=>removeSearch(item.id)}><Trash2 size={16}/></Button></div>)}</div>:<div className={cardClass}><p className="text-muted-copy">No saved searches yet.</p></div>}</>;
}
