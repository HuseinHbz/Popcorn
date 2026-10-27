# فاز ۰ — شروع و زیرساخت (هفته ۱)

**هدف:** ریپو، ابزار کیفیت، محیط Docker و CI کامل، به‌طوری که هر PR بعدی از روز اول زیر گیت ۹۸ برود.

**گیت فاز:** Pipeline سبز روی یک صفحه Hello دوزبانه با RTL درست و Lighthouse موبایل ≥ ۹۵.

## PRها

- [ ] **PR 0.1 — Scaffold پروژه**
  - Next.js (App Router)، React، TypeScript با `strict` و `noUncheckedIndexedAccess`، pnpm، Node LTS با `.nvmrc`
  - ESLint سخت‌گیرانه + `eslint-plugin-boundaries` برای قانون `app → modules/*/server → modules/*/domain`
  - Prettier، Husky + lint-staged، Commitlint (Conventional Commits)
  - اسکریپت `pnpm verify` = lint + typecheck + test + build
  - ساختار پوشه طبق CLAUDE.md با `index.ts` خالی در هر ماژول
- [ ] **PR 0.2 — محیط Docker توسعه**
  - `docker-compose.dev.yml`: PostgreSQL (با `btree_gist`)، Redis، MinIO
  - `src/shared/config/env.ts`: اعتبارسنجی همه متغیرهای محیطی با Zod؛ برنامه بدون env معتبر بالا نمی‌آید
  - `.env.example` فقط با Placeholder
- [ ] **PR 0.3 — i18n، RTL و ابزارهای پایه**
  - next-intl با `fa` پیش‌فرض و `en`؛ Routing `[locale]`؛ `dir` و `lang` درست روی `<html>`
  - فونت Vazirmatn و Shippori Mincho به‌صورت Self-host WOFF2 با subset؛ جای Peyda آماده تا رسیدن مجوز
  - `formatToman(irr: bigint)`، `formatJalali(date)` و `toPersianDigits()` با تست ۱۰۰٪
- [ ] **PR 0.4 — CI و تست**
  - GitHub Actions: install با cache، `pnpm verify`، Playwright smoke در fa و en، Lighthouse CI روی صفحه Hello
  - Vitest با coverage threshold برای `src/modules/*/domain` (۹۰٪)
  - axe-core داخل Playwright؛ هر violation یعنی شکست

## Prompt شروع

```
/phase 00
```

## Blocked

(خالی)
