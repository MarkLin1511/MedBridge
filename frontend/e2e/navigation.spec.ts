import { test, expect, Page } from "@playwright/test";

async function loginAsDemo(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "marcus.johnson@email.com");
  await page.fill('input[type="password"]', "demo1234");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard", { timeout: 30_000 });
}

test.describe("Navigation", () => {
  test("should navigate between pages", async ({ page }) => {
    await loginAsDemo(page);

    // Verify we start on the Dashboard
    await expect(
      page.getByRole("heading", { name: "Marcus Johnson" })
    ).toBeVisible({ timeout: 30_000 });

    // Navigate to Records via the navbar link
    await page.getByRole("link", { name: "Records" }).first().click();
    await page.waitForURL("/records", { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: "Medical Records" })
    ).toBeVisible({ timeout: 30_000 });

    // Navigate to Providers via the navbar link
    await page.getByRole("link", { name: "Providers" }).first().click();
    await page.waitForURL("/providers", { timeout: 30_000 });
    expect(page.url()).toContain("/providers");

    // Navigate to Settings via the navbar link
    await page.getByRole("link", { name: "Settings" }).first().click();
    await page.waitForURL("/settings", { timeout: 30_000 });
    expect(page.url()).toContain("/settings");

    // Navigate back to Dashboard via the navbar link
    await page.getByRole("link", { name: "Dashboard" }).first().click();
    await page.waitForURL("/dashboard", { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: "Marcus Johnson" })
    ).toBeVisible({ timeout: 30_000 });
  });

  test("should show mobile nav on small screens", async ({ page }) => {
    // Set viewport to a mobile size
    await page.setViewportSize({ width: 375, height: 812 });

    await loginAsDemo(page);

    // Wait for the dashboard to load
    await expect(
      page.getByText("Marcus Johnson")
    ).toBeVisible({ timeout: 30_000 });

    // The mobile bottom navigation should be visible on small screens.
    // It is rendered as a fixed bar at the bottom with nav links.
    // The bottom nav contains links for Dashboard, Records, Providers, Settings.
    const bottomNav = page.locator(".md\\:hidden.fixed.bottom-0");
    await expect(bottomNav).toBeVisible();

    // Verify the bottom nav contains all four navigation links
    await expect(bottomNav.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "Records" })).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "Providers" })).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "Settings" })).toBeVisible();

    // The desktop nav links (hidden on md:) should NOT be visible at this viewport
    const desktopNav = page.locator(".hidden.md\\:flex.items-center.gap-1");
    await expect(desktopNav).not.toBeVisible();
  });

  test("should open notification dropdown", async ({ page }) => {
    await loginAsDemo(page);

    // Wait for the dashboard to fully load
    await expect(
      page.getByText("Marcus Johnson")
    ).toBeVisible({ timeout: 30_000 });

    // Click the notification bell icon button
    const bellButton = page.getByLabel("Notifications");
    await expect(bellButton).toBeVisible();
    await bellButton.click();

    // Verify the notification dropdown appears with the "Notifications" heading
    await expect(page.getByText("Notifications").last()).toBeVisible({ timeout: 5_000 });

    // The dropdown should have a menu role with notification items or "No notifications" text
    const dropdown = page.locator('[role="menu"]');
    await expect(dropdown).toBeVisible();

    // Verify the dropdown can be closed by clicking the bell again
    await bellButton.click();
    await expect(dropdown).not.toBeVisible();
  });
});
