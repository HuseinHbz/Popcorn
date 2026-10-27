import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const CASES = [
  { path: '/fa/no-such-page', lang: 'fa', dir: 'rtl', title: 'صفحه پیدا نشد' },
  { path: '/en/no-such-page', lang: 'en', dir: 'ltr', title: 'Page not found' },
  // Not a locale: rendered in the default locale (Persian).
  { path: '/t/no-such-table', lang: 'fa', dir: 'rtl', title: 'صفحه پیدا نشد' },
  { path: '/api/no-such-endpoint', lang: 'fa', dir: 'rtl', title: 'صفحه پیدا نشد' },
] as const;

for (const { path, lang, dir, title } of CASES) {
  test.describe(`404 at ${path}`, () => {
    test('is localized, sets lang and dir, and answers 404', async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang', lang);
      await expect(html).toHaveAttribute('dir', dir);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    });

    test('has no axe violations', async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  });
}

test('an unknown path without a locale is redirected, then answers a Persian 404', async ({
  page,
}) => {
  const response = await page.goto('/no-such-page');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveURL(/\/fa\/no-such-page$/);
});
