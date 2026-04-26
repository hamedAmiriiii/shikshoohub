import { NextResponse } from 'next/server';

export function middleware(req) {
  const token = req.cookies.get('token'); // یا هر جایی که توکن ذخیره شده (مثلاً localStorage در سمت کلاینت)

  if (!token) {
    const loginUrl = new URL('/main/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url); // ذخیره URL جاری برای ریدایرکت پس از لاگین
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!login).*)'], // اعمال برای همه صفحات به جز صفحه لاگین
};
