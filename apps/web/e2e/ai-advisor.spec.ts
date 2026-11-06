import { expect, test } from "@playwright/test";

function assistantSse(text: string) {
  const runId = "mock-run";
  const threadId = "homescope-advisor:demo@homescope.sg";
  const messageId = "mock-message";
  const events = [
    { type: "RUN_STARTED", runId, threadId, timestamp: Date.now() },
    { type: "TEXT_MESSAGE_START", messageId, role: "assistant", timestamp: Date.now() },
    { type: "TEXT_MESSAGE_CONTENT", messageId, delta: text, timestamp: Date.now() },
    { type: "TEXT_MESSAGE_END", messageId, timestamp: Date.now() },
    { type: "RUN_FINISHED", runId, threadId, finishReason: "stop", timestamp: Date.now() },
  ];
  return events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("");
}

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/auth");
  await page.getByRole("button", { name: "Use demo credentials" }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
}

test("guest cannot call the AI route directly", async ({ request }) => {
  const response = await request.post("/api/ai/chat", { data: {} });
  expect(response.status()).toBe(401);
});

test("authenticated chat streams and survives page navigation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop navigation is hidden on mobile");
  await page.route("**/api/ai/chat", async (route) => {
    await route.fulfill({ status: 200, contentType: "text/event-stream", headers: { "Cache-Control": "no-cache" }, body: assistantSse("I found matching synthetic HomeScope homes near an MRT.") });
  });
  await signIn(page);
  await page.getByRole("button", { name: "Open HomeScope AI" }).click();
  await page.getByLabel("Message HomeScope AI").fill("Find a 2 bedroom condo near MRT");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText(/matching synthetic HomeScope homes/)).toBeVisible();
  await page.getByRole("link", { name: "Explore homes" }).click();
  await expect(page).toHaveURL(/\/search/);
  await page.getByRole("link", { name: "Engineering" }).click();
  await expect(page).toHaveURL(/\/engineering/);
  await expect(page.getByText("Find a 2 bedroom condo near MRT")).toBeVisible();
  await expect(page.getByText(/matching synthetic HomeScope homes/)).toBeVisible();
});
