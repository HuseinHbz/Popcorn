import '../globals.css';

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { routing } from '@/shared/i18n/routing';
import { Document } from '@/shared/ui/document';

export function generateStaticParams(): Array<{ locale: string }> {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('title'), description: t('description') };
}

export default function LocaleLayout({ children }: LayoutProps<'/[locale]'>) {
  // For an unknown first segment with more segments (`/t/…`, `/api/…`) the document falls
  // back to the default locale, and the page below answers a localized 404.
  return <Document>{children}</Document>;
}
