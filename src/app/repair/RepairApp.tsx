"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { APP_FONT_FAMILY } from "@/app/lib/appFont";
import { RepairAuthProvider } from "./RepairAuth";
import RepairShell from "./RepairShell";

const repairTheme = createTheme({
  direction: "rtl",
  typography: { fontFamily: APP_FONT_FAMILY },
  shape: { borderRadius: 10 },
  palette: {
    primary: { main: "#2563eb" },
    secondary: { main: "#7c3aed" },
    background: { default: "#f4f6fb" },
  },
});

export default function RepairApp({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={repairTheme}>
      <RepairAuthProvider>
        <RepairShell>{children}</RepairShell>
        <ToastContainer position="top-center" autoClose={3500} hideProgressBar newestOnTop rtl />
      </RepairAuthProvider>
    </ThemeProvider>
  );
}
