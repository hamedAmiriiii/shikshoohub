"use client";

import { useEffect } from "react";
import { notifyShopAccessIfExpired } from "@/app/lib/shopAccess";

const API_HOST = (process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoplus.ir").replace(
  /\/$/,
  "",
);

function isApiUrl(url: string): boolean {
  return url.startsWith(API_HOST) || url.includes("api.webinoplus.ir");
}

export default function ShopAccessWatcher() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);

      try {
        const requestUrl =
          typeof args[0] === "string"
            ? args[0]
            : args[0] instanceof URL
              ? args[0].toString()
              : args[0] instanceof Request
                ? args[0].url
                : "";

        if (response.status === 403 && isApiUrl(requestUrl)) {
          const clone = response.clone();
          const text = await clone.text();
          try {
            const parsed = JSON.parse(text) as Record<string, unknown>;
            notifyShopAccessIfExpired({
              hasError: true,
              statusCode: 403,
              errorText: text,
              ...parsed,
            });
          } catch {
            notifyShopAccessIfExpired({
              hasError: true,
              statusCode: 403,
              errorText: text,
            });
          }
        }
      } catch {
        // ignore parse errors
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
