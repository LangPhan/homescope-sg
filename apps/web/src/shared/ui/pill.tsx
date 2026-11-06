import { Badge } from "./badge";
import { cn } from "@/shared/lib";

export function Pill({ className, ...props }: React.ComponentProps<"span">) {
  return <Badge variant="outline" className={cn("h-auto rounded-full bg-white/90 px-3 py-2 text-[.82rem] font-medium", className)} {...props} />;
}
