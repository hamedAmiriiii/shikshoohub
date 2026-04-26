# راهنمای تنظیم PWA (Progressive Web App)

## فایل‌های ایجاد شده:

1. **`public/manifest.json`** - تنظیمات PWA
2. **`public/sw.js`** - Service Worker برای مدیریت offline
3. **`public/offline.html`** - صفحه نمایش در حالت offline
4. **`src/app/components/ServiceWorkerRegistration.tsx`** - کامپوننت ثبت Service Worker
5. **`src/app/offline/page.tsx`** - صفحه offline در Next.js

## مراحل نصب:

### 1. ایجاد آیکون‌های PWA

برای کامل شدن PWA، باید دو آیکون ایجاد کنید:

- `public/icon-192.png` (192x192 پیکسل)
- `public/icon-512.png` (512x512 پیکسل)

می‌توانید از یک لوگوی موجود استفاده کنید و آن را به این سایزها تبدیل کنید.

### 2. تست در Development

1. پروژه را build کنید:
   ```bash
   npm run build
   npm start
   ```

2. در مرورگر Chrome:
   - به `chrome://serviceworker-internals/` بروید
   - Service Worker را بررسی کنید

3. DevTools:
   - F12 را بزنید
   - به تب "Application" بروید
   - در بخش "Service Workers" وضعیت را بررسی کنید

### 3. تست Offline Mode

1. در Chrome DevTools:
   - F12 را بزنید
   - به تب "Network" بروید
   - گزینه "Offline" را انتخاب کنید
   - صفحه را refresh کنید
   - باید صفحه offline نمایش داده شود

### 4. نصب PWA

1. در مرورگر Chrome/Edge:
   - آیکون نصب در address bar را کلیک کنید
   - یا از منو: "Install kerman-Photo"

2. در موبایل:
   - در Chrome/Safari: منو → "Add to Home Screen"

## ویژگی‌های پیاده‌سازی شده:

✅ Service Worker برای مدیریت offline
✅ Cache کردن صفحات
✅ نمایش صفحه offline سفارشی
✅ Auto-refresh وقتی آنلاین می‌شود
✅ Manifest برای نصب PWA
✅ Metadata برای iOS و Android

## نکات مهم:

1. **HTTPS ضروری است**: PWA فقط در HTTPS یا localhost کار می‌کند
2. **Service Worker Scope**: Service Worker فقط در scope خودش کار می‌کند
3. **Cache Strategy**: در حال حاضر از "Network First" استفاده می‌شود
4. **Update Service Worker**: برای به‌روزرسانی، باید cache را clear کنید

## عیب‌یابی:

### Service Worker ثبت نمی‌شود:
- مطمئن شوید که در HTTPS یا localhost هستید
- Console را بررسی کنید برای خطاها
- Service Worker را از DevTools unregister کنید و دوباره امتحان کنید

### صفحه offline نمایش داده نمی‌شود:
- مطمئن شوید که `public/offline.html` وجود دارد
- Service Worker را بررسی کنید
- Cache را clear کنید

### PWA نصب نمی‌شود:
- مطمئن شوید که `manifest.json` درست است
- آیکون‌ها را بررسی کنید
- در Chrome DevTools → Application → Manifest را بررسی کنید

## بهینه‌سازی‌های پیشنهادی:

1. **Cache Strategy بهتر**: می‌توانید از "Cache First" برای فایل‌های static استفاده کنید
2. **Background Sync**: برای sync کردن داده‌ها وقتی آنلاین شد
3. **Push Notifications**: برای اطلاع‌رسانی به کاربر
4. **App Shortcuts**: برای دسترسی سریع به بخش‌های مهم

