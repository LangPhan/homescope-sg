"use client";

import { ChevronDown, Database } from "lucide-react";
import { useState } from "react";
import { InsightSection } from "./insight-section";
import { money, type ListingTransaction } from "@/shared/api";
import { Pill } from "@/shared/ui";

const DATASET_URL = "https://data.gov.sg/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/view";

function formatMonth(month: string) {
  return new Intl.DateTimeFormat("en-SG", { month: "short", year: "numeric" }).format(new Date(`${month}-01T00:00:00`));
}

export function TransactionHistory({ transactions }: { transactions: ListingTransaction[] }) {
  const [expanded, setExpanded] = useState(false);
  const latestFirst = [...transactions].reverse();
  const visible = expanded ? latestFirst : latestFirst.slice(0, 6);
  const isReal = transactions.every((transaction) => transaction.data_source === "hdb");

  return (
    <InsightSection
      eyebrow="Transaction history"
      title="Recent comparable sales"
      description={isReal ? "Registered HDB resale transactions for the same block and flat type." : "A deterministic modelled history based on the shape of an official HDB resale sample."}
      aside={<Pill className="hidden shrink-0 sm:inline-flex"><Database size={12}/>{isReal ? "HDB resale data" : "Modelled sample"}</Pill>}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] border-collapse text-left text-sm">
          <thead className="bg-cream/65 text-[.68rem] tracking-[.12em] text-muted-copy uppercase">
            <tr><th className="px-7 py-3 font-bold">Registered</th><th className="px-4 py-3 font-bold">Price</th><th className="px-4 py-3 font-bold">PSF</th><th className="px-4 py-3 font-bold">Floor area</th><th className="px-4 py-3 font-bold">Storey</th><th className="px-7 py-3 font-bold">Type</th></tr>
          </thead>
          <tbody>
            {visible.map((transaction, index) => <tr key={`${transaction.month}-${index}`} className="border-t border-line first:border-t-0 hover:bg-[#f8fbf8]">
              <td className="px-7 py-4 font-bold">{formatMonth(transaction.month)}</td>
              <td className="px-4 py-4 font-serif text-lg font-semibold text-teal">{money(transaction.price)}</td>
              <td className="px-4 py-4">{money(transaction.psf)}</td>
              <td className="px-4 py-4">{transaction.floor_area_sqm ? `${Number(transaction.floor_area_sqm).toLocaleString()} sqm` : "—"}</td>
              <td className="px-4 py-4">{transaction.storey_range || "—"}</td>
              <td className="px-7 py-4">{transaction.flat_model || "—"}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-xs text-muted-copy sm:px-7">
        <span>{isReal ? <>Source <a className="font-bold text-teal underline underline-offset-2" href={DATASET_URL} target="_blank" rel="noreferrer">data.gov.sg · HDB</a></> : "Illustrative values · generated from one HDB resale pattern"}</span>
        {latestFirst.length > 6 && <button type="button" onClick={() => setExpanded((value) => !value)} className="inline-flex items-center gap-1.5 font-bold text-teal" aria-expanded={expanded}>{expanded ? "Show less" : `Show all ${latestFirst.length}`}<ChevronDown size={14} className={expanded ? "rotate-180" : ""}/></button>}
      </footer>
    </InsightSection>
  );
}
