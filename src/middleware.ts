import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * فقط pathname را برای metadata می‌فرستد.
 * هیچ redirectای از / به /admin نگذار — لندینگ باید روی آدرس اصلی بماند.
 */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|icon-|manifest|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|json)$).*)",
  ],
};
