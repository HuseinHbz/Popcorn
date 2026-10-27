import '../globals.css';

import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import { routing } from '@/shared/i18n/routing';
import { Document } from '@/shared/ui/document';

export function generateStaticParams(): Array<{ locale: string }> {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('title'), description: t('description') };
}

export default async function LocaleLayout({ children }: LayoutProps<'/[locale]'>) {
  // Only `fa` and `en` reach this layout (dynamicParams = false on the page); every other
  // path is answered by src/app/global-not-found.tsx.
  return <Document locale={await getLocale()}>{children}</Document>;
}
