import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for Trade Rise FX UI checks.
 *
 * The dev server must be running on PLAYWRIGHT_BASE_URL (defaults to
 * http://localhost:8080). Admin tests require an authenticated session;
 * provide TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD env vars, or pre-seed
 * an auth storageState at tests/.auth/admin.json.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile-iphone-se",
      use: { ...devices["iPhone SE"] },
    },
    {
      name: "mobile-iphone-12",
      use: { ...devices["iPhone 12"] },
    },
    {
      name: "mobile-pixel-5",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-galaxy-s9",
      use: { ...devices["Galaxy S9+"] },
    },
    {
      name: "tablet-ipad-pro-11",
      use: { ...devices["iPad Pro 11"] },
    },
  ],
});
