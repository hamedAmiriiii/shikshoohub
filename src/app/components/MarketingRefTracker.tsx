"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureMarketerRef, tryClaimMarketerRef } from "@/app/lib/marketing";

/** لینک بازاریاب (?mref=) را ذخیره می‌کند و بعد از ثبت‌نام فروشگاه، آن را به نام بازاریاب ثبت می‌کند. */
export default function MarketingRefTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      void captureMarketerRef().finally(() => {
        if (!cancelled) void tryClaimMarketerRef();
      });
    };

    run();
    // بعد از لاگین/ثبت‌نام ممکن است توکن کمی دیرتر ست شود
    const t1 = window.setTimeout(run, 1500);
    const t2 = window.setTimeout(run, 6000);

    const onFocus = () => run();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("focus", onFocus);
    };
  }, [pathname]);

  return null;
}
