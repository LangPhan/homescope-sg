"use client";

import { ChevronDown, Database } from "lucide-react";
import { useState } from "react";
import { InsightSection } from "./insight-section";
import { money, type ListingTransaction } from "@/shared/api";
import { DataTable, createDataTableColumnHelper, type DataTableColumn, Pill } from "@/shared/ui";

const DATASET_URL = "https://data.gov.sg/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/view";

function formatMonth(month: string) {
  return new Intl.DateTimeFormat("en-SG", { month: "short", year: "numeric" }).format(new Date(`${month}-01T00:00:00`));
}

const columnHelper = createDataTableColumnHelper<ListingTransaction>();
const columns: DataTableColumn<ListingTransaction>[] = columnHelper.columns([
  columnHelper.accessor("month", {
    header: "Registered",
    cell: ({ getValue }) => <span className="font-bold">{formatMonth(getValue())}</span>,
    meta: { headerClassName: "pl-7", cellClassName: "pl-7" },
  }),
  columnHelper.accessor("price", {
    header: "Price",
    cell: ({ getValue }) => <span className="font-serif text-lg font-semibold text-teal">{money(Number(getValue()))}</span>,
  }),
  columnHelper.accessor("psf", {
    header: "PSF",
    cell: ({ getValue }) => money(Number(getValue())),
  }),
  columnHelper.accessor("floor_area_sqm", {
    header: "Floor area",
    cell: ({ getValue }) => getValue() ? `${Number(getValue()).toLocaleString()} sqm` : "—",
  }),
  columnHelper.accessor("storey_range", {
    header: "Storey",
    cell: ({ getValue }) => getValue() || "—",
  }),
  columnHelper.accessor("flat_model", {
    header: "Type",
    cell: ({ getValue }) => getValue() || "—",
    meta: { headerClassName: "pr-7", cellClassName: "pr-7" },
  }),
]);

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
      <DataTable data={visible} columns={columns} getRowId={(transaction, index) => `${transaction.month}-${index}`} tableClassName="min-w-[650px]"/>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-xs text-muted-copy sm:px-7">
        <span>{isReal ? <>Source <a className="font-bold text-teal underline underline-offset-2" href={DATASET_URL} target="_blank" rel="noreferrer">data.gov.sg · HDB</a></> : "Illustrative values · generated from one HDB resale pattern"}</span>
        {latestFirst.length > 6 && <button type="button" onClick={() => setExpanded((value) => !value)} className="inline-flex items-center gap-1.5 font-bold text-teal" aria-expanded={expanded}>{expanded ? "Show less" : `Show all ${latestFirst.length}`}<ChevronDown size={14} className={expanded ? "rotate-180" : ""}/></button>}
      </footer>
    </InsightSection>
  );
}
