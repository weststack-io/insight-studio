import { test, expect } from "@playwright/test";

test("dashboard loads for authenticated user", async ({ page }) => {
  await page.goto("/dashboard");
  // Should not redirect to login — storageState has a valid session
  await expect(page).toHaveURL(/dashboard/);
});
