"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/billiard/auth";
import { billiardHref } from "@/app/lib/billiardHosts";

function isClerkPath(pathname: string) {
  return pathname === billiardHref("/results-desk") || pathname.startsWith(`${billiardHref("/results-desk")}/`);
}

function isLoginPath(pathname: string) {
  return pathname === billiardHref("/login");
}

export function useClerkOnly() {
  const { user, loading, isStaff } = useAuth();
  const assigned = (user?.results_tournaments?.length || 0) > 0;
  return { loading, clerkOnly: !loading && !!user && !isStaff && assigned };
}

/** مسئول نتایج، اگر مدیر نباشد، فقط صفحهٔ ثبت نتیجه را می‌بیند. */
export function ClerkGate() {
  const { clerkOnly, loading } = useClerkOnly();
  const pathname = usePathname() || "";
  const router = useRouter();

  useEffect(() => {
    if (loading || !clerkOnly) return;
    if (isClerkPath(pathname) || isLoginPath(pathname)) return;
    router.replace(billiardHref("/results-desk"));
  }, [clerkOnly, loading, pathname, router]);

  return null;
}

export function HideForClerk({ children }: { children: React.ReactNode }) {
  const { clerkOnly } = useClerkOnly();
  if (clerkOnly) return null;
  return <>{children}</>;
}
