"use client";
import Link from "next/link";
import { Building2, LogOut, Menu } from "lucide-react";
import { useAuthSession } from "@/components/auth-session";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, ready, signOut } = useAuthSession(); const router = useRouter();
  async function logout() { await signOut(); router.push("/"); router.refresh(); }
  return <><header className="site-header sticky top-0 z-40 flex h-[72px] items-center border-b border-ink/8 bg-paper/90 backdrop-blur-[14px]"><div className="mx-auto flex w-[min(1200px,calc(100%-40px))] items-center justify-between"><Link href="/" className="flex items-center gap-2.5 font-extrabold" aria-label="HomeScope SG home"><span className="grid size-[35px] place-items-center rounded-[10px_10px_4px_10px] bg-teal text-white -rotate-2"><Building2 size={19}/></span><span>HomeScope <span className="text-coral">SG</span></span></Link><nav className="hidden items-center gap-7 text-[.9rem] font-semibold min-[901px]:flex" aria-label="Main navigation"><Link href="/search">Explore homes</Link><Link href="/engineering">Engineering</Link><Link href="/account">Saved homes</Link>{!ready ? <span className="h-10 w-[92px] rounded-[10px] bg-[#e8ece8]" aria-hidden="true"/> : user ? <div className="flex items-center gap-2.5 pl-1"><Link href="/account" className="max-w-[190px] truncate">Hello, <strong>{user.name}</strong></Link><Button variant="outline" size="sm" className="h-10 gap-2 rounded-[10px] border-line px-3 font-bold hover:border-teal hover:bg-white hover:text-teal" onClick={logout} aria-label={`Sign out ${user.name}`}><LogOut size={16}/>Log out</Button></div> : <Link href="/auth" className="inline-flex h-10 items-center rounded-[10px] bg-teal px-[18px] font-bold text-white shadow-[0_8px_18px_rgba(13,107,100,.2)] hover:bg-teal-dark">Sign in</Link>}</nav><Button variant="outline" size="icon" className="min-[901px]:hidden" aria-label="Open menu"><Menu size={19}/></Button></div></header><div className="border-t border-[#f0d8c8] bg-[#fff3e9] px-5 py-[13px] text-center text-[.76rem] text-[#75452f]">Independent portfolio case study · Synthetic data · Not affiliated with or endorsed by PropNex Limited</div></>;
}
