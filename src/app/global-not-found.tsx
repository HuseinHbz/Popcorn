import './globals.css';

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Document } from '@/shared/ui/document';
import { NotFoundContent } from '@/shared/ui/not-found';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('NotFound');
  return { title: t('title') };
}

/**
 * 404 for a path no route matches: a single segment the locale proxy skips (`/api`,
 * `/robots.txt`, `/x.png`), which `[locale]` rejects because only `fa` and `en` exist
 * (dynamicParams = false). Rendered in the default locale, never cached (ADR 0018).
 */
export default function GlobalNotFound() {
  return (
    <Document>
      <NotFoundContent />
    </Document>
  );
}
