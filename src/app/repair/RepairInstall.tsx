"use client";

import { useEffect, useReducer, useState } from "react";
import { Alert, Button, IconButton, Tooltip } from "@mui/material";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";
import { isTechAppPath } from "@/app/lib/repair/api";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type RepairPwaApp = "customer" | "technician";

const SERVICE_WORKERS: Record<RepairPwaApp, { url: string; scope: string }> = {
  customer: { url: "/sw-repair.js", scope: "/repair" },
  technician: { url: "/sw-repair-tech.js", scope: "/repair/tech" },
};

const APP_LABELS: Record<RepairPwaApp, string> = {
  customer: "نصب اپ روی گوشی",
  technician: "نصب اپ تعمیرکاران",
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listening = false;
const listeners = new Set<() => void>();
const registered = new Set<RepairPwaApp>();

function emit() {
  listeners.forEach((fn) => fn());
}

function startListening() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    emit();
  });
}

function registerServiceWorker(app: RepairPwaApp) {
  if (registered.has(app) || !("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
  registered.add(app);
  const { url, scope } = SERVICE_WORKERS[app];
  void navigator.serviceWorker.register(url, { scope }).catch(() => registered.delete(app));
}

export function repairPwaAppFor(pathname: string | null | undefined): RepairPwaApp {
  return isTechAppPath(pathname) ? "technician" : "customer";
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

/** باید زود (در شل اپ) صدا زده شود تا رویداد نصب از دست نرود. */
export function useRepairPwa(pathname: string | null | undefined) {
  const app = repairPwaAppFor(pathname);
  useEffect(() => {
    startListening();
    registerServiceWorker(app);
  }, [app]);
}

export function useRepairInstall() {
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const [standalone, setStandalone] = useState(true);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    startListening();
    setStandalone(isStandalone());
    setIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
    listeners.add(rerender);
    return () => {
      listeners.delete(rerender);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    const promptEvent = deferredPrompt;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") {
      deferredPrompt = null;
      setStandalone(true);
      emit();
    }
  };

  return {
    canInstall: !standalone && Boolean(deferredPrompt),
    showIosHint: !standalone && ios,
    install,
  };
}

export function RepairInstallBanner({ app }: { app: RepairPwaApp }) {
  const { canInstall, showIosHint, install } = useRepairInstall();

  if (canInstall) {
    return (
      <Button fullWidth variant="outlined" startIcon={<InstallMobileIcon />} onClick={() => void install()}>
        {APP_LABELS[app]}
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

export function RepairInstallIconButton() {
  const { canInstall, install } = useRepairInstall();
  if (!canInstall) return null;
  return (
    <Tooltip title="نصب اپ">
      <IconButton size="small" color="primary" onClick={() => void install()}>
        <InstallMobileIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
