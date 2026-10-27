# فاز ۲ — پایه سیستم، Auth و RBAC (هفته ۴ تا نیمه ۵)

**هدف:** کاربران کارکنان، نقش‌ها، Audit log، شعب و برندها؛ پایه‌ای که همه ماژول‌های بعدی روی آن ساخته می‌شوند.

**پیش‌نیاز:** فهرست کارکنان اولیه و نقش هر نفر در هر شعبه.

**گیت فاز:** ماتریس تست Permission (هر نقش × هر عملیات) سبز، Audit log برای همه عملیات نوشتنی، Security review بدون High/Critical.

## PRها

- [ ] **PR 2.1 — Schema هسته**
  - `brands`، `branches`، `branch_hours`، `branch_closures`، `staff_users`، `roles`، `permissions`، `role_permissions`، `user_roles` (با `branch_id`)، `audit_logs`
  - UUIDv7، `created_at`/`updated_at`/`deleted_at`
  - Seed: ۳ برند، ۲ شعبه (الهیه با ناکایا و ام کافه، کیش با Izakaya)، ۷ نقش پیش‌فرض
- [ ] **PR 2.2 — احراز هویت کارکنان**
  - Better Auth: موبایل + رمز، Argon2id، قفل بعد از ۵ تلاش، 2FA اجباری برای Owner، Session سمت سرور
  - صفحه ورود ادمین
- [ ] **PR 2.3 — RBAC**
  - Registry مرکزی Permissionها `resource:action`
  - `requirePermission(user, permission, branchId?)` در لایه Service
  - تست ماتریسی برای همه نقش‌ها
- [ ] **PR 2.4 — زیرساخت Server Action**
  - `defineAction({ schema, permission, handler })`: Zod → Permission → handler → Audit log در یک تراکنش
  - Helperهای soft delete و خطاهای `DomainError` با کد ثابت و پیام i18n
- [ ] **PR 2.5 — مدیریت کاربران**
  - لیست با جستجو و فیلتر، افزودن، ویرایش، غیرفعال‌سازی، حذف نرم، تخصیص نقش در هر شعبه
- [ ] **PR 2.6 — مدیریت شعب**
  - CRUD شعبه، ساعت کاری چندشیفته، تعطیلات خاص، برندهای هر شعبه
  - تابع domain `isOpenAt(branch, datetime)` با تست شامل شیفت‌های بعد از نیمه‌شب

## Blocked

(خالی)
