"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Download, Share, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type OilInstallValue = {
  installed: boolean;
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

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return ios && safari;
}

export function OilInstallProvider({ children }: { children: React.ReactNode }) {
  const [installed, setInstalled] = useState(false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [hint, setHint] = useState<"ios" | "browser" | null>(null);

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
      setHint(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (installed) return;
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setPromptEvent(null);
      }
      return;
    }
    setHint(isIosSafari() ? "ios" : "browser");
  }, [installed, promptEvent]);

  const value = useMemo(
    () => ({ installed, install }),
    [installed, install],
  );

  return (
    <OilInstallContext.Provider value={value}>
      {children}
      {hint && (
        <button
          type="button"
          className="oil-drawer-backdrop"
          aria-label="بستن"
          onClick={() => setHint(null)}
        />
      )}
      {hint && (
        <div className="oil-modal-backdrop" style={{ zIndex: 70, pointerEvents: "none" }}>
          <div className="oil-modal" style={{ pointerEvents: "auto", position: "relative" }}>
            <button
              type="button"
              className="oil-icon-btn"
              aria-label="بستن"
              onClick={() => setHint(null)}
              style={{ position: "absolute", top: 10, left: 10 }}
            >
              <X size={18} />
            </button>
            <strong style={{ display: "block", marginBottom: 10 }}>نصب برنامه تعویض روغن</strong>
            {hint === "ios" ? (
              <p className="oil-muted" style={{ margin: 0, lineHeight: 1.8 }}>
                در سافاری دکمه <Share size={14} style={{ display: "inline", verticalAlign: "middle" }} /> اشتراک‌گذاری را بزن، بعد «Add to Home Screen» / «افزودن به صفحه اصلی» را انتخاب کن.
              </p>
            ) : (
              <p className="oil-muted" style={{ margin: 0, lineHeight: 1.8 }}>
                از منوی مرورگر (سه نقطه) گزینه «Install app» یا «نصب برنامه» را بزن.
              </p>
            )}
          </div>
        </div>
      )}
    </OilInstallContext.Provider>
  );
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
  const { installed, install } = useOilInstall();
  if (installed) return null;

  if (variant === "menu") {
    return (
      <button type="button" className="oil-nav-item" onClick={() => void install()}>
        <Download size={18} />
        نصب برنامه
      </button>
    );
  }

  return (
   <></>
  );
}
