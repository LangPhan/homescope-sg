import { describe, expect, it, vi } from "vitest";
import { createAdvisorTools, listingSlugSchema, searchListingsInputSchema } from "./tools";

describe("AI advisor tool boundaries", () => {
  it("looks up Domain of the Istana by coordinates and preserves the search filters", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
      data: [{ slug: "helios-residences", title: "Helios Residences", distance_m: 698 }],
    }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      const tool = createAdvisorTools("test")[3];
      const result = await tool.execute!({ place: "Domain of the Istana", bedrooms: 2 });
      const url = new URL(String(fetchMock.mock.calls[0][0]));
      expect(url.searchParams.get("near")).toBe("1.304729,103.843807");
      expect(url.searchParams.get("bedrooms")).toBe("2");
      expect(result).toMatchObject({
        status: "ok", distance_method: "straight_line",
        listings: [{ title: "Helios Residences", distance_m: 698, mrt_distance: null }],
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("accepts supported read-only listing filters", () => {
    const result = searchListingsInputSchema.parse({
      keyword: "Tiong Bahru",
      property_type: "Condo",
      max_price: 1_800_000,
      bedrooms: 2,
      district: "D03",
      limit: 5,
    });
    expect(result.limit).toBe(5);
  });

  it.each([
    { limit: 9 },
    { min_price: 2_000_000, max_price: 1_000_000 },
    { district: "D99" },
    { property_type: "Office" },
    { url: "https://attacker.example/steal" },
  ])("rejects unsupported or unsafe arguments: %j", (input) => {
    expect(searchListingsInputSchema.safeParse(input).success).toBe(false);
  });

  it.each(["marina-one-residences", "d03-family-home-2"])("accepts catalogue slug %s", (slug) => {
    expect(listingSlugSchema.safeParse(slug).success).toBe(true);
  });

  it.each(["../admin", "https://example.com/listing", "UPPERCASE", "slug?secret=1", "a".repeat(121)])("rejects URL/path injection slug %s", (slug) => {
    expect(listingSlugSchema.safeParse(slug).success).toBe(false);
  });
});
