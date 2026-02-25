import { test, expect, Page } from "@playwright/test";

async function loginAsDemo(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "marcus.johnson@email.com");
  await page.fill('input[type="password"]', "demo1234");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard", { timeout: 30_000 });
}

test.describe("Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login", { timeout: 30_000 });

    // Verify heading and subtext
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByText("Sign in to access your health records")).toBeVisible();

    // Verify form elements are present
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

    // Verify demo account button exists
    await expect(page.getByRole("button", { name: /Try demo account/ })).toBeVisible();

    // Verify signup link
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  });

  test("should show validation errors on empty submit", async ({ page }) => {
    await page.goto("/login", { timeout: 30_000 });

    // Click submit without filling any fields.
    // The HTML form uses required attributes, so the browser will block submission
    // and show native validation. We verify the email input reports as invalid.
    await page.click('button[type="submit"]');

    // The email field has the `required` attribute; after clicking submit it should
    // be flagged as invalid by the browser (the form will not submit).
    const emailInput = page.getByLabel("Email address");
    await expect(emailInput).toBeVisible();

    // Evaluate the native validity state on the required email input
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test("should login with demo account", async ({ page }) => {
    await page.goto("/login", { timeout: 30_000 });

    await page.fill('input[type="email"]', "marcus.johnson@email.com");
    await page.fill('input[type="password"]', "demo1234");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL("/dashboard", { timeout: 30_000 });
    expect(page.url()).toContain("/dashboard");

    // The dashboard should display the patient name
    await expect(page.getByText("Marcus Johnson")).toBeVisible({ timeout: 30_000 });
  });

  test("should show signup page with password requirements", async ({ page }) => {
    await page.goto("/signup", { timeout: 30_000 });

    // Verify heading
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();

    // Verify form fields
    await expect(page.getByLabel("First name")).toBeVisible();
    await expect(page.getByLabel("Last name")).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();

    // Password requirements checklist should NOT be visible initially
    await expect(page.getByLabel("Password requirements")).not.toBeVisible();

    // Type a password to trigger the strength checklist
    await page.getByLabel("Password").fill("Test");

    // Now the password requirements list should appear
    const requirementsList = page.getByLabel("Password requirements");
    await expect(requirementsList).toBeVisible();

    // Verify all four requirement labels are shown
    await expect(page.getByText("At least 8 characters")).toBeVisible();
    await expect(page.getByText("Uppercase letter")).toBeVisible();
    await expect(page.getByText("Lowercase letter")).toBeVisible();
    await expect(page.getByText("Number")).toBeVisible();
  });

  test("should logout", async ({ page }) => {
    // Login first
    await loginAsDemo(page);

    // Verify we are on the dashboard
    await expect(page.getByText("Marcus Johnson")).toBeVisible({ timeout: 30_000 });

    // Click the Sign out button in the navbar
    await page.getByRole("button", { name: "Sign out" }).click();

    // Should redirect back to login
    await page.waitForURL("/login", { timeout: 30_000 });
    expect(page.url()).toContain("/login");

    // Verify we see the login page again
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});
