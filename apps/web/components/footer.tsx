import Link from "next/link";
import { Building2 } from "lucide-react";

export function Footer() { return <footer className="border-t border-line py-[50px]"><div className="mx-auto flex w-[min(1200px,calc(100%-40px))] items-center justify-between gap-8 max-[620px]:block"><div className="flex items-center gap-2.5 font-extrabold"><span className="grid size-[35px] place-items-center rounded-[10px_10px_4px_10px] bg-teal text-white -rotate-2"><Building2 size={18}/></span>HomeScope SG</div><p className="text-[.8rem] text-muted-copy max-[620px]:my-4">A full-stack property portal case study built for engineering review.</p><div className="flex gap-5 text-[.82rem] font-bold"><Link href="/search">Search</Link><Link href="/engineering">How it works</Link></div></div></footer>; }
