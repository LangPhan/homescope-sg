import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./safe-json-ld";

describe("serializeJsonLd", () => {
  it("escapes HTML script terminators while preserving JSON data", () => {
    const value = {
      name: '</script><script data-test="injected">alert(1)</script>',
      address: "1 < 2 & 3 > 2",
    };

    const serialized = serializeJsonLd(value);

    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain("</script");
    expect(JSON.parse(serialized)).toEqual(value);
  });

  it("rejects values that JSON cannot serialize", () => {
    expect(() => serializeJsonLd(undefined)).toThrow(TypeError);
  });
});
