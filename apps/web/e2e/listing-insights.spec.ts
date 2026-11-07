import { expect, test } from "@playwright/test";

const LISTING_URL = "/listings/for-sale-476b-upper-serangoon-view-1044431";

test("renders an interactive map, transaction table, and price chart", async ({ page }) => {
  await page.goto(LISTING_URL);

  const map = page.getByTitle("Map showing 476B Upp Serangoon View");
  await expect(map).toBeVisible();
  await expect(map).toHaveAttribute("src", /openstreetmap\.org\/export\/embed\.html/);

  const table = page.getByRole("table");
  await expect(table.getByRole("row")).toHaveCount(7);
  await page.getByRole("button", { name: "Show all 12" }).click();
  await expect(table.getByRole("row")).toHaveCount(13);

  await expect(page.locator('svg[aria-label="Comparable sale price by registration month"]')).toBeVisible();
  await page.getByRole("button", { name: "PSF" }).click();
  await expect(page.locator('svg[aria-label="Comparable price per square foot by registration month"]')).toBeVisible();
});
