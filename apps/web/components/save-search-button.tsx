"use client";
import { BellPlus } from "lucide-react";
import { useState } from "react";
import { SearchFilters } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function SaveSearchButton({ filters }: { filters: SearchFilters }) {
  const [label,setLabel]=useState("Save search");
  async function save(){const token=localStorage.getItem("access_token");if(!token){setLabel("Sign in first");return;}setLabel("Saving…");try{const response=await fetch(`${process.env.NEXT_PUBLIC_API_URL||"/api/v1"}/me/saved-searches`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({name:filters.q?`Homes near ${filters.q}`:"My property search",filters})});if(!response.ok)throw new Error();setLabel("Search saved");}catch{setLabel("Could not save");}}
  return <Button variant="outline" size="sm" className="h-auto rounded-full border-line bg-white/90 px-3 py-2 text-[.82rem] font-medium" onClick={save}><BellPlus size={14}/>{label}</Button>;
}
