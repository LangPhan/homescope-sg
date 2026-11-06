import { ArrowRight, House, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="mx-auto w-[min(1200px,calc(100%-32px))] pt-8 pb-24 sm:pt-14 lg:pt-20">
      <section className="grid overflow-hidden rounded-[28px] border border-line bg-cream md:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-10 sm:p-12 lg:p-16">
          <p className="flex items-center gap-3 text-xs font-extrabold tracking-[.2em] text-teal-dark uppercase">
            <span className="h-px w-7 bg-teal" aria-hidden="true" />
            404 · Page not found
          </p>
          <h1 className="mt-5 font-serif text-[clamp(3rem,6vw,5.5rem)] leading-[.9] font-semibold tracking-[-.04em]">
            A little off<br />the map.
          </h1>
          <p className="mt-5 max-w-[34ch] leading-relaxed text-muted-copy">
            The page or listing you’re looking for may have moved or is no longer available.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/search" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal px-4 text-sm font-bold text-white transition-colors hover:bg-teal-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal">
              <Search size={16} aria-hidden="true" />
              Explore homes
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-paper px-4 text-sm font-bold transition-colors hover:border-teal hover:text-teal-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal">
              <House size={16} aria-hidden="true" />
              Back to home
            </Link>
          </div>
        </div>

        <div className="relative min-h-[230px] overflow-hidden bg-[#103c39] md:min-h-[460px]" aria-hidden="true">
          <svg className="absolute inset-0 size-full" viewBox="0 0 580 460" preserveAspectRatio="xMidYMid slice" fill="none" focusable="false">
            <defs>
              <pattern id="missing-map-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M32 0H0V32" stroke="#c3e0c6" strokeOpacity=".12" />
              </pattern>
            </defs>
            <path fill="url(#missing-map-grid)" d="M0 0h580v460H0z" />
            <g fill="#28554b" stroke="#80aa92" strokeOpacity=".25">
              <path d="m-18 54 153-36 34 92-112 40-74-22Z" />
              <path d="m160 15 116-28 24 114-104 27Z" />
              <path d="m-12 159 72 17 126-42 39 76-105 38-132-25Z" />
              <path d="m69 271 167-41 37 67-151 59Z" />
              <path d="m-11 290 63-14 68 106-34 88H-11Z" />
              <path d="m147 375 139-58 43 102-103 54h-117Z" />
              <path d="m363 123 94-36 34 91-100 32Z" />
              <path d="m409 233 91-33 45 119-105 30Z" />
              <path d="m447 373 108-28 37 113-121 22Z" />
            </g>
            <path d="M335-22c-44 94 33 128 12 206-17 61-48 101-10 169 18 33 30 67 23 119" stroke="#1d615c" strokeWidth="43" />
            <path d="M335-22c-44 94 33 128 12 206-17 61-48 101-10 169 18 33 30 67 23 119" stroke="#81c5b4" strokeOpacity=".35" strokeWidth="1.5" />
            <path d="M-30 259c141 49 195-31 305-47s173 10 328-70M42 487c42-114 146-125 225-179s134-150 340-234" stroke="#adccad" strokeOpacity=".4" strokeWidth="2" />
            <path d="M102 321c81 11 97-73 150-71 62 3 55 59 124 46 46-8 64-39 72-82" stroke="#f0bf9d" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 8" />
            <circle cx="102" cy="321" r="8" fill="#103c39" stroke="#f0bf9d" strokeWidth="2" />
            <circle cx="448" cy="214" r="6" fill="#f0bf9d" />
            <circle cx="290" cy="212" r="87" fill="#a4c6a8" fillOpacity=".07" stroke="#a4c6a8" strokeOpacity=".26" />
            <circle cx="290" cy="212" r="68" fill="#103c39" stroke="#a4c6a8" strokeOpacity=".5" />
            <path d="M290 259s-36-33-36-57a36 36 0 1 1 72 0c0 24-36 57-36 57Z" fill="#ec6a4d" />
            <path d="m275 202 15-13 15 13m-26-3v17h22v-17m-14 17v-9h6v9" stroke="#102a2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>
    </main>
  );
}
