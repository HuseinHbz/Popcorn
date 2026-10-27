import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const CASES = [
  { path: '/fa/no-such-page', lang: 'fa', dir: 'rtl', title: 'صفحه پیدا نشد' },
  { path: '/en/no-such-page', lang: 'en', dir: 'ltr', title: 'Page not found' },
  // Not a locale: rendered in the default locale (Persian).
  { path: '/t/no-such-table', lang: 'fa', dir: 'rtl', title: 'صفحه پیدا نشد' },
  { path: '/api/no-such-endpoint', lang: 'fa', dir: 'rtl', title: 'صفحه پیدا نشد' },
  // Single segments the locale proxy skips: the global 404 (src/app/global-not-found.tsx).
  { path: '/api', lang: 'fa', dir: 'rtl', title: 'صفحه پیدا نشد' },
  { path: '/robots.txt', lang: 'fa', dir: 'rtl', title: 'صفحه پیدا نشد' },
  { path: '/no-such-image.png', lang: 'fa', dir: 'rtl', title: 'صفحه پیدا نشد' },
] as const;

for (const { path, lang, dir, title } of CASES) {
  test.describe(`404 at ${path}`, () => {
    // The page must not depend on JavaScript: crawlers and script-less browsers get this.
    test('is complete in the HTML the server sends', async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status()).toBe(404);
      const html = await response.text();
      expect(html).toMatch(new RegExp(`<html lang="${lang}" dir="${dir}"`));
      expect(html).toContain(`<title>${title}</title>`);
      expect(html).toMatch(new RegExp(`<h1[^>]*>${title}</h1>`));
    });

    test('is localized, sets lang and dir, answers 404 and is not cached', async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      // A cached 404 would outlive a route added later (e.g. robots.txt in Phase 5).
      expect(response?.headers()['cache-control']).toContain('no-store');
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
