"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureMarketerRef, tryClaimMarketerRef } from "@/app/lib/marketing";

/** لینک بازاریاب (?mref=) را ذخیره می‌کند و بعد از ثبت‌نام فروشگاه، آن را به نام بازاریاب ثبت می‌کند. */
export default function MarketingRefTracker() {
  const pathname = usePathname();

  useEffect(() => {
    void captureMarketerRef().finally(() => {
      void tryClaimMarketerRef();
    });
  }, [pathname]);

  return null;
}
