import { test, expect, Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

/**
 * Mobile UI checks for the Trade Rise FX admin panel.
 *
 * Validates:
 *  - Sidebar header shows full "Trade Rise FX" wordmark legibly when opened
 *    on mobile breakpoints (it lives behind a Sheet trigger on mobile).
 *  - Breadcrumb stays on a single line, never overflows the viewport, and
 *    becomes horizontally scrollable when content exceeds available width.
 */

const ADMIN_ROUTES = [
  { path: "/admin", currentPage: "Control Panel" },
  { path: "/admin/trade-results", currentPage: "Trade Results" },
] as const;

test.describe("Admin panel — mobile branding & layout", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const { path, currentPage } of ADMIN_ROUTES) {
    test(`breadcrumb on ${path} is single-line, in-viewport, and scrollable`, async ({
      page,
    }) => {
      await page.goto(path);

      // Breadcrumb root (the scroll container added in AdminBreadcrumb.tsx).
      const breadcrumbList = page.locator("nav[aria-label='breadcrumb'] ol").first();
      await expect(breadcrumbList).toBeVisible();

      // "Trade Rise FX" wordmark in breadcrumb.
      const wordmark = breadcrumbList.locator("a", { hasText: /Trade Rise/i }).first();
      await expect(wordmark).toBeVisible();
      await expect(wordmark).toContainText("Trade Rise");
      await expect(wordmark).toContainText("FX");

      // Current page label should be present (and truncated if too long).
      if (path !== "/admin") {
        await expect(breadcrumbList).toContainText(currentPage);
      }

      // Single-line: list height should be close to one line of text.
      const lineMetrics = await breadcrumbList.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          height: (el as HTMLElement).getBoundingClientRect().height,
          fontSize: parseFloat(style.fontSize),
          flexWrap: style.flexWrap,
          whiteSpace: style.whiteSpace,
        };
      });
      expect(lineMetrics.flexWrap).toBe("nowrap");
      expect(lineMetrics.whiteSpace).toBe("nowrap");
      // Allow some padding, but height should not be ~2 lines tall.
      expect(lineMetrics.height).toBeLessThan(lineMetrics.fontSize * 2.5);

      // Scroll container must never overflow the viewport horizontally.
      const scroller = breadcrumbList.locator("..").first(); // parent div
      const { containerWidth, viewportWidth, scrollWidth, clientWidth, overflowX } =
        await scroller.evaluate((el) => {
          const rect = (el as HTMLElement).getBoundingClientRect();
          return {
            containerWidth: rect.width,
            viewportWidth: window.innerWidth,
            scrollWidth: (el as HTMLElement).scrollWidth,
            clientWidth: (el as HTMLElement).clientWidth,
            overflowX: getComputedStyle(el).overflowX,
          };
        });
      expect(containerWidth).toBeLessThanOrEqual(viewportWidth);
      expect(["auto", "scroll"]).toContain(overflowX);

      // If content overflows, scroller should accommodate via horizontal scroll.
      if (scrollWidth > clientWidth) {
        await scroller.evaluate((el) => {
          (el as HTMLElement).scrollLeft = (el as HTMLElement).scrollWidth;
        });
        const scrollLeft = await scroller.evaluate(
          (el) => (el as HTMLElement).scrollLeft,
        );
        expect(scrollLeft).toBeGreaterThan(0);
      }
    });
  }

  test("sidebar header shows full 'Trade Rise FX' wordmark when opened on mobile", async ({
    page,
  }) => {
    await page.goto("/admin");

    // The sidebar is hidden behind a Sheet trigger on mobile.
    const trigger = page
      .locator(
        "[data-sidebar='trigger'], button[aria-label*='sidebar' i], button[aria-label*='menu' i]",
      )
      .first();
    await expect(trigger).toBeVisible();
    await trigger.click();

    // Sidebar header link contains the wordmark.
    const sidebar = page.locator("[data-sidebar='sidebar']").first();
    await expect(sidebar).toBeVisible();

    const headerLink = sidebar
      .locator("[data-sidebar='header'] a")
      .first();
    await expect(headerLink).toBeVisible();
    await expect(headerLink).toContainText("Trade Rise");
    await expect(headerLink).toContainText("FX");

    // Header text must not be clipped or zero-width.
    const { width, height, overflow } = await headerLink.evaluate((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const span = el.querySelector("span:last-child") as HTMLElement | null;
      return {
        width: rect.width,
        height: rect.height,
        overflow: span
          ? span.scrollWidth - span.clientWidth
          : 0,
      };
    });
    expect(width).toBeGreaterThan(80);
    expect(height).toBeGreaterThan(12);
    // truncate is allowed, but in the open mobile sheet there is plenty of room,
    // so the wordmark should fit without horizontal clipping.
    expect(overflow).toBeLessThanOrEqual(1);

    // Nav items should be present and legible.
    for (const label of ["Control Panel", "Trade Results", "User Dashboard"]) {
      await expect(sidebar.getByText(label, { exact: true })).toBeVisible();
    }
  });
});

/** Visual-regression style screenshots for manual review. */
test("capture admin mobile screenshots", async ({ page }, testInfo) => {
  await loginAsAdmin(page);
  await captureAdmin(page, testInfo.outputPath("admin-index.png"));
});

async function captureAdmin(page: Page, file: string) {
  await page.goto("/admin");
  await page.screenshot({ path: file, fullPage: true });
}
