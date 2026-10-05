"use client";

import { GlobalStyles } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { APP_FONT_FAMILY } from "@/app/lib/appFont";
import { RepairAuthProvider } from "./RepairAuth";
import RepairShell from "./RepairShell";
import RepairSplash from "./RepairSplash";

const repairTheme = createTheme({
  direction: "rtl",
  typography: { fontFamily: APP_FONT_FAMILY },
  shape: { borderRadius: 10 },
  palette: {
    primary: { main: "#2563eb" },
    secondary: { main: "#7c3aed" },
    background: { default: "#f4f6fb" },
    text: { primary: "#0f172a", secondary: "#475569" },
  },
});

/** globals.css متن body را روشن (برای سایت تیره) می‌گذارد؛ اپ تعمیرکار تم روشن است. */
const repairGlobalStyles = (
  <GlobalStyles
    styles={{
      "html[lang] body": { color: "#0f172a", backgroundColor: "#f4f6fb" },
    }}
  />
);

export default function RepairApp({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={repairTheme}>
      {repairGlobalStyles}
      <RepairAuthProvider>
        <RepairShell>{children}</RepairShell>
        <RepairSplash />
        <ToastContainer position="top-center" autoClose={3500} hideProgressBar newestOnTop rtl />
      </RepairAuthProvider>
    </ThemeProvider>
  );
}
