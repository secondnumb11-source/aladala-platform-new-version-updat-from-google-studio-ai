import { test, expect } from '@playwright/test';

const viewports = [
  { width: 1920, height: 1080, name: 'desktop' },
  { width: 1024, height: 768, name: 'tablet' },
  { width: 375, height: 812, name: 'mobile' }
];

test.describe('Visual Regression Tests', () => {
  for (const vp of viewports) {
    test.describe(`Viewport: ${vp.name}`, () => {
      test.use({ viewport: vp });

      test('CasesModule luxurious hovers render correctly', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForSelector('.card-professional-case');
        
        await expect(page).toHaveScreenshot(`cases-module-initial-${vp.name}.png`, {
          fullPage: true,
        });
        
        const firstCase = page.locator('.card-professional-case').first();
        await firstCase.hover();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot(`cases-module-hover-${vp.name}.png`);
      });
      
      test('Dashboard loads correctly', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForSelector('main');
        await expect(page).toHaveScreenshot(`dashboard-initial-${vp.name}.png`, {
          fullPage: true,
        });
      });
    });
  }
});
