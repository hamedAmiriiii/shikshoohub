"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { runOilRemindersForToday } from "@/app/lib/oil/reminders";
import { useOilAuth } from "./OilAuth";

/** با اولین باز شدن اپ در روز، یادآوری را بی‌صدا می‌فرستد */
export default function OilDailyReminderRunner() {
  const pathname = usePathname();
  const { ready, session } = useOilAuth();

  useEffect(() => {
    if (!ready || !session?.shop?.id) return;
    if (pathname === "/oil/login") return;
    void runOilRemindersForToday(session.shop.id);
  }, [pathname, ready, session]);

  return null;
}
