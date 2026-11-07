"use client";

import { areaY, defineChart, lineY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scalePoint } from "@tanstack/charts/scales/point";
import { tooltip } from "@tanstack/charts/tooltip";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { InsightSection } from "./insight-section";
import { money, type ListingTransaction } from "@/shared/api";

type Metric = "price" | "psf";
type TrendDatum = {
  month: string;
  value: number;
  baseline: number;
};

function shortMoney(value: number) {
  return value >= 1_000_000 ? `$${(value / 1_000_000).toFixed(2)}m` : `$${Math.round(value / 1000)}k`;
}

export function PriceTrends({ transactions }: { transactions: ListingTransaction[] }) {
  const [metric, setMetric] = useState<Metric>("price");
  const first = transactions[0];
  const latest = transactions.at(-1)!;
  const change = first ? ((latest[metric] - first[metric]) / first[metric]) * 100 : 0;
  const rising = change >= 0;
  const chartData = useMemo<TrendDatum[]>(() => {
    const values = transactions.map((transaction) => Number(transaction[metric]));
    const baseline = Math.floor(Math.min(...values) * 0.94);

    return transactions.map((transaction, index) => ({
      month: transaction.month,
      value: values[index],
      baseline,
    }));
  }, [metric, transactions]);
  const definition = useMemo(() => defineChart({
    marks: [
      areaY(chartData, {
        id: "price-trend-area",
        x: "month",
        y1: "baseline",
        y2: "value",
        fill: "url(#price-trend-fill)",
      }),
      lineY(chartData, {
        id: "price-trend-line",
        x: "month",
        y: "value",
        points: true,
        stroke: "#0d6b64",
        strokeWidth: 3,
      }),
    ],
    scales: {
      x: {
        scale: () => scalePoint<string>().padding(0.15),
        axis: {
          ticks: {
            format: (value) => String(value).slice(2).replace("-", "′"),
          },
        },
      },
      y: {
        scale: scaleLinear,
        nice: true,
        grid: true,
        axis: {
          ticks: {
            format: (value) => metric === "price" ? shortMoney(Number(value)) : `$${Math.round(Number(value))}`,
          },
        },
      },
    },
    gradients: [{
      id: "price-trend-fill",
      x1: 0,
      y1: 1,
      x2: 0,
      y2: 0,
      stops: [
        { offset: 0, color: "#0d6b64", opacity: 0.03 },
        { offset: 1, color: "#0d6b64", opacity: 0.26 },
      ],
    }],
    clip: true,
    focus: "nearest-x",
    svgAnimation: true,
    tooltip: {
      use: tooltip,
      format: (point) => `${point.datum.month}: ${metric === "price" ? money(point.datum.value) : `${money(point.datum.value)} psf`}`,
    },
  }), [chartData, metric]);

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
        <div className="h-[270px] min-w-0 text-muted-copy">
          <Chart
            definition={definition}
            height={270}
            initialWidth={600}
            ariaLabel={`Comparable ${metric === "price" ? "sale price" : "price per square foot"} by registration month`}
          />
        </div>
      </div>
    </InsightSection>
  );
}
