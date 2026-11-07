"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useId, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { InsightSection } from "./insight-section";
import { money, type ListingTransaction } from "@/shared/api";

type Metric = "price" | "psf";

function shortMoney(value: number) {
  return value >= 1_000_000 ? `$${(value / 1_000_000).toFixed(2)}m` : `$${Math.round(value / 1000)}k`;
}

export function PriceTrends({ transactions }: { transactions: ListingTransaction[] }) {
  const [metric, setMetric] = useState<Metric>("price");
  const gradientId = useId().replaceAll(":", "");
  const first = transactions[0];
  const latest = transactions.at(-1)!;
  const change = first ? ((latest[metric] - first[metric]) / first[metric]) * 100 : 0;
  const rising = change >= 0;
  const formatter = (value: number) => metric === "price" ? money(value) : `${money(value)} psf`;

  return (
    <InsightSection
      eyebrow="Price trends"
      title="How comparable prices have moved"
      description="Switch between total sale price and price per square foot to read the same transactions from two angles."
      aside={<div className="hidden rounded-xl bg-cream p-1 sm:flex">{(["price", "psf"] as Metric[]).map((value) => <button type="button" key={value} onClick={() => setMetric(value)} className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase transition ${metric === value ? "bg-white text-teal shadow-sm" : "text-muted-copy"}`} aria-pressed={metric === value}>{value}</button>)}</div>}
    >
      <div className="grid gap-4 p-5 sm:grid-cols-[160px_1fr] sm:p-7">
        <div className="rounded-xl bg-[#eff8f4] p-4 sm:self-stretch">
          <p className="text-[.68rem] font-extrabold tracking-[.12em] text-muted-copy uppercase">Period movement</p>
          <div className={`mt-3 flex items-center gap-1 text-2xl font-bold ${rising ? "text-teal" : "text-coral"}`}>{rising ? <ArrowUpRight/> : <ArrowDownRight/>}{Math.abs(change).toFixed(1)}%</div>
          <p className="mt-2 text-xs leading-5 text-muted-copy">From {first?.month} to {latest.month}</p>
          <div className="mt-4 flex rounded-lg bg-white p-1 sm:hidden">{(["price", "psf"] as Metric[]).map((value) => <button type="button" key={value} onClick={() => setMetric(value)} className={`flex-1 rounded-md px-2 py-1.5 text-xs font-bold uppercase ${metric === value ? "bg-teal text-white" : "text-muted-copy"}`}>{value}</button>)}</div>
        </div>
        <div className="h-[270px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={transactions} margin={{ top: 12, right: 8, left: 4, bottom: 0 }}>
              <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="4%" stopColor="#0d6b64" stopOpacity={.28}/><stop offset="96%" stopColor="#0d6b64" stopOpacity={.02}/></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="#e7ebe7" strokeDasharray="3 4"/>
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} minTickGap={32} tickFormatter={(value) => value.slice(2).replace("-", "′")}/>
              <YAxis tickLine={false} axisLine={false} width={58} fontSize={11} domain={["auto", "auto"]} tickFormatter={(value) => metric === "price" ? shortMoney(value) : `$${value}`}/>
              <Tooltip formatter={(value) => formatter(Number(value))} labelFormatter={(label) => `Registered ${label}`} contentStyle={{ border: "1px solid #dfe4df", borderRadius: 12, boxShadow: "0 10px 30px rgba(16,42,46,.1)" }}/>
              <Area type="monotone" dataKey={metric} stroke="#0d6b64" strokeWidth={3} fill={`url(#${gradientId})`} activeDot={{ r: 5, fill: "#ec6a4d", stroke: "#fff", strokeWidth: 2 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </InsightSection>
  );
}
