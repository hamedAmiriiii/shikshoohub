"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function isOilPath(pathname: string) {
  return pathname === "/oil" || pathname.startsWith("/oil/");
}

export default function ServiceWorkerRegistration() {
  const pathname = usePathname() || "";
  const isOil = isOilPath(pathname);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (isOil) {
      return;
    }

    const hadController = Boolean(navigator.serviceWorker.controller);

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        console.log("Service Worker registered:", registration.scope);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              if (confirm("نسخه جدیدی از اپلیکیشن موجود است. صفحه به‌روز شود؟")) {
                newWorker.postMessage({ type: "SKIP_WAITING" });
                window.location.reload();
              }
            }
          });
        });
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    };

    if (process.env.NODE_ENV === "production") {
      if (document.readyState === "complete") {
        void registerSW();
      } else {
        window.addEventListener("load", registerSW, { once: true });
      }
    } else {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      void caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }

    const onControllerChange = () => {
      if (hadController) window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, [isOil]);

  return null;
}
