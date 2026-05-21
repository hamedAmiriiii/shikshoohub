"use client";

import { notifyShopAccessIfExpired } from "@/app/lib/shopAccess";
import { apiRequestError as apiRequestErrorServer } from "./index";

type ApiRequestErrorFn = typeof apiRequestErrorServer;

export const apiRequestError: ApiRequestErrorFn = async (...args) => {
  const res = await apiRequestErrorServer(...args);
  if (res && typeof res === "object") {
    notifyShopAccessIfExpired(res as Record<string, unknown>);
  }
  return res;
};
