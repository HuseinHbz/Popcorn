import { getLocale, getTranslations } from 'next-intl/server';

import { Link } from '@/shared/i18n/navigation';

const BRANDS = ['nakaya', 'emCafe', 'izakaya'] as const;

export default async function HomePage() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('Home')]);
  const otherLocale = locale === 'fa' ? 'en' : 'fa';

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-10 px-6 py-24">
      <header className="flex flex-col gap-4">
        <p className="text-sm tracking-wide text-stone">{t('eyebrow')}</p>
        <h1 className="text-5xl font-bold">{t('title')}</h1>
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
