type LogLevel = "info" | "warn" | "error";

const sensitiveKeys = new Set([
  "authorization", "cookie", "token", "accesstoken", "refreshtoken", "bearertoken",
  "secret", "apikey", "prompt", "chatcontent", "content", "email", "userid", "ip",
]);

export function sanitizeLogFields(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => {
    if (sensitiveKeys.has(key.replace(/[^a-z0-9]/gi, "").toLowerCase())) return [key, "[REDACTED]"];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return [key, sanitizeLogFields(value as Record<string, unknown>)];
    }
    return [key, value];
  }));
}

export function logEvent(level: LogLevel, event: string, fields: Record<string, unknown> = {}): void {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: "web",
    environment: process.env.APP_ENV || "local",
    event,
    ...sanitizeLogFields(fields),
  });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.info(entry);
}

export function requestIdFrom(request: Request): string {
  const candidate = request.headers.get("x-request-id") || "";
  return /^[A-Za-z0-9._-]{8,64}$/.test(candidate) ? candidate : crypto.randomUUID();
}
