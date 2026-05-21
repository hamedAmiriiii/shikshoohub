# راهنمای تنظیم PWA (Progressive Web App)



## فایل‌های مهم



| فایل | نقش |

|------|-----|

| `public/manifest.json` | مانیفست صفحه اصلی (`/`) |

| `public/manifest-admin.json` | PWA پنل فروشگاه: `start_url` و `scope` = `/admin` |

| `public/icon-192.png` / `icon-512.png` | آیکون نصب (**الزامی برای دکمه Install**) |

| `public/sw.js` | Service Worker |

| `public/offline.html` | صفحه آفلاین |

| `src/app/components/ServiceWorkerRegistration.tsx` | ثبت SW |

| `src/app/components/PWAInstallPrompt.tsx` | دکمه «نصب اپ» وقتی مرورگر اجازه دهد |



## تولید آیکون



```bash

npm run generate:pwa-icons

```



یا جایگزین با لوگوی واقعی برند در `public/icon-192.png` و `public/icon-512.png`.



## تست نصب (دکمه address bar)



1. **HTTPS** یا `localhost` (نه IP بدون گواهی)

2. Build و اجرای production (توصیه می‌شود):

   ```bash

   npm run build

   npm start

   ```

3. Chrome → F12 → **Application** → **Manifest**: باید بدون خطا باشد و آیکون‌ها ۲۰۰ OK

4. **Application** → **Service Workers**: `sw.js` فعال و scope `/`

5. اگر قبلاً نصب کرده‌اید یا dismiss کرده‌اید: Application → **Storage** → Clear site data

6. گاهی Chrome بعد از چند بازدید کوتاه، آیکن Install را در نوار آدرس نشان می‌دهد (heuristic)



### اگر آیکن نوار آدرس نیامد



- دکمه شناور **«نصب اپ»** در صفحه (رویداد `beforeinstallprompt`) را امتحان کنید

- منوی ⋮ → **Install Webino** / **نصب برنامه**

- موبایل: **Add to Home Screen**



## عیب‌یابی



| مشکل | علت رایج |

|------|-----------|

| Install در address bar نیست | آیکون ۴۰۴، بدون HTTPS، قبلاً نصب شده، فقط `npm run dev` بدون معیارهای کامل |

| Manifest error | `purpose` باید `any` یا `maskable` جدا باشد (نه `"any maskable"`) |

| SW ثبت نمی‌شود | Console، unregister قدیمی در DevTools |



## ویژگی‌ها



- Service Worker (Network first + offline fallback)

- Manifest + آیکون ۱۹۲/۵۱۲

- دکمه نصب در UI

- iOS: Add to Home Screen (آیکن apple-touch)


