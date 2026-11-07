import { type ReactNode } from "react";
import { Eyebrow } from "@/shared/ui";

export function InsightSection({ eyebrow, title, description, aside, children }: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_14px_40px_rgba(16,42,46,.055)]">
      <header className="flex items-start justify-between gap-5 border-b border-line px-5 py-5 sm:px-7">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-1 font-serif text-[clamp(1.75rem,3vw,2.25rem)] tracking-[-.035em]">{title}</h2>
          <p className="mt-1 max-w-[60ch] text-sm leading-6 text-muted-copy">{description}</p>
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}
