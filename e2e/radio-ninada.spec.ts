import { test, expect } from '@playwright/test';

test.describe('Radio Ninada 2.0 Enterprise Test Suite', () => {

  test('1. Public Homepage & Audio Player Initialization', async ({ page }) => {
    await page.goto('http://localhost:5500/modern_fm_home.html');
    await expect(page).toHaveTitle(/Radio Ninada/);

    // Verify brand logo is visible
    const logo = page.locator('img[alt*="Radio Ninada"]');
    await expect(logo).toBeVisible();

    // Verify audio player button
    const heroPlayBtn = page.locator('#hero-play-icon');
    await expect(heroPlayBtn).toBeVisible();
    await heroPlayBtn.click();

    // Verify toast feedback message
    const toastAlert = page.locator('#toast-alert');
    await expect(toastAlert).toBeVisible();
  });

  test('2. Global Radio Search Modal', async ({ page }) => {
    await page.goto('http://localhost:5500/modern_fm_home.html');

    // Click search icon button in header nav
    const searchBtn = page.locator('button[title*="Search"]');
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();

    // Verify modal appears
    const searchModal = page.locator('#global-search-modal');
    await expect(searchModal).toBeVisible();

    // Perform query input
    const searchInput = page.locator('#global-search-input');
    await searchInput.fill('Music');
    await page.waitForTimeout(500);

    // Verify search results container renders
    const resultsContainer = page.locator('#global-search-results');
    await expect(resultsContainer).toBeVisible();
  });

  test('3. Admin Dashboard Authentication Protection', async ({ page }) => {
    // Attempt unauthenticated navigation to dashboard
    await page.goto('http://localhost:3000/dashboard');

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });
});
