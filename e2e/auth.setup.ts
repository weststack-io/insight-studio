import { test as setup, expect } from "@playwright/test";

setup("authenticate as advisor", async ({ page }) => {
  await page.goto("/login");

  // Fill the E2E credentials form
  await page.getByTestId("e2e-email-input").fill("e2e-advisor@test.local");
  await page.getByTestId("e2e-login-button").click();

  // Wait for redirect to dashboard
  await page.waitForURL("/dashboard", { timeout: 15000 });
  await expect(page.locator("body")).toBeVisible();

  // Save signed-in state for reuse across tests
  await page.context().storageState({ path: ".playwright/advisor-auth.json" });
});
