"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  ADMIN_THEME_STORAGE_KEY,
  AdminThemeMode,
  getAdminColors,
  type AdminColors,
} from "./adminTheme";
import "./admin-theme.css";

type AdminThemeContextValue = {
  mode: AdminThemeMode;
  colors: AdminColors;
  setMode: (mode: AdminThemeMode) => void;
  toggleMode: () => void;
};

export const AdminThemeContext = createContext<AdminThemeContextValue | null>(
  null
);

function readStoredMode(): AdminThemeMode {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

function buildMuiTheme(mode: AdminThemeMode) {
  const c = getAdminColors(mode);
  const isLight = mode === "light";

  return createTheme({
    direction: "rtl",
    palette: {
      mode: isLight ? "light" : "dark",
      primary: { main: c.accent, dark: c.accentHover },
      background: {
        default: isLight ? "#d8e2ea" : "#1a1d2e",
        paper: c.surface,
      },
      text: {
        primary: c.text,
        secondary: c.textMuted,
      },
      divider: c.border,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isLight ? "#d8e2ea" : undefined,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? "#f1f5f9" : c.surface,
            color: c.text,
            "& fieldset": {
              borderColor: c.border,
            },
            "&:hover fieldset": {
              borderColor: c.accent,
            },
            "&.Mui-focused fieldset": {
              borderColor: c.accent,
            },
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: "var(--admin-bottom-nav-bg)",
          },
        },
      },
    },
  });
}

export default function AdminThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setModeState] = useState<AdminThemeMode>(() =>
    typeof window !== "undefined" ? readStoredMode() : "dark"
  );
  useEffect(() => {
    document.documentElement.setAttribute("data-admin-theme", mode);
    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, mode);
  }, [mode]);

  const setMode = useCallback((next: AdminThemeMode) => {
    setModeState(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((m) => (m === "dark" ? "light" : "dark"));
  }, []);

  const colors = useMemo(() => getAdminColors(mode), [mode]);
  const muiTheme = useMemo(() => buildMuiTheme(mode), [mode]);

  const value = useMemo(
    () => ({ mode, colors, setMode, toggleMode }),
    [mode, colors, setMode, toggleMode]
  );

  return (
    <AdminThemeContext.Provider value={value}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AdminThemeContext.Provider>
  );
}
