"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PWAHead() {
  const pathname = usePathname() || "";
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isOil = pathname === "/oil" || pathname.startsWith("/oil/");

  useEffect(() => {
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!manifestLink) {
      manifestLink = document.createElement("link");
      manifestLink.rel = "manifest";
      document.head.appendChild(manifestLink);
    }

    let appleTouch = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
    if (!appleTouch) {
      appleTouch = document.createElement("link");
      appleTouch.rel = "apple-touch-icon";
      document.head.appendChild(appleTouch);
    }
    appleTouch.href = "/icon-192.png";

    let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!themeColor) {
      themeColor = document.createElement("meta");
      themeColor.name = "theme-color";
      document.head.appendChild(themeColor);
    }

    let appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]') as HTMLMetaElement | null;
    if (!appleCapable) {
      appleCapable = document.createElement("meta");
      appleCapable.name = "apple-mobile-web-app-capable";
      document.head.appendChild(appleCapable);
    }
    appleCapable.content = "yes";

    let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement | null;
    if (!appleStatusBar) {
      appleStatusBar = document.createElement("meta");
      appleStatusBar.name = "apple-mobile-web-app-status-bar-style";
      document.head.appendChild(appleStatusBar);
    }
    appleStatusBar.content = "default";

    let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;
    if (!appleTitle) {
      appleTitle = document.createElement("meta");
      appleTitle.name = "apple-mobile-web-app-title";
      document.head.appendChild(appleTitle);
    }

    if (isAdmin) {
      manifestLink.href = "/manifest-admin.json";
      themeColor.content = "#1f9ad1";
      appleTitle.content = "Webino";
      return;
    }

    if (isOil) {
      manifestLink.href = "/manifest-oil.json";
      themeColor.content = "#101418";
      appleTitle.content = "تعویض روغن";
      return;
    }

    manifestLink.href = "/manifest.json";
    themeColor.content = "#1f9ad1";
    appleTitle.content = "وبینو";
  }, [isAdmin, isOil]);

  return null;
}
