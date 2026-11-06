"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL, type Listing } from "@/shared/api";
import { useAuthSession } from "@/shared/auth";
import { cn } from "@/shared/lib";
import { Button, buttonVariants } from "@/shared/ui";
import { useSavedHomes } from "./use-saved-homes";

export function SaveHomeButton({ listing, compact = false }: { listing: Listing; compact?: boolean }) {
  const { user, ready, authenticatedFetch } = useAuthSession();
  const queryClient = useQueryClient();
  const homes = useSavedHomes();
  const queryKey = ["saved-homes", user?.email];
  const mutationKey = [...queryKey, listing.id];
  const pending = useIsMutating({ mutationKey, exact: true }) > 0;
  const saved = homes.data?.some((home) => Number(home.id) === Number(listing.id)) ?? false;
  const mutation = useMutation({
    mutationKey,
    mutationFn: async (remove: boolean) => {
      const response = await authenticatedFetch(`${API_URL}/me/favourites/${listing.id}`, {
        method: remove ? "DELETE" : "POST",
      });
      if (!response.ok) throw new Error("Could not update saved homes. Try again.");
    },
    onSuccess: async (_, remove) => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<Listing[]>(queryKey, (previous = []) => {
        const others = previous.filter((home) => Number(home.id) !== Number(listing.id));
        return remove ? others : [listing, ...others];
      });
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const className = compact
    ? "absolute top-3.5 right-3.5 size-[38px] rounded-full bg-white/95"
    : "mt-2.5 h-[46px] w-full rounded-[10px] border-line bg-white font-bold";
  const heart = (
    <Heart
      key={saved && mutation.isSuccess ? "just-saved" : "heart"}
      aria-hidden="true"
      className={cn(saved && "fill-coral text-coral", saved && mutation.isSuccess && "motion-safe:animate-[save-heart-pop_420ms_ease-out]")}
    />
  );

  if (ready && !user) {
    return (
      <Link href={`/auth?returnTo=${encodeURIComponent(`/listings/${listing.slug}`)}`} aria-label={compact ? "Sign in to save home" : undefined} className={cn(buttonVariants({ variant: "outline" }), className)}>
        {heart}
        {!compact && "Save this home"}
      </Link>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={className}
        aria-label={compact ? (saved ? "Remove from saved homes" : "Save home") : undefined}
        aria-pressed={saved}
        disabled={!ready || homes.isPending || pending}
        onClick={() => mutation.mutate(saved)}
      >
        {heart}
        {!compact && (saved ? "Saved to your homes" : "Save this home")}
      </Button>
      <span role="status" className={cn("text-xs text-muted-copy", mutation.isError ? (compact ? "absolute top-15 right-3.5 rounded-md bg-white px-2 py-1" : "mt-2 block") : "sr-only")}>
        {mutation.isError ? mutation.error.message : mutation.isSuccess ? (saved ? "Home saved" : "Home removed") : ""}
      </span>
    </>
  );
}
