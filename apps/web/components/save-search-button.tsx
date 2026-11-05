"use client";
import { BellPlus } from "lucide-react";
import { useState } from "react";
import { SearchFilters } from "@/lib/types";

export function SaveSearchButton({ filters }: { filters: SearchFilters }) {
  const [label,setLabel]=useState("Save search");
  async function save(){const token=localStorage.getItem("access_token");if(!token){setLabel("Sign in first");return;}setLabel("Saving…");try{const response=await fetch(`${process.env.NEXT_PUBLIC_API_URL||"/api/v1"}/me/saved-searches`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({name:filters.q?`Homes near ${filters.q}`:"My property search",filters})});if(!response.ok)throw new Error();setLabel("Search saved");}catch{setLabel("Could not save");}}
  return <button className="pill" onClick={save}><BellPlus size={14}/>{label}</button>;
}
