"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isRepairHostname, repairPathFor } from "@/app/lib/repairHosts";

/** اگر میدلور هاست را ندید، باز هم از دامنهٔ تعمیرات به /repair برو. */
export default function RepairHostRedirect() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (!isRepairHostname(window.location.hostname)) return;
    const next = repairPathFor(pathname);
    if (!next) return;
    window.location.replace(`${next}${window.location.search}${window.location.hash}`);
  }, [pathname]);

  return null;
}
