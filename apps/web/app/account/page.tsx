import Link from "next/link";
import { Search } from "lucide-react";
import { AccountDashboard } from "@/components/account-dashboard";
export const metadata = { title: "Saved homes" };
export default function AccountPage(){ return <main className="section"><div className="container"><div className="eyebrow">Your HomeScope</div><div className="section-head"><h1 className="serif" style={{fontSize:"4rem",margin:"10px 0"}}>Saved for later</h1><Link className="button button-primary" href="/search"><Search size={17}/> Explore homes</Link></div><AccountDashboard/></div></main>; }
