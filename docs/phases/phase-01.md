# فاز ۱ — Design System (هفته ۲ و ۳)

**هدف:** همه توکن‌ها و کامپوننت‌های پایه، منطبق بر لوگوی فعلی سه برند و جهت «Sumi & Washi».

**پیش‌نیاز:** فایل برداری لوگوهای ناکایا، ام کافه و Izakaya؛ عکس‌های Retouch‌شده؛ تأیید Mockupهای Hi-fi (در Claude Design artifact، خارج از Claude Code).

**گیت فاز:** نمره طراحی ≥ ۹۸، axe صفر خطا در Storybook، تست کنتراست همه جفت‌رنگ‌ها سبز، تأیید نماینده رستوران.

## PRها

- [ ] **PR 1.1 — Design tokens**
  - `src/shared/ui/tokens.json`: رنگ (light/dark، برای هر برند در صورت تفاوت لوگو)، type scale، spacing مضرب ۸، radius، motion
  - تبدیل خودکار به CSS variables و Tailwind theme
  - تست کنتراست: هر جفت متن/پس‌زمینه ≥ ۴.۵:۱، متن بزرگ و آیکون ≥ ۳:۱
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
