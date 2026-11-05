import Link from "next/link";
import { Building2 } from "lucide-react";

export function Footer() {
  return <footer className="footer">
    <div className="container footer-row">
      <div className="brand"><span className="brand-mark"><Building2 size={18} /></span>HomeScope SG</div>
      <p className="muted" style={{ fontSize: ".8rem" }}>A full-stack property portal case study built for engineering review.</p>
      <div style={{ display: "flex", gap: 20, fontSize: ".82rem", fontWeight: 700 }}><Link href="/search">Search</Link><Link href="/engineering">How it works</Link></div>
    </div>
  </footer>;
}
