export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", service: "homescope-web", time: new Date().toISOString() });
}
