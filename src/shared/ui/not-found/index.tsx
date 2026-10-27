import { getTranslations } from 'next-intl/server';

import { Link } from '@/shared/i18n/navigation';
import type { AppLocale } from '@/shared/i18n/routing';

/** The localized 404 body (src/app/global-not-found.tsx). */
export async function NotFoundContent({ locale }: { locale: AppLocale }) {
  const t = await getTranslations({ locale, namespace: 'NotFound' });

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-6 py-24">
      <h1 className="font-display text-4xl">{t('title')}</h1>
      <p className="text-lg text-stone">{t('lead')}</p>
      <Link href="/" className="self-start text-shu underline underline-offset-4">
        {t('home')}
      </Link>
    </main>
  );
}
