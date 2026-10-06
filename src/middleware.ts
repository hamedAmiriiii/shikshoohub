import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isRepairHostname, repairPathFor } from "./app/lib/repairHosts";

function requestHosts(request: NextRequest) {
  return [request.headers.get("x-forwarded-host"), request.headers.get("host")]
    .filter((value): value is string => Boolean(value))
    .join(",");
}

/**
 * فقط pathname را برای metadata می‌فرستد.
 * هیچ redirectای از / به /admin نگذار — لندینگ باید روی آدرس اصلی بماند.
 * روی دامنهٔ تعمیرات (مثل omidtamir.ir) همهٔ مسیرها زیر /repair می‌روند.
 */
/** لینک بازاریاب منوی آنلاین → مستقیم لندینگ منو (با حفظ ?mref=) */
const MENU_LANDING_MREF = "4Z3T6F";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isRepairHostname(requestHosts(request))) {
    const nextPath = repairPathFor(pathname);
    if (nextPath) {
      const url = request.nextUrl.clone();
      url.pathname = nextPath;
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/") {
    const mref = (request.nextUrl.searchParams.get("mref") || "").trim().toUpperCase();
    if (mref === MENU_LANDING_MREF) {
      const url = request.nextUrl.clone();
      url.pathname = "/landing/menu";
      return NextResponse.redirect(url);
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|sw-|offline.html|icon-|manifest|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|json|js|css|woff2?|ttf)$).*)",
  ],
};
