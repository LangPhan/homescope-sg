export const dynamic = "force-dynamic";

export function GET() {
  if (process.env.VERCEL) return new Response(null, { status: 404 });
  return Response.json({ status: "ok", service: "homescope-web", time: new Date().toISOString() });
}
