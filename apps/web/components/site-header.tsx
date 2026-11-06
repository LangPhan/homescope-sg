"use client";

import Link from "next/link";
import { Building2, LogOut, Menu } from "lucide-react";
import { useAuthSession } from "@/components/auth-session";
import { useRouter } from "next/navigation";

export function SiteHeader() {
  const { user, ready, signOut } = useAuthSession();
  const router = useRouter();
  async function logout() {
    await signOut();
    router.push("/");
    router.refresh();
  }
  return <>
    <header className="site-header">
      <div className="container nav">
        <Link href="/" className="brand" aria-label="HomeScope SG home">
          <span className="brand-mark"><Building2 size={19} /></span>
          <span>HomeScope <span style={{ color: "var(--coral)" }}>SG</span></span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/search">Explore homes</Link>
          <Link href="/engineering">Engineering</Link>
          <Link href="/account">Saved homes</Link>
          {!ready ? <span className="nav-auth-placeholder" aria-hidden="true"/> : user ? <div className="nav-account"><Link href="/account" className="nav-greeting">Hello, <strong>{user.name}</strong></Link><button className="nav-logout" onClick={logout} aria-label={`Sign out ${user.name}`}><LogOut size={16}/>Log out</button></div> : <Link href="/auth" className="button button-primary" style={{ minHeight: 40 }}>Sign in</Link>}
        </nav>
        <button className="button button-ghost mobile-menu" aria-label="Open menu"><Menu size={19} /></button>
      </div>
    </header>
    <div className="disclaimer">Independent portfolio case study · Synthetic data · Not affiliated with or endorsed by PropNex Limited</div>
  </>;
}
