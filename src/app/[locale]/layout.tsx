import '../globals.css';

import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { directionOf, routing } from '@/shared/i18n/routing';
import { shipporiMincho, vazirmatnArabic, vazirmatnLatin } from '@/shared/ui/fonts';

export function generateStaticParams(): Array<{ locale: string }> {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('title'), description: t('description') };
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  // An unknown first segment (`/t/…`, `/api/…`) renders the shell in the default locale;
  // the page below answers 404, so the 404 page is localized and accessible.
  const { locale: requested } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

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
