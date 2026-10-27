import { getTranslations } from 'next-intl/server';

import { Link } from '@/shared/i18n/navigation';

/** The localized 404 body, shared by the locale 404 and the global 404. */
export async function NotFoundContent() {
  const t = await getTranslations('NotFound');

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
