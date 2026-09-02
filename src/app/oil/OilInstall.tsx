"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type OilInstallValue = {
  installed: boolean;
  canInstall: boolean;
  install: () => Promise<void>;
};

const OilInstallContext = createContext<OilInstallValue | null>(null);

function isStandalone() {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const ios =
    "standalone" in window.navigator &&
    Boolean((window.navigator as { standalone?: boolean }).standalone);
  return media || ios;
}

export function OilInstallProvider({ children }: { children: React.ReactNode }) {
  const [installed, setInstalled] = useState(false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    setInstalled(isStandalone());

    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw-oil.js", { scope: "/oil" }).catch(() => {
      /* ignore */
    });

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

  const install = useCallback(async () => {
    if (installed || !promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setPromptEvent(null);
    }
  }, [installed, promptEvent]);

  const value = useMemo(
    () => ({ installed, canInstall: Boolean(promptEvent) && !installed, install }),
    [installed, promptEvent, install],
  );

  return <OilInstallContext.Provider value={value}>{children}</OilInstallContext.Provider>;
}

export function useOilInstall() {
  const ctx = useContext(OilInstallContext);
  if (!ctx) throw new Error("useOilInstall must be used within OilInstallProvider");
  return ctx;
}

export function OilInstallButton({
  variant = "banner",
}: {
  variant?: "banner" | "menu";
}) {
  const { canInstall, install } = useOilInstall();
  if (!canInstall) return null;

  if (variant === "menu") {
    return (
      <button type="button" className="oil-nav-item" onClick={() => void install()}>
        <Download size={18} />
        نصب برنامه
      </button>
    );
  }

  return null;
}
