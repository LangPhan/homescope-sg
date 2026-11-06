import { describe, expect, it } from "vitest";
import { listingSlugSchema, searchListingsInputSchema } from "./tools";

describe("AI advisor tool boundaries", () => {
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
