# Trade Rise FX — Playwright UI checks

Automated mobile UI checks for the admin panel.

## What's covered

`tests/admin-mobile.spec.ts` runs on iPhone SE and Pixel 5 viewports and validates:

- **Breadcrumb scrolling** — the breadcrumb in `AdminBreadcrumb.tsx` stays on a
  single line (`flex-nowrap`, `whitespace-nowrap`), never overflows the mobile
  viewport, and is horizontally scrollable when the path is long. The
  "Trade Rise FX" wordmark and the current-page label are both visible.
- **Sidebar header readability** — opening the mobile sidebar sheet on `/admin`
  exposes the full "Trade Rise FX" wordmark in `AdminSidebar.tsx`'s
  `SidebarHeader`, with no clipping, plus all admin nav items.

## Running locally

```bash
# 1. Start the dev server (separate terminal)
bun run dev

# 2. Install browsers once
bunx playwright install chromium

# 3. Provide an admin account and run
TEST_ADMIN_EMAIL=you@example.com \
TEST_ADMIN_PASSWORD=*** \
PLAYWRIGHT_BASE_URL=http://localhost:8080 \
bunx playwright test
```

The account in `TEST_ADMIN_EMAIL` must already have the `admin` role granted
in the backend `user_roles` table — the tests do not provision roles.

## CI notes

- Set `PLAYWRIGHT_BASE_URL` to the preview/published URL when running against
  a deployed environment.
- `TEST_ADMIN_*` should be stored as CI secrets.
