import { metricsText } from "@/shared/observability/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.VERCEL) return new Response(null, { status: 404 });
  return new Response(await metricsText(), {
    headers: { "Content-Type": "text/plain; version=0.0.4; charset=utf-8", "Cache-Control": "no-store" },
  });
}
