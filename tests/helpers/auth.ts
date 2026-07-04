import { Page, expect } from "@playwright/test";

/**
 * Logs into the admin area using the email/password form on /auth.
 * Credentials are read from env: TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD.
 *
 * The account must already have admin role granted in the backend.
 */
export async function loginAsAdmin(page: Page) {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing TEST_ADMIN_EMAIL or TEST_ADMIN_PASSWORD env vars. " +
        "Set them to a Trade Rise FX admin account before running admin tests.",
    );
  }

  await page.goto("/auth");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  await page
    .getByRole("button", { name: /^(sign in|log in)$/i })
    .click();

  // Wait until we're past the auth screen.
  await expect(page).not.toHaveURL(/\/auth/, { timeout: 15_000 });
}
