import { test, expect } from "@playwright/test";

test("home ES renders all sections", async ({ page }) => {
  await page.goto("/es");
  for (const id of ["services", "about", "projects", "experience", "certs", "skills", "contact"]) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
});

test("lang switch goes EN→ES via URL", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: "ES", exact: true }).click();
  await expect(page).toHaveURL(/\/es(\/|$)/);
});

test("health endpoint returns 200", async ({ request }) => {
  const r = await request.get("/api/health");
  expect(r.status()).toBe(200);
  const body = await r.json();
  expect(body.status).toBe("ok");
});
