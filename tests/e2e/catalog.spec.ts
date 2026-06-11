import { test, expect } from "@playwright/test";

test("catalog filters by category via query param", async ({ page }) => {
  await page.goto("/es/proyectos");
  await expect(page.locator("[data-cat]")).toHaveCount(3);

  await page.getByRole("button", { name: "Automatización" }).click();
  await expect(page).toHaveURL(/cat=auto/);
  await expect(page.locator("[data-cat]")).toHaveCount(1);

  await page.getByRole("button", { name: "Todos" }).click();
  // After clicking "Todos", URL should drop the query string
  await expect(page).toHaveURL(/\/proyectos$/);
  await expect(page.locator("[data-cat]")).toHaveCount(3);
});
