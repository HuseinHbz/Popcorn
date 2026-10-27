# فاز ۵ — آماده‌سازی انتشار اول (نیمه هفته ۸ تا ۹) — v1.0.0

**هدف:** انتشار سایت عمومی، منوها و رزرو روی Production.

**پیش‌نیاز:** سرور Production، دامنه(ها)، گواهی TLS، جلسه UAT با رستوران.

**گیت فاز:** UAT امضاشده، Security review بدون High/Critical، تست بار رزرو موفق، تست Restore بکاپ موفق.

## PRها

- [ ] **PR 5.1 — SEO**
  - metadata کامل دوزبانه، `hreflang`، sitemap، robots، JSON-LD برای Restaurant و Menu هر برند، صفحات 404 و 500 برندشده
- [ ] **PR 5.2 — Production**
  - `docker-compose.prod.yml`: nginx (TLS، CSP با nonce، HSTS، تنظیم SSE)، app، worker، postgres، redis، minio
  - GlitchTip، Uptime Kuma، لاگ ساختاریافته با Mask کردن موبایل
- [ ] **PR 5.3 — بکاپ و Runbook**
  - بکاپ روزانه رمزنگاری‌شده با نگهداری ۳۰ روزه، اسکریپت Restore
  - `docs/runbooks/`: deploy، rollback، restore، قطعی پیامک، قطعی درگاه
- [ ] **PR 5.4 — تست بار و بررسی نهایی**
  - k6 روی جستجوی اسلات و ثبت رزرو؛ اصلاح کوئری‌های کند با `EXPLAIN`
  - اجرای کامل `security-reviewer` روی کل کدبیس
- [ ] **PR 5.5 — Release**
  - CHANGELOG، تگ `v1.0.0`، استقرار، Smoke test روی Production

## Blocked

(خالی)
