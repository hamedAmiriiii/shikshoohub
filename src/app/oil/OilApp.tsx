"use client";

import { Suspense } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { APP_FONT_FAMILY } from "@/app/lib/appFont";
import { OilAuthProvider } from "./OilAuth";
import OilShell from "./OilShell";
import OilDailyReminderRunner from "./OilDailyReminderRunner";
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
  return (
    <ThemeProvider theme={oilMuiTheme}>
      <OilAuthProvider>
        <div className="oil-app">
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
