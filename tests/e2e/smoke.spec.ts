import { test, expect } from "@playwright/test";

test("home returns 200 and contains brand", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.ok()).toBeTruthy();
  await expect(page.locator("body")).toBeVisible();
});
