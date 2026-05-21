# نصب لندینگ وبینو در Laravel

## ۱. کپی فایل‌ها به پروژه Laravel

| از این پروژه (Next) | به Laravel |
|---------------------|------------|
| `public/css/webino-landing.css` | `public/css/webino-landing.css` |
| `public/js/webino-landing.js` | `public/js/webino-landing.js` |
| `public/laravel-landing/welcome.blade.php` | `resources/views/welcome.blade.php` |

## ۲. لینک CSS در Blade (مهم)

در `<head>` حتماً از `asset()` استفاده کنید، نه مسیر نسبی:

```blade
<link rel="stylesheet" href="{{ asset('css/webino-landing.css') }}">
```

## ۳. آدرس ثبت‌نام / ورود (اپ Next.js)

اگر لندینگ روی دامنه Laravel و اپ روی دامنه دیگر است، در `.env` لاراول:

```env
SHOP_REGISTER_URL=https://دامنه-اپ.ir/admin/register-shop
SHOP_LOGIN_URL=https://دامنه-اپ.ir/admin/login
```

در `config/app.php` اضافه کنید:

```php
'shop_register_url' => env('SHOP_REGISTER_URL', '/admin/register-shop'),
'shop_login_url' => env('SHOP_LOGIN_URL', '/admin/login'),
```

## ۴. Route

```php
Route::get('/', function () {
    return view('welcome');
});
```

## ۵. چرا CSS لود نمی‌شد؟

1. **CDN** — نسخه قدیم Tailwind/Google Fonts از اینترنت بود (روی بعضی سرورها بلاک).
2. **مسیر اشتباه** — `href="css/..."` بدون `asset()` یا فایل داخل `public/css/` نبود.
3. **Document root** — وب‌سرور باید `public/` لاراول را به‌عنوان root ببیند.

بعد از deploy این دو URL را باز کنید (نباید 404 باشند):

- `https://your-domain.com/css/webino-landing.css`
- `https://your-domain.com/js/webino-landing.js`

## ۶. تست سریع

اگر صفحه بدون استایل است، در DevTools → Network ببینید درخواست `webino-landing.css` چه status دارد (404 = فایل کپی نشده یا مسیر `asset` اشتباه).
