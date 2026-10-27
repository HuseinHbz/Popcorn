import './globals.css';

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { type AppLocale, routing } from '@/shared/i18n/routing';
import { Document } from '@/shared/ui/document';
import { NotFoundContent } from '@/shared/ui/not-found';

/**
 * The locale of the requested path. The locale proxy (src/proxy.ts) stamps every request it
 * handles with this next-intl header, so `/en/…` gets English; paths it skips (`/t/…`,
 * `/api/…`, files) and any other value fall back to the default locale.
 */
async function localeOfRequest(): Promise<AppLocale> {
  const stamped = (await headers()).get('X-NEXT-INTL-LOCALE');
  return hasLocale(routing.locales, stamped) ? stamped : routing.defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: await localeOfRequest(), namespace: 'NotFound' });
  return { title: t('title') };
}

/**
 * The 404 for every path no route matches: anything under a locale other than its home
 * page, and everything outside the locales. Rendered on the server with its own document,
 * so it is complete without JavaScript, and never cached (ADR 0018).
 */
export default async function GlobalNotFound() {
  const locale = await localeOfRequest();

  return (
    <Document locale={locale}>
      <NotFoundContent locale={locale} />
    </Document>
  );
}
