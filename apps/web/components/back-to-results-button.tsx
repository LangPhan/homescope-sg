"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackToResultsButton() {
  const router = useRouter();
  function goBack() {
    const cameFromSearch = sessionStorage.getItem("homescope:navigated-from-search") === "true";
    const returnUrl = sessionStorage.getItem("homescope:return-to-search") || "/search";
    sessionStorage.removeItem("homescope:navigated-from-search");
    if (cameFromSearch && window.history.length > 1) router.back();
    else router.push(returnUrl);
  }
  return <button type="button" className="back-to-results" onClick={goBack} aria-label="Back to search results"><ArrowLeft size={16}/> Back</button>;
}
