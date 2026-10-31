"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type BilliardThemeMode = "day" | "night";

const STORAGE_KEY = "billiard-theme";

type ThemeCtx = {
  mode: BilliardThemeMode;
  setMode: (mode: BilliardThemeMode) => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

export function BilliardThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<BilliardThemeMode>("night");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "day" || saved === "night") setModeState(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode: (next: BilliardThemeMode) => setModeState(next),
    }),
    [mode],
  );

  return (
    <Ctx.Provider value={value}>
      <div className={`billiard-app${mode === "day" ? " theme-day" : ""}`} dir="rtl">
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function useBilliardTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBilliardTheme outside provider");
  return ctx;
}
