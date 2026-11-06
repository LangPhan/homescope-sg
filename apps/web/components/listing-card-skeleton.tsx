import { Skeleton } from "@/components/ui/skeleton";

export function ListingCardSkeleton() {
  return <div className="listing-card overflow-hidden rounded-[14px] border border-line bg-white" aria-hidden="true">
    <Skeleton className="h-[180px] rounded-none bg-[#e8ece8]" />
    <div className="grid gap-3 p-5"><Skeleton className="h-3 w-[42%] rounded-full bg-[#e8ece8]" /><Skeleton className="h-5 w-[68%] rounded-full bg-[#e8ece8]" /><Skeleton className="h-3 rounded-full bg-[#e8ece8]" /><Skeleton className="h-3 w-[42%] rounded-full bg-[#e8ece8]" /></div>
  </div>;
}
