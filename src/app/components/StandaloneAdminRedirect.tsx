"use client";

import { useEffect } from "react";

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const ios = "standalone" in window.navigator && Boolean((window.navigator as { standalone?: boolean }).standalone);
  return media || ios;
}

/**
 * اپ‌های قدیمی با start_url=/ وقتی / هنوز صندوق بود نصب شده‌اند.
 * اگر همان آیکون را باز کنند و توکن ادمین داشته باشند، به /admin می‌روند.
 * در تب معمولی مرورگر لندینگ دست نمی‌خورد.
 */
export default function StandaloneAdminRedirect() {
  useEffect(() => {
    if (!isStandaloneDisplay()) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    window.location.replace("/admin");
  }, []);

  return null;
}
