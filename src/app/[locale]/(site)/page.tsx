import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/shared/i18n/navigation';
import { routing } from '@/shared/i18n/routing';

const BRANDS = ['nakaya', 'emCafe', 'izakaya'] as const;

/**
 * Only the locales from generateStaticParams exist. An unknown first segment the proxy skips
 * (`/api`, `/robots.txt`, `/x.png`) is a 404 that is not generated and cached on demand;
 * otherwise it was stored with `s-maxage=31536000`.
 */
export const dynamicParams = false;

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations('Home');
  const otherLocale =
    routing.locales.find((candidate) => candidate !== locale) ?? routing.defaultLocale;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-10 px-6 py-24">
      <header className="flex flex-col gap-4">
        <p className="text-sm tracking-wide text-stone">{t('eyebrow')}</p>
        <h1 className="font-display text-5xl">{t('title')}</h1>
        <p className="text-lg text-stone">{t('lead')}</p>
      </header>
      <section aria-labelledby="brands-heading" className="border-t border-kin pt-6">
        <h2 id="brands-heading" className="mb-3 text-sm text-stone">
          {t('brandsLabel')}
        </h2>
        <ul className="flex flex-wrap gap-x-8 gap-y-2 text-xl">
          {BRANDS.map((brand) => (
            <li key={brand}>{t(`brands.${brand}`)}</li>
          ))}
        </ul>
      </section>
      <Link
        href="/"
        locale={otherLocale}
        lang={otherLocale}
        hrefLang={otherLocale}
        className="self-start text-shu underline underline-offset-4"
      >
        {t('switchLocale')}
      </Link>
    </main>
  );
}
