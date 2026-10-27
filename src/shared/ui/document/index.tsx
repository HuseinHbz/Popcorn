import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';

import { type AppLocale, directionOf } from '@/shared/i18n/routing';
import { shipporiMincho, vazirmatnArabic, vazirmatnLatin } from '@/shared/ui/fonts';

/** The `<html>` document of every page: language, direction, fonts and the next-intl provider. */
export function Document({ locale, children }: { locale: AppLocale; children: ReactNode }) {
  return (
    <html
      lang={locale}
      dir={directionOf(locale)}
      className={`${vazirmatnLatin.variable} ${vazirmatnArabic.variable} ${shipporiMincho.variable}`}
    >
      <body className="bg-washi font-sans text-ink antialiased">
        {/* Client components only need the locale for now; no message catalogue is shipped. */}
        <NextIntlClientProvider locale={locale} messages={null}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
