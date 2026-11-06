import Link from "next/link";
import { Search } from "lucide-react";
import { AccountDashboard } from "./account-dashboard";
import { Eyebrow } from "@/shared/ui";
export const metadata = { title: "Saved homes" };
export default function AccountPage(){ return <main className="py-[100px] max-[620px]:py-[70px]"><div className="mx-auto w-[min(1200px,calc(100%-40px))]"><Eyebrow>Your HomeScope</Eyebrow><div className="mb-9 flex items-end justify-between gap-8 max-[620px]:block"><h1 className="my-2.5 font-serif text-[4rem] leading-none font-medium tracking-[-.035em]">Saved for later</h1><Link className="inline-flex h-[46px] items-center gap-2 rounded-[10px] bg-teal px-[18px] font-bold text-white shadow-[0_8px_18px_rgba(13,107,100,.2)] hover:bg-teal-dark" href="/search"><Search size={17}/> Explore homes</Link></div><AccountDashboard/></div></main>; }
