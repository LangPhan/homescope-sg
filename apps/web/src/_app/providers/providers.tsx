"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthSessionProvider } from "@/shared/auth";

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return createQueryClient();
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const client = getQueryClient();
  return <QueryClientProvider client={client}><AuthSessionProvider>{children}</AuthSessionProvider></QueryClientProvider>;
}
