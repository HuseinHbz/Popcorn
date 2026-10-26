# فاز ۶ — سفارش گارسون و QR، پرداخت (هفته ۱۰ و ۱۱)

**هدف:** ثبت سفارش توسط گارسون (مسیر اصلی)، QR در دو حالت، احضار گارسون، آشپزخانه زنده و تسویه.

**پیش‌نیاز:** مقادیر اولیه `charge_rules` برای هر شعبه (مالیات و سرویس تهران و کیش، هزینه میز).

**گیت فاز:** State machine و محاسبه هزینه‌ها با پوشش ۱۰۰٪، تأخیر نمایش سفارش در آشپزخانه کمتر از ۲ ثانیه.

## PRها

- [ ] **PR 6.1 — Schema سفارش**
    - `orders` (`source`: waiter | qr، `waiter_id`)، `order_items` با snapshot، `order_status_history`، `charge_rules` (scope: branch، category، item_group، item)، `order_charges`، `waiter_calls`
- [ ] **PR 6.2 — Domain سفارش**
    - State machine وضعیت‌ها، محاسبه subtotal، تخفیف و هزینه‌ها با اولویت item > item_group > category > branch، گردکردن ریال
- [ ] **PR 6.3 — صفحه سفارش گارسون**
    - موبایل‌محور و یک‌دستی: انتخاب میز، افزودن آیتم و Modifier، یادداشت، ارسال به آشپزخانه، ویرایش تا قبل از `preparing`
- [ ] **PR 6.4 — Realtime**
    - SSE + LISTEN/NOTIFY: Kanban آشپزخانه، اعلان احضار گارسون با صدا برای منطقه سالن، صفحه وضعیت مشتری
- [ ] **PR 6.5 — QR میز**
    - `/t/[qrToken]`: حالت `menu_only` (منو + احضار گارسون) و `order` (سبد + ثبت در `pending` تا تأیید گارسون)
- [ ] **PR 6.6 — تسویه**
    - صفحه صندوق: هزینه دستی با مجوز `orders:add_charge` و Audit log، تخفیف تا سقف نقش، پرداخت SEP، کارتخوان و نقد، تقسیم صورتحساب، چاپ رسید

## Blocked

(خالی)
