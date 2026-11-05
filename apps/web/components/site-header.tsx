import Link from "next/link";
import { Building2, Menu } from "lucide-react";

export function SiteHeader() {
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
          <Link href="/auth" className="button button-primary" style={{ minHeight: 40 }}>Sign in</Link>
        </nav>
        <button className="button button-ghost mobile-menu" aria-label="Open menu"><Menu size={19} /></button>
      </div>
    </header>
    <div className="disclaimer">Independent portfolio case study · Synthetic data · Not affiliated with or endorsed by PropNex Limited</div>
  </>;
}
