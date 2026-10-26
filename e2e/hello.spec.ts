import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = [
  { locale: 'fa', dir: 'rtl', title: 'به‌زودی', switchTo: 'English' },
  { locale: 'en', dir: 'ltr', title: 'Coming soon', switchTo: 'فارسی' },
] as const;

test('the root path redirects to Persian', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/fa$/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

for (const { locale, dir, title, switchTo } of PAGES) {
  test.describe(`hello page (${locale})`, () => {
    test('sets language and text direction', async ({ page }) => {
      await page.goto(`/${locale}`);
      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang', locale);
      await expect(html).toHaveAttribute('dir', dir);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    });

    test('switches to the other language', async ({ page }) => {
      await page.goto(`/${locale}`);
      await page.getByRole('link', { name: switchTo }).click();
      await expect(page.locator('html')).not.toHaveAttribute('lang', locale);
    });

    test('has no axe violations', async ({ page }) => {
      await page.goto(`/${locale}`);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  });
}

test('sends security headers', async ({ request }) => {
  const response = await request.get('/fa');
  const headers = response.headers();
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['x-powered-by']).toBeUndefined();
});
