"use client";

import { notifyShopAccessIfExpired } from "@/app/lib/shopAccess";
import { trackApiCall } from "@/app/lib/trackApiCall";
import { apiRequestError as apiRequestErrorServer } from "./index";

type ApiRequestErrorFn = typeof apiRequestErrorServer;

export const apiRequestError: ApiRequestErrorFn = async (...args) => {
  const res = await apiRequestErrorServer(...args);
  if (res && typeof res === "object") {
    notifyShopAccessIfExpired(res as Record<string, unknown>);
  }
  trackApiCall(String(args[0] || "Get"), String(args[3] || ""), res);
  return res;
};
