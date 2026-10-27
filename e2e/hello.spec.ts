import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = [
  { locale: 'fa', dir: 'rtl', title: 'به‌زودی', switchTo: 'English', other: 'en', otherDir: 'ltr' },
  {
    locale: 'en',
    dir: 'ltr',
    title: 'Coming soon',
    switchTo: 'فارسی',
    other: 'fa',
    otherDir: 'rtl',
  },
] as const;

const OTHER_TITLE = { fa: 'به‌زودی', en: 'Coming soon' } as const;

test('the root path redirects to Persian', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/fa$/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

for (const { locale, dir, title, switchTo, other, otherDir } of PAGES) {
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
      await expect(page).toHaveURL(new RegExp(`/${other}$`));
      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang', other);
      await expect(html).toHaveAttribute('dir', otherDir);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(OTHER_TITLE[other]);
    });

    test('renders text in self-hosted Vazirmatn', async ({ page }) => {
      await page.goto(`/${locale}`);
      const fonts = await page.evaluate(async () => {
        await document.fonts.ready;
        const stack = getComputedStyle(document.body).fontFamily;
        const loaded = [...document.fonts]
          .filter((face) => face.status === 'loaded')
          .map((face) => face.family.replaceAll('"', ''));
        return { stack, loaded };
      });
      // Both subsets come first in the stack, before any system fallback (ADR 0012).
      expect(fonts.stack).toMatch(/^"?vazirmatnLatin"?, "?vazirmatnArabic"?,/);
      expect(fonts.loaded).toContain(locale === 'fa' ? 'vazirmatnArabic' : 'vazirmatnLatin');
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
  const csp = headers['content-security-policy'] ?? '';

  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['strict-transport-security']).toBe('max-age=63072000; includeSubDomains');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
  expect(headers['cross-origin-opener-policy']).toBe('same-origin');
  expect(headers['cross-origin-resource-policy']).toBe('same-origin');
  expect(headers['x-powered-by']).toBeUndefined();
  for (const directive of [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ]) {
    expect(csp).toContain(directive);
  }
  expect(csp).not.toContain('unsafe-eval');
});

test.describe('locale proxy', () => {
  for (const path of ['/apiary', '/em.cafe']) {
    test(`redirects ${path} to its Persian URL`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status()).toBe(307);
      expect(response.headers().location).toBe(`/fa${path}`);
    });
  }

  test('serves static files without a locale redirect', async ({ request }) => {
    const response = await request.get('/icon.svg', { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });
});
