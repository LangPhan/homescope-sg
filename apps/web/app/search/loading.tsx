import { ListingCardSkeleton } from "@/components/listing-card-skeleton";

export default function SearchLoading() {
  return <main className="min-h-[calc(100vh-72px)]" aria-busy="true" aria-label="Loading homes">
    <div className="sticky top-[72px] z-[25] border-b border-line bg-white px-0 pt-6 pb-4"><div className="mx-auto w-[min(1200px,calc(100%-40px))]"><div className="h-[46px] animate-pulse rounded-[9px] bg-[#e8ece8]" /></div></div>
    <div className="grid h-[calc(100vh-158px)] grid-cols-[57%_43%] max-[900px]:block max-[900px]:h-auto">
      <section className="results-panel overflow-y-auto px-[max(20px,calc((100vw-1200px)/2))] pr-[22px] pb-7 max-[900px]:overflow-visible max-[620px]:px-3.5">
        <div className="mb-5 flex items-center justify-between gap-5 border-b border-line/80 bg-paper/96 py-[28px] pb-[18px] backdrop-blur-xl"><div><div className="text-xs font-extrabold tracking-[.15em] text-teal uppercase">Explore Singapore</div><h1 className="m-0 text-2xl">Finding homes…</h1></div></div>
        <div className="grid grid-cols-2 gap-4 max-[620px]:grid-cols-1">{Array.from({ length: 6 }, (_, index) => <ListingCardSkeleton key={index}/>)}</div>
      </section>
      <div className="min-h-[500px] animate-pulse bg-[#e8ece8] max-[900px]:h-[55vh]" />
    </div>
  </main>;
}
