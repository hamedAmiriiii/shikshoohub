"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Snackbar } from "@mui/material";
import GetAppIcon from "@mui/icons-material/GetApp";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PWAInstallPrompt() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    const onInstalled = () => {
      deferredPromptRef.current = null;
      setCanInstall(false);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) {
      setSnackMessage(
        "در Chrome از منو (⋮) گزینه «نصب Webino» یا «Install app» را بزنید. حتماً با HTTPS و build/production تست کنید."
      );
      setSnackOpen(true);
      return;
    }

    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    deferredPromptRef.current = null;
    setCanInstall(false);

    if (outcome === "accepted") {
      setSnackMessage("در حال نصب اپلیکیشن...");
    } else {
      setSnackMessage("نصب لغو شد.");
    }
    setSnackOpen(true);
  };

  if (isStandalone || !canInstall) {
    return (
      <Snackbar
        open={snackOpen}
        autoHideDuration={5000}
        onClose={() => setSnackOpen(false)}
        message={snackMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    );
  }

  return (
    <>
      <Button
        onClick={handleInstall}
        variant="contained"
        size="small"
        startIcon={<GetAppIcon />}
        sx={{
          position: "fixed",
          bottom: { xs: 72, md: 24 },
          left: 16,
          zIndex: 1300,
          borderRadius: "12px",
          bgcolor: "#1f9ad1",
          fontWeight: 600,
          boxShadow: "0 4px 16px rgba(31,154,209,0.45)",
          "&:hover": { bgcolor: "#178bb8" },
        }}
      >
        نصب اپ
      </Button>
      <Snackbar
        open={snackOpen}
        autoHideDuration={5000}
        onClose={() => setSnackOpen(false)}
        message={snackMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  );
}
