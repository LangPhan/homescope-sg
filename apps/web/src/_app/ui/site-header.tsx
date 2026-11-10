"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, LogOut, Menu, X } from "lucide-react";
import { useAuthSession } from "@/shared/auth";
import { Button } from "@/shared/ui";

export function SiteHeader() {
  const { user, ready, signOut } = useAuthSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeMenu = () => setMenuOpen(false);

  async function logout() {
    closeMenu();
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header
        className="site-header sticky top-0 z-40 flex h-[72px] items-center border-b border-ink/8 bg-paper/90 backdrop-blur-[14px]"
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            closeMenu();
            menuButton.current?.focus();
          }
        }}
      >
        <div className="mx-auto flex w-[min(1200px,calc(100%-40px))] items-center justify-between">
          <Link href="/" onNavigate={closeMenu} className="flex items-center gap-2.5 font-extrabold" aria-label="HomeScope SG home">
            <span className="grid size-[35px] -rotate-2 place-items-center rounded-[10px_10px_4px_10px] bg-teal text-white">
              <Building2 size={19} />
            </span>
            <span>HomeScope <span className="text-coral">SG</span></span>
          </Link>
          <Button
            ref={menuButton}
            type="button"
            variant="outline"
            size="icon"
            className="min-[901px]:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-controls="main-navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </Button>
          <nav
            id="main-navigation"
            aria-label="Main navigation"
            className={`${menuOpen ? "flex" : "hidden"} gap-7 text-[.9rem] font-semibold min-[901px]:flex min-[901px]:items-center max-[901px]:absolute max-[901px]:inset-x-0 max-[901px]:top-full max-[901px]:flex-col max-[901px]:items-start max-[901px]:gap-4 max-[901px]:border-b max-[901px]:border-line max-[901px]:bg-paper max-[901px]:p-5 max-[901px]:shadow-lg`}
          >
            <Link href="/search" onNavigate={closeMenu}>Explore homes</Link>
            <Link href="/engineering" onNavigate={closeMenu}>Engineering</Link>
            <Link href="/account" onNavigate={closeMenu}>Saved homes</Link>
            {!ready ? (
              <span className="h-10 w-[92px] rounded-[10px] bg-[#e8ece8]" aria-hidden="true" />
            ) : user ? (
              <div className="flex items-center gap-2.5 pl-1">
                <Link href="/account" onNavigate={closeMenu} className="max-w-[190px] truncate">Hello, <strong>{user.name}</strong></Link>
                <Button variant="outline" size="sm" className="h-10 gap-1.5 rounded-[10px] border-line px-3 font-bold hover:border-teal hover:bg-white hover:text-teal" onClick={logout} aria-label={`Sign out ${user.name}`}>
                  <LogOut size={16} /> Log out
                </Button>
              </div>
            ) : (
              <Link href="/auth" onNavigate={closeMenu} className="inline-flex h-10 items-center rounded-[10px] bg-teal px-[18px] font-bold text-white shadow-[0_8px_18px_rgba(13,107,100,.2)] hover:bg-teal-dark">Sign in</Link>
            )}
          </nav>
        </div>
      </header>
      <div className="border-t border-[#f0d8c8] bg-[#fff3e9] px-5 py-[13px] text-center text-[.76rem] text-[#75452f]">
        Independent portfolio case study · PropNex listing snapshot · <Link href="/resale" className="font-bold underline">HDB resale transactions</Link> · Not affiliated with or endorsed by PropNex Limited
      </div>
    </>
  );
}
