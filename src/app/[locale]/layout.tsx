import '../globals.css';

import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';

import { directionOf, routing } from '@/shared/i18n/routing';
import { shipporiMincho, vazirmatnArabic, vazirmatnLatin } from '@/shared/ui/fonts';

export function generateStaticParams(): Array<{ locale: string }> {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('title'), description: t('description') };
}

export default async function LocaleLayout({ children }: LayoutProps<'/[locale]'>) {
  // The request config (shared/i18n/request.ts) resolves the locale and falls back to the
  // default for an unknown first segment (`/t/…`, `/api/…`); the page below answers 404,
  // so the 404 page is localized and accessible.
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      dir={directionOf(locale)}
      className={`${vazirmatnLatin.variable} ${vazirmatnArabic.variable} ${shipporiMincho.variable}`}
    >
      <body className="bg-washi font-sans text-ink antialiased">
        {/* Client components only need the locale for now; no message catalogue is shipped. */}
        <NextIntlClientProvider messages={null}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
