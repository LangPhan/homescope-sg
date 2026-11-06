import { test, expect } from "@playwright/test";
test("search to listing detail and back restores results",async({page})=>{
  let listingRequests=0;
  page.on("request",(request)=>{const url=new URL(request.url());if(url.pathname==="/api/v1/listings")listingRequests++;});
  await page.goto("/search");
  await expect(page.getByRole("heading",{name:/homes match/})).toBeVisible();
  const requestsAfterInitialLoad=listingRequests;
  expect(requestsAfterInitialLoad).toBeGreaterThan(0);
  const results=page.locator(".results-panel");
  const savedScroll=await results.evaluate((element)=>{
    if(getComputedStyle(element).overflowY==="visible"){window.scrollTo(0,900);return window.scrollY;}
    element.scrollTop=900;return element.scrollTop;
  });
  const card=page.locator(".listing-card").nth(6);
  const detailUrl=await card.getAttribute("href");
  if(!detailUrl)throw new Error("Listing card is missing its detail URL");
  await Promise.all([page.waitForURL(`**${detailUrl}`),card.click()]);
  await expect(page.getByRole("button",{name:"Request a viewing"})).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  await page.getByRole("button",{name:"Back to search results"}).click();
  await expect(page).toHaveURL(/\/search$/);
  await expect.poll(()=>results.evaluate((element)=>getComputedStyle(element).overflowY==="visible"?window.scrollY:element.scrollTop)).toBeGreaterThanOrEqual(savedScroll);
  expect(listingRequests).toBe(requestsAfterInitialLoad);
});
test("demo credentials populate secure sign-in",async({page})=>{await page.goto("/auth");await page.getByRole("button",{name:"Use demo credentials"}).click();await expect(page.getByLabel("Email")).toHaveValue("demo@homescope.sg");await expect(page.getByLabel("Password")).toHaveValue("DemoPass123!");});
