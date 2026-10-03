"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  clearRepairSession,
  getRepairToken,
  getRepairUser,
  isRepairError,
  repairApi,
  saveRepairSession,
  type RepairPublicConfig,
  type RepairSessionUser,
} from "@/app/lib/repair/api";

type RepairAuthValue = {
  user: RepairSessionUser | null;
  ready: boolean;
  config: RepairPublicConfig | null;
  login: (token: string, user: RepairSessionUser) => void;
  setUser: (user: RepairSessionUser) => void;
  logout: () => Promise<void>;
};

const RepairAuthContext = createContext<RepairAuthValue | null>(null);

export function RepairAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<RepairSessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState<RepairPublicConfig | null>(null);

  useEffect(() => {
    setUserState(getRepairUser());
    setReady(true);
    void repairApi.config().then((res) => {
      if (!isRepairError(res)) setConfig(res);
    });
    if (getRepairToken()) {
      void repairApi.me().then((res) => {
        if (!isRepairError(res)) {
          saveRepairSession(null, res.user);
          setUserState(res.user);
        }
      });
    }
  }, []);

  const login = useCallback((token: string, next: RepairSessionUser) => {
    saveRepairSession(token, next);
    setUserState(next);
  }, []);

  const setUser = useCallback((next: RepairSessionUser) => {
    saveRepairSession(null, next);
    setUserState(next);
  }, []);

  const logout = useCallback(async () => {
    await repairApi.logout();
    clearRepairSession();
    setUserState(null);
  }, []);

  return (
    <RepairAuthContext.Provider value={{ user, ready, config, login, setUser, logout }}>
      {children}
    </RepairAuthContext.Provider>
  );
}

export function useRepairAuth() {
  const ctx = useContext(RepairAuthContext);
  if (!ctx) throw new Error("useRepairAuth must be used inside RepairAuthProvider");
  return ctx;
}
