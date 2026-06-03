"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useParams, usePathname } from "next/navigation";
import { apiRequestError } from "@/app/lib/apiRequestError";
import { setCartShopCode } from "@/app/liberari/cart";
import {
  clearCustomerSession,
  getCustomerToken,
  getLastShopCode,
  getShopCodeFromPathname,
  saveLastShopCode,
  shopApiPath,
  shopPath,
  type ShopInfo,
} from "@/app/lib/shopStorefront";

interface ShopContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  shopCode: string | null;
  shop: ShopInfo | null;
  shopLoading: boolean;
  shopError: string | null;
  shopPath: (path?: string) => string;
  shopApi: (apiPath: string) => string;
  getCustomerToken: () => string | null;
  clearCustomerSession: () => void;
  refreshShop: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const paramShop = typeof params?.shop === "string" ? params.shop : null;
  const shopCode = paramShop ?? getShopCodeFromPathname(pathname);

  const [searchQuery, setSearchQuery] = useState("");
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopError, setShopError] = useState<string | null>(null);

  const shopPathFn = useCallback(
    (path = "") => (shopCode ? shopPath(shopCode, path) : path || "/"),
    [shopCode],
  );

  const shopApiFn = useCallback(
    (apiPath: string) => (shopCode ? shopApiPath(shopCode, apiPath) : apiPath),
    [shopCode],
  );

  const refreshShop = useCallback(async () => {
    console.log("[ShopContext] refreshShop:start", { shopCode, pathname });
    if (!shopCode) {
      console.log("[ShopContext] refreshShop:skip-no-shopCode");
      setShop(null);
      setShopError(null);
      return;
    }
    setShopLoading(true);
    setShopError(null);
    try {
      const res = await apiRequestError(
        "Get",
        {},
        {},
        shopApiPath(shopCode, ""),
        false,
        true,
        "",
      );
      console.log("[ShopContext] refreshShop:response", res);
      
      if (res.hasError) {
        const message =
          (typeof res.message === "string" && res.message) ||
          (res.statusCode === 404 ? "فروشگاه یافت نشد" : "خطا در بارگذاری فروشگاه");
        console.warn("[ShopContext] refreshShop:api-error", {
          statusCode: res.statusCode,
          message,
        });
        setShop(null);
        setShopError(message);
        return;
      }
      setShop(res as ShopInfo);
      console.log("[ShopContext] refreshShop:success");
    } catch (error) {
      console.error("[ShopContext] refreshShop:catch", error);
      setShopError("خطا در ارتباط با سرور");
      setShop(null);
    } finally {
      console.log("[ShopContext] refreshShop:finally");
      setShopLoading(false);
    }
  }, [shopCode, pathname]);

  useEffect(() => {
    refreshShop();
  }, [refreshShop]);

  useEffect(() => {
    setCartShopCode(shopCode);
    if (shopCode) saveLastShopCode(shopCode);
    return () => setCartShopCode(null);
  }, [shopCode]);

  const value = useMemo<ShopContextType>(
    () => ({
      searchQuery,
      setSearchQuery,
      shopCode,
      shop,
      shopLoading,
      shopError,
      shopPath: shopPathFn,
      shopApi: shopApiFn,
      getCustomerToken: () => (shopCode ? getCustomerToken(shopCode) : null),
      clearCustomerSession: () => {
        if (shopCode) clearCustomerSession(shopCode);
      },
      refreshShop,
    }),
    [
      searchQuery,
      shopCode,
      shop,
      shopLoading,
      shopError,
      shopPathFn,
      shopApiFn,
      refreshShop,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShopContext() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error("useShopContext must be used within a ShopProvider");
  }
  return context;
}

/**
 * ویترین فروشگاه — shopCode از URL یا آخرین فروشگاه بازدیدشده.
 * اگر هیچ‌کدام نبود shopCode برابر null است (صفحه باید ریدایرکت یا picker نشان دهد).
 */
export function useShopStorefront() {
  const ctx = useShopContext();
  const resolved =
    ctx.shopCode ??
    (typeof window !== "undefined" ? getLastShopCode() : null);

  const shopPathFn = useCallback(
    (path = "") => (resolved ? shopPath(resolved, path) : path || "/"),
    [resolved],
  );

  const shopApiFn = useCallback(
    (apiPath: string) => (resolved ? shopApiPath(resolved, apiPath) : apiPath),
    [resolved],
  );

  const getCustomerTokenFn = useCallback(
    () => (resolved ? getCustomerToken(resolved) : null),
    [resolved],
  );

  const clearCustomerSessionFn = useCallback(() => {
    if (resolved) clearCustomerSession(resolved);
  }, [resolved]);

  return {
    ...ctx,
    shopCode: resolved,
    shopPath: shopPathFn,
    shopApi: shopApiFn,
    getCustomerToken: getCustomerTokenFn,
    clearCustomerSession: clearCustomerSessionFn,
  };
}
