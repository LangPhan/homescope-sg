import { cn } from "@/shared/lib";

export function Eyebrow({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-xs font-extrabold tracking-[.15em] text-teal uppercase", className)} {...props} />;
}
