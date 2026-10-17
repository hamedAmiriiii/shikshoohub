"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  SHOP_RESERVED_SEGMENTS,
  type ShopInfo,
} from "@/app/lib/shopStorefront";
import {
  defaultOnlineStorefront,
  filterHiddenCategories,
  parseOnlineStorefront,
  type OnlineStorefrontConfig,
} from "@/app/lib/onlineStorefront";
import {
  parseCategoriesFromApi,
  type ShopCategory,
} from "@/app/lib/shopCategories";

const SHOP_CACHE_TTL_MS = 60_000;

type ShopCacheEntry = {
  shop: ShopInfo;
  storefront: OnlineStorefrontConfig;
  at: number;
};

const shopInfoCache = new Map<string, ShopCacheEntry>();
const categoriesCache = new Map<string, { categories: ShopCategory[]; at: number }>();

interface ShopContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  shopCode: string | null;
  shop: ShopInfo | null;
  shopLoading: boolean;
  shopError: string | null;
  storefront: OnlineStorefrontConfig;
  primaryColor: string;
  logoUrl: string | null;
  shopDisplayName: string;
  categories: ShopCategory[];
  visibleCategories: ShopCategory[];
  categoriesLoading: boolean;
  shopPath: (path?: string) => string;
  shopApi: (apiPath: string) => string;
  getCustomerToken: () => string | null;
  clearCustomerSession: () => void;
  refreshShop: () => Promise<void>;
  refreshCategories: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

function extractStorefront(res: Record<string, unknown>): OnlineStorefrontConfig {
  return parseOnlineStorefront(res);
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const paramShop = typeof params?.shop === "string" ? params.shop : null;
  const rawShop = paramShop ?? getShopCodeFromPathname(pathname);
  const shopCode =
    rawShop && SHOP_RESERVED_SEGMENTS.has(rawShop) ? null : rawShop;

  const [searchQuery, setSearchQuery] = useState("");
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopError, setShopError] = useState<string | null>(null);
  const [storefront, setStorefront] = useState<OnlineStorefrontConfig>(defaultOnlineStorefront());
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const shopFetchGen = useRef(0);

  const shopPathFn = useCallback(
    (path = "") => (shopCode ? shopPath(shopCode, path) : path || "/"),
    [shopCode],
  );

  const shopApiFn = useCallback(
    (apiPath: string) => (shopCode ? shopApiPath(shopCode, apiPath) : apiPath),
    [shopCode],
  );

  const refreshShop = useCallback(async () => {
    if (!shopCode) {
      setShop(null);
      setShopError(null);
      setStorefront(defaultOnlineStorefront());
      return;
    }

    const cached = shopInfoCache.get(shopCode);
    if (cached && Date.now() - cached.at < SHOP_CACHE_TTL_MS) {
      setShop(cached.shop);
      setStorefront(cached.storefront);
      setShopError(null);
      setShopLoading(false);
      return;
    }

    const gen = ++shopFetchGen.current;
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

      if (gen !== shopFetchGen.current) return;

      if (res.hasError) {
        const message =
          (typeof res.message === "string" && res.message) ||
          (res.statusCode === 404 ? "فروشگاه یافت نشد" : "خطا در بارگذاری فروشگاه");
        setShop(null);
        setShopError(message);
        setStorefront(defaultOnlineStorefront());
        return;
      }

      const payload = res as Record<string, unknown>;
      const sf = extractStorefront(payload);
      let nextShop: ShopInfo;
      if (payload?.shop && typeof payload.shop === "object") {
        nextShop = {
          ...(typeof payload === "object" ? payload : {}),
          ...(payload.shop as object),
        } as ShopInfo;
      } else {
        nextShop = payload as ShopInfo;
      }

      setShop(nextShop);
      setStorefront(sf);
      shopInfoCache.set(shopCode, { shop: nextShop, storefront: sf, at: Date.now() });
    } catch {
      if (gen !== shopFetchGen.current) return;
      setShopError("خطا در ارتباط با سرور");
      setShop(null);
      setStorefront(defaultOnlineStorefront());
    } finally {
      if (gen === shopFetchGen.current) setShopLoading(false);
    }
  }, [shopCode]);

  const refreshCategories = useCallback(async () => {
    if (!shopCode) {
      setCategories([]);
      setCategoriesLoading(false);
      return;
    }

    const cached = categoriesCache.get(shopCode);
    if (cached && Date.now() - cached.at < SHOP_CACHE_TTL_MS) {
      setCategories(cached.categories);
      setCategoriesLoading(false);
      return;
    }

    setCategoriesLoading(true);
    try {
      const res = await apiRequestError(
        "Get",
        {},
        {},
        shopApiPath(shopCode, "/api/category?tree=true"),
        false,
        false,
        "",
      );
      const parsed = parseCategoriesFromApi(res);
      setCategories(parsed);
      categoriesCache.set(shopCode, { categories: parsed, at: Date.now() });
    } catch {
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, [shopCode]);

  useEffect(() => {
    void refreshShop();
  }, [refreshShop]);

  useEffect(() => {
    void refreshCategories();
  }, [refreshCategories]);

  useEffect(() => {
    setCartShopCode(shopCode);
    if (shopCode) saveLastShopCode(shopCode);
    return () => setCartShopCode(null);
  }, [shopCode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty(
      "--shop-primary",
      storefront.primary_color || "#ef4056",
    );
  }, [storefront.primary_color]);

  const visibleCategories = useMemo(
    () => filterHiddenCategories(categories, storefront.hidden_category_ids),
    [categories, storefront.hidden_category_ids],
  );

  const shopDisplayName =
    (typeof shop?.name === "string" && shop.name.trim()) ||
    shopCode ||
    "فروشگاه";

  const value = useMemo<ShopContextType>(
    () => ({
      searchQuery,
      setSearchQuery,
      shopCode,
      shop,
      shopLoading,
      shopError,
      storefront,
      primaryColor: storefront.primary_color,
      logoUrl: storefront.logo_url,
      shopDisplayName,
      categories,
      visibleCategories,
      categoriesLoading,
      shopPath: shopPathFn,
      shopApi: shopApiFn,
      getCustomerToken: () => (shopCode ? getCustomerToken(shopCode) : null),
      clearCustomerSession: () => {
        if (shopCode) clearCustomerSession(shopCode);
      },
      refreshShop,
      refreshCategories,
    }),
    [
      searchQuery,
      shopCode,
      shop,
      shopLoading,
      shopError,
      storefront,
      shopDisplayName,
      categories,
      visibleCategories,
      categoriesLoading,
      shopPathFn,
      shopApiFn,
      refreshShop,
      refreshCategories,
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
