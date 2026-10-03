import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REPAIR_HOSTS = (process.env.NEXT_PUBLIC_REPAIR_HOSTS || "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

function requestHost(request: NextRequest) {
  const raw = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  return raw.split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
}

/**
 * فقط pathname را برای metadata می‌فرستد.
 * هیچ redirectای از / به /admin نگذار — لندینگ باید روی آدرس اصلی بماند.
 * روی دامنهٔ سامانهٔ تعمیرکار (NEXT_PUBLIC_REPAIR_HOSTS) همهٔ مسیرها زیر /repair می‌روند.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (REPAIR_HOSTS.length > 0 && REPAIR_HOSTS.includes(requestHost(request))) {
    if (pathname !== "/repair" && !pathname.startsWith("/repair/")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/repair" : `/repair${pathname}`;
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
    "/((?!_next/static|_next/image|favicon.ico|sw.js|sw-|offline.html|icon-|manifest|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|json)$).*)",
  ],
};
