import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthSessionProvider, useAuthSession } from "@/shared/auth";
import { AiAdvisor } from "./ai-advisor";
import { sessionStoragePersistence } from "@tanstack/ai-react";

function tokenFor(name: string, email: string) {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" })).replaceAll("=", "");
  const payload = btoa(JSON.stringify({ name, email, exp: Math.floor(Date.now() / 1000) + 3600 })).replaceAll("=", "");
  return `${header}.${payload}.demo`;
}

function LogoutButton() {
  const { signOut } = useAuthSession();
  return <button onClick={() => void signOut()}>Test logout</button>;
}

function renderAdvisor(withLogout = false) {
  return render(<AuthSessionProvider><AiAdvisor />{withLogout && <LogoutButton />}</AuthSessionProvider>);
}

describe("AiAdvisor", () => {
  afterEach(cleanup);
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: vi.fn() });
  });

  it("shows a locked experience and sign-in CTA for guests", async () => {
    renderAdvisor();
    const launcher = await screen.findByRole("button", { name: "Sign in to use HomeScope AI" });
    fireEvent.click(launcher);
    expect(screen.getByRole("link", { name: "Sign in to chat" })).toHaveAttribute("href", "/auth");
    expect(screen.getByText(/limited to HomeScope property topics/i)).toBeInTheDocument();
  });

  it("opens the authenticated drawer with property suggestions", async () => {
    localStorage.setItem("access_token", tokenFor("Demo Explorer", "demo@homescope.sg"));
    localStorage.setItem("homescope:auth-user", JSON.stringify({ name: "Demo Explorer", email: "demo@homescope.sg" }));
    renderAdvisor();
    fireEvent.click(await screen.findByRole("button", { name: "Open HomeScope AI" }));
    expect(screen.getByRole("dialog", { name: "HomeScope AI property advisor" })).toBeInTheDocument();
    expect(screen.getByText(/Hi Demo Explorer/)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /condo 2 phòng ngủ/i }, { timeout: 3_000 })).toBeInTheDocument();
  });

  it("stores history per user session and clears it on logout", async () => {
    const email = "demo@homescope.sg";
    localStorage.setItem("access_token", tokenFor("Demo Explorer", email));
    localStorage.setItem("homescope:auth-user", JSON.stringify({ name: "Demo Explorer", email }));
    const key = `homescope-ai:${email}:homescope-advisor:${email}`;
    const adapter = sessionStoragePersistence({ keyPrefix: `homescope-ai:${email}:` });
    adapter.setItem(`homescope-advisor:${email}`, { messages: [{ id: "saved-user-message", role: "user", parts: [{ type: "text", content: "2 bedroom near MRT" }], createdAt: new Date() }] });
    expect(adapter.getItem(`homescope-advisor:${email}`)).toMatchObject({ messages: [{ id: "saved-user-message" }] });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    renderAdvisor(true);
    fireEvent.click(await screen.findByRole("button", { name: "Open HomeScope AI" }));
    fireEvent.click(screen.getByRole("button", { name: "Test logout" }));
    await waitFor(() => expect(sessionStorage.getItem(key)).toBeNull());
  });
});
