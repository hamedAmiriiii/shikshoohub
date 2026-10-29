"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { billiardPathFor, isBilliardHostname } from "@/app/lib/billiardHosts";

/** اگر میدلور هاست را ندید، باز هم از دامنهٔ بیلیارد به /billiard برو. */
export default function BilliardHostRedirect() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (!isBilliardHostname(window.location.hostname)) return;
    const next = billiardPathFor(pathname);
    if (!next) return;
    window.location.replace(`${next}${window.location.search}${window.location.hash}`);
  }, [pathname]);

  return null;
}
