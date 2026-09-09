"use client";

import { Suspense, useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { APP_FONT_FAMILY } from "@/app/lib/appFont";
import { OilAuthProvider } from "./OilAuth";
import OilShell from "./OilShell";
import OilDailyReminderRunner from "./OilDailyReminderRunner";
import { OilInstallProvider } from "./OilInstall";
import { OilOfflineProvider } from "./OilOffline";
import "./oil.css";

const oilMuiTheme = createTheme({
  direction: "rtl",
  typography: { fontFamily: APP_FONT_FAMILY },
  palette: {
    mode: "dark",
    primary: { main: "#e8a317" },
    background: { default: "#101418", paper: "#1a222b" },
  },
});

function OilProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const origin = (
      process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoo-plus.ir"
    ).replace(/\/$/, "");
    const w = window as Window & {
      WEBINO_API_ORIGIN?: string;
      OIL?: { api?: string };
    };
    w.WEBINO_API_ORIGIN = origin;
    w.OIL = { ...(w.OIL || {}), api: `${origin}/api/oil` };
  }, []);
  return (
    <ThemeProvider theme={oilMuiTheme}>
      <OilAuthProvider>
        <div className="oil-app">
          <OilInstallProvider>
          <OilOfflineProvider>
          <OilDailyReminderRunner />
          <OilShell>{children}</OilShell>
          <ToastContainer
            position="top-center"
            autoClose={3500}
            hideProgressBar
            newestOnTop
            rtl
            theme="dark"
          />
          </OilOfflineProvider>
          </OilInstallProvider>
        </div>
      </OilAuthProvider>
    </ThemeProvider>
  );
}

export default function OilApp({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="oil-app">
          <div className="oil-wrap">
            <div className="oil-empty">در حال بارگذاری…</div>
          </div>
        </div>
      }
    >
      <OilProviders>{children}</OilProviders>
    </Suspense>
  );
}
