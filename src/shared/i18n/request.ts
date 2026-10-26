import { locale as rootLocale } from 'next/root-params';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { loadMessages } from './messages';
import { routing } from './routing';

export default getRequestConfig(async ({ locale: explicitLocale }) => {
  // An explicit `getTranslations({ locale })` wins over the `[locale]` segment.
  const requested = explicitLocale ?? (await rootLocale());
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return { locale, messages: await loadMessages(locale), timeZone: 'Asia/Tehran' };
});
