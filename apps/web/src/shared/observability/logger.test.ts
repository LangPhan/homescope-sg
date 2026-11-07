import { describe, expect, it, vi } from "vitest";
import { logEvent, requestIdFrom, sanitizeLogFields } from "./logger";

describe("structured logger", () => {
  it("redacts secrets and personal identifiers recursively", () => {
    expect(sanitizeLogFields({ token: "secret", nested: { email: "person@example.com" }, status: 200 })).toEqual({
      token: "[REDACTED]",
      nested: { email: "[REDACTED]" },
      status: 200,
    });
  });

  it("emits JSON without logging sensitive values", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    logEvent("info", "test_event", { authorization: "Bearer private", status: 204 });
    const output = JSON.parse(String(spy.mock.calls[0][0]));
    expect(output).toMatchObject({ level: "info", service: "web", event: "test_event", status: 204 });
    expect(output.authorization).toBe("[REDACTED]");
    expect(String(spy.mock.calls[0][0])).not.toContain("private");
  });

  it("accepts bounded request IDs and replaces invalid values", () => {
    expect(requestIdFrom(new Request("http://localhost", { headers: { "x-request-id": "trace-12345678" } }))).toBe("trace-12345678");
    expect(requestIdFrom(new Request("http://localhost", { headers: { "x-request-id": "bad value" } }))).toMatch(/^[0-9a-f-]{36}$/);
  });
});
