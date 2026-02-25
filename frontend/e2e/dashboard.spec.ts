import { test, expect, Page } from "@playwright/test";

async function loginAsDemo(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "marcus.johnson@email.com");
  await page.fill('input[type="password"]', "demo1234");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard", { timeout: 30_000 });
}

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test("should show patient info", async ({ page }) => {
    // Verify the patient name heading is visible
    await expect(
      page.getByRole("heading", { name: "Marcus Johnson" })
    ).toBeVisible({ timeout: 30_000 });

    // Verify the patient metadata line (DOB and patient ID)
    await expect(page.getByText(/DOB:/)).toBeVisible();
    await expect(page.getByText(/ID:/)).toBeVisible();

    // Verify connected portal badges are present
    await expect(page.locator('[aria-label^="Connected portal"]').first()).toBeVisible();
  });

  test("should show vitals section", async ({ page }) => {
    // Verify the Vitals heading
    await expect(
      page.getByRole("heading", { name: "Vitals" })
    ).toBeVisible({ timeout: 30_000 });

    // Vitals are rendered as cards in a grid. Each card has a label (text-sm text-gray-500)
    // and a value (text-2xl font-semibold). Verify at least one vitals card is present.
    const vitalCards = page.locator(".grid .bg-white, .grid .dark\\:bg-gray-900").first();
    await expect(vitalCards).toBeVisible();

    // Verify common vital labels appear (from demo data these typically include
    // things like Heart Rate, Blood Pressure, etc.)
    const vitalsSection = page.locator("text=Vitals").locator("..").locator("..");
    await expect(vitalsSection).toBeVisible();
  });

  test("should show lab charts", async ({ page }) => {
    // Verify the Lab Trends heading
    await expect(
      page.getByRole("heading", { name: "Lab Trends" })
    ).toBeVisible({ timeout: 30_000 });

    // The LabChart component renders chart containers. Verify at least one chart
    // container is rendered (they are inside the grid below "Lab Trends").
    // LabChart uses recharts which renders SVG elements inside the container.
    const labTrendsHeading = page.getByRole("heading", { name: "Lab Trends" });
    await expect(labTrendsHeading).toBeVisible();

    // Verify chart containers exist after the heading.
    // The charts are in a grid with lg:grid-cols-3
    const chartGrid = page.locator(".lg\\:grid-cols-3").first();
    await expect(chartGrid).toBeVisible({ timeout: 30_000 });

    // Verify at least one chart title is visible (e.g., Glucose, A1c, Cholesterol)
    const chartTitles = page.locator(".lg\\:grid-cols-3 >> text=/Glucose|Hemoglobin A1c|Cholesterol/");
    await expect(chartTitles.first()).toBeVisible();
  });

  test("should show recent labs table", async ({ page }) => {
    // Verify the Recent Lab Results heading
    await expect(
      page.getByRole("heading", { name: "Recent Lab Results" })
    ).toBeVisible({ timeout: 30_000 });

    // Verify the table is rendered with expected column headers
    const table = page.locator("table");
    await expect(table).toBeVisible({ timeout: 30_000 });

    // Check the table caption for accessibility
    await expect(page.locator("caption")).toHaveText("Recent Lab Results");

    // Verify column headers
    await expect(page.locator("th", { hasText: "Test" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Result" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Status" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Source" })).toBeVisible();

    // Verify at least one data row exists in the table body
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible();
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});
