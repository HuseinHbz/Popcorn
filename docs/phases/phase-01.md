# فاز ۱ — Design System (هفته ۲ و ۳)

**هدف:** همه توکن‌ها و کامپوننت‌های پایه با جهت «Sumi & Washi». رنگ تأکیدی و لوگوی هر برند در زمان اجرا از پنل ادمین قابل تغییر است (ADR 0019).

**پیش‌نیاز:** لوگوهای فعلی (رسید ۲۰۲۶-۱۱-۰۴، رستری، در `docs/brand/source/`؛ هر سه تک‌رنگ هستند)؛ برای گیت فاز: عکس‌های Retouch‌شده و تأیید Mockupهای Hi-fi (در Claude Design artifact، خارج از Claude Code). فایل برداری لوگوها برای چاپ مفید است ولی مانع هیچ PR نیست.

**گیت فاز:** نمره طراحی ≥ ۹۸، axe صفر خطا در Storybook، تست کنتراست همه جفت‌رنگ‌ها سبز، تأیید نماینده رستوران.

## PRها

- [ ] **PR 1.1 — Design tokens و تم برند در زمان اجرا (ADR 0019)**
  - `src/shared/ui/tokens.json`: پالت خنثی (ink، washi، stone، ash)، رنگ‌های وضعیت، type scale، spacing مضرب ۸، radius، motion؛ نام‌های معنایی برند (`accent`، `accent-hover`، `on-accent`، …)
  - پیش‌فرض‌های **موقت** برند: `accent_light` = shu و `accent_dark` = kin با برچسب `provisional`؛ لوگوها تک‌رنگ هستند و رنگی از آن‌ها استخراج نمی‌شود
  - `src/modules/brand/domain`: تابع خالص ساخت رنگ‌های مشتق در OKLCH و تابع کنتراست WCAG، با پوشش ۱۰۰٪؛ همین تابع بعداً ذخیره در ادمین را کنترل می‌کند
  - تزریق CSS variables هر برند در layout سمت سرور با nonce در CSP؛ بدون fetch سمت کلاینت و بدون چشمک رنگ پیش‌فرض
  - تبدیل خودکار توکن‌ها به CSS variables و Tailwind theme
  - تست کنتراست: هر جفت متن/پس‌زمینه ≥ ۴.۵:۱، `accent_light` روی washi و `accent_dark` روی ink ≥ ۳:۱، on-accent روی هر accent ≥ ۴.۵:۱
  - کامپوننت `BrandLogo` با نسخه روشن و تیره؛ فعلاً از فایل‌های `docs/brand/source/` (کپی بهینه در `public/brand/`)
- [ ] **PR 1.2 — Storybook و Primitiveها**
  - Storybook با addon a11y و حالت RTL/LTR و light/dark
  - Button، IconButton، Link، Input، Textarea، Select، Checkbox، Radio، Switch، Dialog، Sheet، Toast، Tabs، Badge، Skeleton، Tooltip (بر پایه Radix)
- [ ] **PR 1.3 — کامپوننت‌های سایت**
  - SiteHeader با Brand switcher (ناکایا / ام کافه / Izakaya)، Footer، Section، Hero (تصویر یا ویدیو)، MenuCard، PriceTag، OpenNowBadge
  - JalaliDatePicker و TimeSlotPicker
  - انیمیشن Reveal با احترام به `prefers-reduced-motion`
- [ ] **PR 1.4 — کامپوننت‌های ادمین**
  - AdminShell (سایدبار، انتخاب شعبه)، DataTable (TanStack Table با فیلتر، مرتب‌سازی، صفحه‌بندی سمت سرور)، FormField + Zod، EmptyState، ConfirmDialog، StatCard
  - تم تیره پیش‌فرض ادمین

## Blocked

(خالی)

## تاریخچه

- 2026-11-04: PR 1.1 به دلیل نبود فایل لوگو Blocked شد (commit `071c2a1`). همان روز لوگوها رسید و مالک تصمیم گرفت رنگ و لوگو از ادمین قابل تغییر باشد (ADR 0019)؛ Blocked برداشته شد. نوع مجوز Web فونت Peyda (تعداد دامنه) هنوز برای گیت فاز لازم است.
