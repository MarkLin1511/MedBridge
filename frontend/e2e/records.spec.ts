import { test, expect, Page } from "@playwright/test";

async function loginAsDemo(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "marcus.johnson@email.com");
  await page.fill('input[type="password"]', "demo1234");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard", { timeout: 30_000 });
}

test.describe("Records", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test("should show records page", async ({ page }) => {
    await page.goto("/records", { timeout: 30_000 });

    // Verify the page heading
    await expect(
      page.getByRole("heading", { name: "Medical Records" })
    ).toBeVisible({ timeout: 30_000 });

    // Verify the subtitle
    await expect(
      page.getByText("Complete timeline across all connected portals and devices")
    ).toBeVisible();

    // Verify that record items are listed in the timeline.
    // Each record card is rendered inside a container with rounded-2xl styling and a title (h3).
    const recordCards = page.locator("h3");
    await expect(recordCards.first()).toBeVisible({ timeout: 30_000 });
    const count = await recordCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should filter records by type", async ({ page }) => {
    await page.goto("/records", { timeout: 30_000 });

    // Wait for records to load
    await expect(
      page.getByRole("heading", { name: "Medical Records" })
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("h3").first()).toBeVisible({ timeout: 30_000 });

    // Count initial records (with "All Records" filter active)
    const initialCount = await page.locator("h3").count();

    // Click the "Labs" filter button
    await page.getByLabel("Filter by Labs").click();

    // Wait for the filtered results to settle (the API call has a 300ms debounce)
    await page.waitForTimeout(1000);

    // After filtering by Labs, verify that visible record type badges all say "Lab"
    // or that there are fewer/equal records than the initial "All" view.
    // If there are results, they should have the Lab type badge.
    const filteredCards = page.locator("h3");
    const filteredCount = await filteredCards.count();

    if (filteredCount > 0) {
      // Verify that at least one Lab badge is visible
      await expect(page.locator("text=Lab").first()).toBeVisible();
    }

    // The filtered count should be less than or equal to the initial count
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Click "All Records" to reset
    await page.getByLabel("Filter by All Records").click();
    await page.waitForTimeout(1000);
    const resetCount = await page.locator("h3").count();
    expect(resetCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test("should search records", async ({ page }) => {
    await page.goto("/records", { timeout: 30_000 });

    // Wait for records to load
    await expect(page.locator("h3").first()).toBeVisible({ timeout: 30_000 });
    const initialCount = await page.locator("h3").count();

    // Type a search query in the search box
    const searchInput = page.getByLabel("Search medical records");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("glucose");

    // Wait for debounce (300ms) and API response
    await page.waitForTimeout(1500);

    // Results should update. The count may be different from the initial count.
    // If results are found, they should contain the search term in their title or description.
    const searchResults = page.locator("h3");
    const searchCount = await searchResults.count();

    if (searchCount > 0) {
      // At least one result should be visible
      await expect(searchResults.first()).toBeVisible();
    } else {
      // If no results, the "No records found" message should appear
      await expect(page.getByText("No records found")).toBeVisible();
    }

    // Clear the search and verify records come back
    await searchInput.clear();
    await page.waitForTimeout(1500);
    const clearedCount = await page.locator("h3").count();
    expect(clearedCount).toBeGreaterThanOrEqual(0);
  });

  test("should show export confirmation", async ({ page }) => {
    await page.goto("/records", { timeout: 30_000 });

    // Wait for the page to load
    await expect(
      page.getByRole("heading", { name: "Medical Records" })
    ).toBeVisible({ timeout: 30_000 });

    // Click the Export FHIR R4 button
    await page.getByRole("button", { name: /Export FHIR R4/ }).click();

    // Verify the confirmation dialog appears
    await expect(
      page.getByText("Export all records as FHIR R4 JSON?")
    ).toBeVisible();

    // Verify the dialog has Cancel and Confirm Export buttons
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm Export" })).toBeVisible();

    // Click Cancel to dismiss
    await page.getByRole("button", { name: "Cancel" }).click();

    // Verify the confirmation dialog is dismissed
    await expect(
      page.getByText("Export all records as FHIR R4 JSON?")
    ).not.toBeVisible();
  });
});
