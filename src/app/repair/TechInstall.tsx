"use client";

import { useEffect, useReducer, useState } from "react";
import { Alert, Button } from "@mui/material";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

/** رویداد نصب را زود می‌گیرد و service worker اپ تعمیرکاران را ثبت می‌کند. */
export function initTechApp() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    emit();
  });
  if ("serviceWorker" in navigator) {
    void navigator.serviceWorker.register("/sw-repair-tech.js", { scope: "/repair/tech" }).catch(() => {
      /* ignore */
    });
  }
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function useTechInstall() {
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const [standalone, setStandalone] = useState(true);

  useEffect(() => {
    initTechApp();
    setStandalone(isStandalone());
    listeners.add(rerender);
    return () => {
      listeners.delete(rerender);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      deferredPrompt = null;
      emit();
    }
  };

  return {
    canInstall: !standalone && Boolean(deferredPrompt),
    showIosHint: !standalone && isIos(),
    install,
  };
}

export function TechInstallButton({ fullWidth = false }: { fullWidth?: boolean }) {
  const { canInstall, showIosHint, install } = useTechInstall();
  if (canInstall) {
    return (
      <Button variant="outlined" startIcon={<InstallMobileIcon />} onClick={() => void install()} fullWidth={fullWidth}>
        نصب اپ تعمیرکاران
      </Button>
    );
  }
  if (showIosHint && fullWidth) {
    return (
      <Alert severity="info" icon={<InstallMobileIcon />}>
        برای نصب اپ: در سافاری دکمهٔ «اشتراک‌گذاری» و بعد «Add to Home Screen» را بزنید.
      </Alert>
    );
  }
  return null;
}
