"use client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { money } from "@/lib/api";

export function PriceChart({ data }: { data: { month: string; price: number; psf: number }[] }) {
  return <div className="chart-card"><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><div><div className="eyebrow">12-month movement</div><h3 style={{ margin: "5px 0" }}>Indicative price trend</h3></div><span className="pill">Demo transactions</span></div><ResponsiveContainer width="100%" height={230}><AreaChart data={data}><defs><linearGradient id="price" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d6b64" stopOpacity={.3}/><stop offset="95%" stopColor="#0d6b64" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11}/><YAxis hide domain={["dataMin - 100000", "dataMax + 100000"]}/><Tooltip formatter={(value) => money(Number(value))}/><Area type="monotone" dataKey="price" stroke="#0d6b64" strokeWidth={3} fill="url(#price)"/></AreaChart></ResponsiveContainer></div>;
}
