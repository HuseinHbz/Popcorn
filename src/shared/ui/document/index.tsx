import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';

import { directionOf } from '@/shared/i18n/routing';
import { shipporiMincho, vazirmatnArabic, vazirmatnLatin } from '@/shared/ui/fonts';

/**
 * The `<html>` document of every page: language, direction, fonts and the next-intl
 * provider. The locale comes from the request config (shared/i18n/request.ts), which
 * falls back to the default locale for a path outside `/fa` and `/en`.
 */
export async function Document({ children }: { children: ReactNode }) {
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
