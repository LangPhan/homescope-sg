"use client";

import Link from "next/link";
import { Bot, Building2, CircleStop, LockKeyhole, MessageCircle, RefreshCw, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchServerSentEvents, sessionStoragePersistence, useChat, type UIMessage } from "@tanstack/ai-react";
import { z } from "zod";
import { money } from "@/shared/api";
import { useAuthSession, type AuthUser } from "@/shared/auth";
import { Button } from "@/shared/ui";

const listingSchema = z.object({
  slug: z.string(),
  title: z.string(),
  address: z.string(),
  district: z.string(),
  property_type: z.string(),
  tenure: z.string(),
  price: z.number(),
  psf: z.number(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  floor_area: z.number(),
  mrt_name: z.string(),
  mrt_distance: z.number(),
  image_url: z.string(),
  href: z.string().regex(/^\/listings\/[a-z0-9-]+$/),
});

const toolOutputSchema = z.union([
  z.object({ listings: z.array(listingSchema).max(8), synthetic: z.literal(true) }),
  z.object({ listing: listingSchema.extend({ description: z.string(), amenities: z.array(z.string()) }), synthetic: z.literal(true) }),
]);

const suggestions = [
  "Find a 2-bedroom condo under S$1.8M near an MRT",
  "Compare family homes in D15 and D18",
  "How does HomeScope work?",
];

function currentPageContext() {
  if (typeof window === "undefined") return { pathname: "/", filters: {} };
  const allowed = new Set(["q", "property_type", "min_price", "max_price", "bedrooms", "district", "tenure", "sort"]);
  const filters: Record<string, string> = {};
  const url = new URL(window.location.href);
  url.searchParams.forEach((value, key) => {
    if (allowed.has(key) && key.length <= 40 && value.length <= 120) filters[key] = value;
  });
  return { pathname: url.pathname.slice(0, 160), filters };
}

function safeToolListings(part: UIMessage["parts"][number]) {
  if (part.type !== "tool-call" || part.state !== "complete" || part.output === undefined) return [];
  const parsed = toolOutputSchema.safeParse(part.output);
  if (!parsed.success) return [];
  return "listings" in parsed.data ? parsed.data.listings : [parsed.data.listing];
}

function AdvisorListingCards({ listings }: { listings: z.infer<typeof listingSchema>[] }) {
  if (!listings.length) return null;
  return <div className="mt-2 grid gap-2">{listings.map((listing) => <Link key={listing.slug} href={listing.href} className="group flex gap-3 rounded-xl border border-line bg-white p-2.5 shadow-sm transition hover:border-teal/50 hover:shadow-md"><img src={listing.image_url} alt="" className="h-[72px] w-[88px] rounded-lg bg-cream object-cover"/><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold group-hover:text-teal">{listing.title}</div><div className="mt-0.5 truncate text-[11px] text-muted-copy">{listing.property_type} · {listing.bedrooms} bed · {listing.mrt_name}</div><div className="mt-2 text-sm font-extrabold text-teal">{money(listing.price)}</div></div></Link>)}</div>;
}

export function AdvisorMessage({ message }: { message: UIMessage }) {
  const text = message.parts.filter((part) => part.type === "text").map((part) => part.content).join("");
  const toolCalls = message.parts.filter((part) => part.type === "tool-call");
  const toolIsRunning = toolCalls.some((part) => part.state !== "complete" && part.state !== "error");
  const listings = [...new Map(message.parts.flatMap(safeToolListings).map((listing) => [listing.slug, listing])).values()].slice(0, 5);
  if (!text && !toolIsRunning && !listings.length) return null;
  const user = message.role === "user";
  return <div className={user ? "ml-10" : "mr-4"}>{(text || toolIsRunning) && <div className={user ? "rounded-2xl rounded-br-md bg-teal px-3.5 py-2.5 text-sm leading-6 text-white" : "rounded-2xl rounded-bl-md border border-line bg-white px-3.5 py-2.5 text-sm leading-6 whitespace-pre-wrap text-ink"}>{text || <span className="inline-flex items-center gap-2 text-muted-copy"><Sparkles size={14}/>Searching HomeScope listings…</span>}</div>}{!user && <AdvisorListingCards listings={listings}/>}</div>;
}

function LockedPanel({ close }: { close: () => void }) {
  return <div className="fixed right-4 bottom-[86px] z-[70] w-[min(400px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_28px_90px_rgba(16,42,46,.24)]"><div className="flex items-center justify-between border-b border-line bg-teal px-5 py-4 text-white"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-white/15"><LockKeyhole size={18}/></span><div><div className="font-bold">HomeScope AI</div><div className="text-xs text-white/75">Property advisor</div></div></div><button onClick={close} aria-label="Close AI advisor" className="rounded-lg p-2 hover:bg-white/10"><X size={18}/></button></div><div className="p-6"><h2 className="font-serif text-2xl font-semibold">Find a better-fit home, faster.</h2><p className="mt-3 text-sm leading-6 text-muted-copy">Sign in to ask about budget, MRT access, bedrooms, compare synthetic listings, and get links to matching HomeScope homes.</p><Link href="/auth" className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal font-bold text-white hover:bg-teal-dark"><LockKeyhole size={16}/>Sign in to chat</Link><p className="mt-3 text-center text-[11px] text-muted-copy">AI answers are limited to HomeScope property topics.</p></div></div>;
}

function AuthenticatedAdvisor({ user, close }: { user: AuthUser; close: () => void }) {
  const { authenticatedFetch } = useAuthSession();
  const [input, setInput] = useState("");
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadId = `homescope-advisor:${user.email.toLowerCase()}`;
  const persistence = useMemo(() => sessionStoragePersistence({ keyPrefix: `homescope-ai:${user.email.toLowerCase()}:` }), [user.email]);
  const connection = useMemo(() => fetchServerSentEvents("/api/ai/chat", () => ({
    fetchClient: async (request, init) => {
      const response = await authenticatedFetch(request, init);
      setHttpStatus(response.ok ? null : response.status);
      return response;
    },
    body: { pageContext: currentPageContext() },
    reconnect: { maxAttempts: 0 },
  })), [authenticatedFetch]);
  const { messages, sendMessage, isLoading, error, stop, reload, clear, isHydrating } = useChat({
    connection,
    threadId,
    persistence,
    queue: "drop",
  });

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, isLoading]);
  useEffect(() => {
    const logout = () => { stop(); clear(); };
    window.addEventListener("homescope:logout", logout);
    return () => window.removeEventListener("homescope:logout", logout);
  }, [clear, stop]);

  async function submit(value = input) {
    const message = value.trim();
    if (!message || isLoading) return;
    setInput("");
    setHttpStatus(null);
    await sendMessage(message);
  }

  const errorMessage = httpStatus === 429
    ? "You’ve reached the AI quota. Please try again later."
    : httpStatus === 503
      ? "The advisor is temporarily unavailable. Your chat is still here."
      : httpStatus === 401
        ? "Your session expired. Please sign in again."
        : error?.message;

  return <section role="dialog" aria-modal="true" aria-label="HomeScope AI property advisor" className="fixed inset-0 z-[70] flex flex-col bg-paper sm:inset-auto sm:right-4 sm:bottom-[86px] sm:h-[min(690px,calc(100vh-110px))] sm:w-[400px] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-line sm:shadow-[0_28px_90px_rgba(16,42,46,.24)]"><header className="flex shrink-0 items-center justify-between bg-teal px-4 py-3.5 text-white"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white/15"><Bot size={20}/></span><div><div className="flex items-center gap-2 font-bold">HomeScope AI <span className="size-1.5 rounded-full bg-[#7ef0bf]"/></div><div className="text-xs text-white/75">Hi {user.name} · Property topics only</div></div></div><div className="flex items-center gap-1"><button onClick={clear} aria-label="Reset conversation" title="Reset conversation" className="rounded-lg p-2 hover:bg-white/10"><RotateCcw size={17}/></button><button onClick={close} aria-label="Close AI advisor" className="rounded-lg p-2 hover:bg-white/10"><X size={19}/></button></div></header><div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-[#f7f5ee] px-4 py-4"><div className="mb-4 rounded-xl border border-teal/15 bg-[#edf8f5] p-3 text-xs leading-5 text-teal-dark"><strong>Synthetic data only.</strong> I can search and compare HomeScope listings, but I don’t provide legal or financial advice.</div>{isHydrating ? <div className="space-y-3" aria-label="Restoring chat"><div className="h-16 w-4/5 animate-pulse rounded-2xl bg-white"/><div className="ml-auto h-12 w-2/3 animate-pulse rounded-2xl bg-teal/15"/></div> : messages.length ? <div className="space-y-3">{messages.map((message) => <AdvisorMessage key={message.id} message={message}/>)}</div> : <div><div className="py-5 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-teal shadow-sm"><Building2 size={22}/></span><h2 className="mt-3 font-serif text-xl font-semibold">What kind of home fits?</h2><p className="mt-1 text-xs leading-5 text-muted-copy">Share a budget, MRT or district, bedrooms and property type.</p></div><div className="grid gap-2">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => void submit(suggestion)} className="rounded-xl border border-line bg-white px-3 py-2.5 text-left text-xs font-semibold leading-5 transition hover:border-teal/40 hover:text-teal">{suggestion}</button>)}</div></div>}{isLoading && <div className="mt-3 mr-4 rounded-2xl rounded-bl-md border border-line bg-white px-3.5 py-3 text-sm text-muted-copy"><span className="inline-flex items-center gap-2"><Sparkles className="animate-pulse" size={14}/>Thinking with HomeScope data…</span></div>}{errorMessage && <div role="alert" className="mt-3 rounded-xl border border-coral/25 bg-[#fff1ed] p-3 text-xs leading-5 text-[#8b3e2c]"><div>{errorMessage}</div><button onClick={() => void reload()} className="mt-2 inline-flex items-center gap-1.5 font-bold underline underline-offset-2"><RefreshCw size={13}/>Retry last message</button></div>}</div><form className="shrink-0 border-t border-line bg-paper p-3" onSubmit={(event) => { event.preventDefault(); void submit(); }}><div className="flex items-end gap-2 rounded-2xl border border-line bg-white p-2 focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/10"><textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value.slice(0, 2000))} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }} placeholder="Ask about a HomeScope property…" rows={1} className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-copy" aria-label="Message HomeScope AI"/>{isLoading ? <Button type="button" size="icon" variant="outline" onClick={stop} aria-label="Stop response" className="size-10 rounded-xl"><CircleStop size={17}/></Button> : <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send message" className="size-10 rounded-xl"><Send size={17}/></Button>}</div><div className="mt-1.5 flex justify-between px-1 text-[10px] text-muted-copy"><span>Enter to send · Shift+Enter for newline</span><span>{input.length}/2000</span></div></form></section>;
}

export function AiAdvisor() {
  const { user, ready } = useAuthSession();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return <>{open && (user ? <AuthenticatedAdvisor user={user} close={() => setOpen(false)}/> : <LockedPanel close={() => setOpen(false)}/>)}<button onClick={() => setOpen((value) => !value)} aria-label={open ? "Close HomeScope AI" : user ? "Open HomeScope AI" : "Sign in to use HomeScope AI"} aria-expanded={open} className={`fixed right-4 bottom-4 z-[69] flex h-14 items-center gap-2 rounded-full px-4 font-bold text-white shadow-[0_14px_40px_rgba(16,42,46,.28)] transition hover:-translate-y-0.5 ${open ? "pointer-events-none scale-90 opacity-0" : "bg-teal hover:bg-teal-dark"}`}><MessageCircle size={20}/><span className="hidden sm:inline">Ask HomeScope AI</span>{ready && !user && <LockKeyhole size={14}/>}</button></>;
}
