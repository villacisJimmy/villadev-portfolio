import { test, expect } from "@playwright/test";

test.describe("contact form", () => {
  test("blocks bot via honeypot", async ({ page }) => {
    await page.goto("/es#contact");
    // honeypot input has style left:-9999px (offscreen). Use locator with name attr.
    await page.locator("[name=hp]").fill("bot");
    await page.fill("[name=name]", "Jimmy");
    await page.fill("[name=email]", "test@example.com");
    await page.fill(
      "[name=message]",
      "Hola, este es un mensaje suficientemente largo para pasar Zod.",
    );
    await page.getByRole("button", { name: /enviar/i }).click();
    await expect(page.locator("form [role=alert]")).toBeVisible();
  });

  test("rejects invalid email", async ({ page }) => {
    await page.goto("/es#contact");
    await page.fill("[name=name]", "Jimmy");
    await page.fill("[name=email]", "no-es-correo");
    await page.fill("[name=message]", "Hola, este es un mensaje suficientemente largo.");
    await page.getByRole("button", { name: /enviar/i }).click();
    const html5 = await page.locator("[name=email]:invalid").count();
    if (html5 === 0) await expect(page.locator("form [role=alert]")).toBeVisible();
  });
});
