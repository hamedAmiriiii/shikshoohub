"use client";

import { useEffect, useState } from "react";
import { Alert, Button } from "@mui/material";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  const ios = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return window.matchMedia("(display-mode: standalone)").matches || ios;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/** نصب اپ تعمیرکاران (PWA جدا با scope /repair/tech). */
export function useTechAppInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(true);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIos());

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw-repair-tech.js", { scope: "/repair/tech" }).catch(() => undefined);
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setPromptEvent(null);
    }
  };

  return { installed, canInstall: Boolean(promptEvent) && !installed, showIosHint: ios && !installed, install };
}

export function TechInstallBanner() {
  const { canInstall, showIosHint, install } = useTechAppInstall();

  if (canInstall) {
    return (
      <Button fullWidth variant="outlined" startIcon={<InstallMobileIcon />} onClick={() => void install()}>
        نصب اپ تعمیرکاران روی گوشی
      </Button>
    );
  }
  if (showIosHint) {
    return (
      <Alert severity="info" icon={<InstallMobileIcon />}>
        برای نصب اپ: در سافاری دکمهٔ «اشتراک‌گذاری» را بزنید و «Add to Home Screen» را انتخاب کنید.
      </Alert>
    );
  }
  return null;
}
