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

const SHOP_CACHE_TTL_MS = 5 * 60_000;

type ShopCacheEntry = {
  shop: ShopInfo;
  storefront: OnlineStorefrontConfig;
  at: number;
};

const shopInfoCache = new Map<string, ShopCacheEntry>();
const categoriesCache = new Map<string, { categories: ShopCategory[]; at: number }>();

function resolveShopCode(
  paramShop: string | null,
  pathname: string | null,
): string | null {
  const raw = paramShop ?? getShopCodeFromPathname(pathname);
  if (!raw || SHOP_RESERVED_SEGMENTS.has(raw)) return null;
  return raw;
}

function readShopCache(code: string | null): ShopCacheEntry | null {
  if (!code) return null;
  const hit = shopInfoCache.get(code);
  if (!hit) return null;
  if (Date.now() - hit.at > SHOP_CACHE_TTL_MS) return null;
  return hit;
}

function readCategoriesCache(code: string | null): ShopCategory[] | null {
  if (!code) return null;
  const hit = categoriesCache.get(code);
  if (!hit) return null;
  if (Date.now() - hit.at > SHOP_CACHE_TTL_MS) return null;
  return hit.categories;
}

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

export function ShopProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const paramShop = typeof params?.shop === "string" ? params.shop : null;
  const shopCode = resolveShopCode(paramShop, pathname);

  const cachedShop = readShopCache(shopCode);
  const cachedCats = readCategoriesCache(shopCode);

  const [searchQuery, setSearchQuery] = useState("");
  const [shop, setShop] = useState<ShopInfo | null>(cachedShop?.shop ?? null);
  const [shopLoading, setShopLoading] = useState(!cachedShop && !!shopCode);
  const [shopError, setShopError] = useState<string | null>(null);
  const [storefront, setStorefront] = useState<OnlineStorefrontConfig>(
    cachedShop?.storefront ?? defaultOnlineStorefront(),
  );
  const [categories, setCategories] = useState<ShopCategory[]>(cachedCats ?? []);
  const [categoriesLoading, setCategoriesLoading] = useState(!cachedCats && !!shopCode);
  const fetchGen = useRef(0);
  const lastLoadedCode = useRef<string | null>(cachedShop || cachedCats ? shopCode : null);

  const shopPathFn = useCallback(
    (path = "") => (shopCode ? shopPath(shopCode, path) : path || "/"),
    [shopCode],
  );

  const shopApiFn = useCallback(
    (apiPath: string) => (shopCode ? shopApiPath(shopCode, apiPath) : apiPath),
    [shopCode],
  );

  const loadShopBundle = useCallback(async (code: string, force = false) => {
    const gen = ++fetchGen.current;

    const shopHit = !force ? readShopCache(code) : null;
    const catHit = !force ? readCategoriesCache(code) : null;

    if (shopHit) {
      setShop(shopHit.shop);
      setStorefront(shopHit.storefront);
      setShopError(null);
      setShopLoading(false);
    } else {
      setShopLoading(true);
    }

    if (catHit) {
      setCategories(catHit);
      setCategoriesLoading(false);
    } else {
      setCategoriesLoading(true);
    }

    if (shopHit && catHit) {
      lastLoadedCode.current = code;
      return;
    }

    try {
      const shopPromise = shopHit
        ? Promise.resolve(null)
        : apiRequestError("Get", {}, {}, shopApiPath(code, ""), false, true, "");
      const catPromise = catHit
        ? Promise.resolve(null)
        : apiRequestError(
            "Get",
            {},
            {},
            shopApiPath(code, "/api/category?tree=true"),
            false,
            false,
            "",
          );

      const [shopRes, catRes] = await Promise.all([shopPromise, catPromise]);
      if (gen !== fetchGen.current) return;

      if (shopRes) {
        if (shopRes.hasError) {
          const message =
            (typeof shopRes.message === "string" && shopRes.message) ||
            (shopRes.statusCode === 404 ? "فروشگاه یافت نشد" : "خطا در بارگذاری فروشگاه");
          setShop(null);
          setShopError(message);
          setStorefront(defaultOnlineStorefront());
        } else {
          const payload = shopRes as Record<string, unknown>;
          const sf = parseOnlineStorefront(payload);
          const nextShop: ShopInfo =
            payload?.shop && typeof payload.shop === "object"
              ? ({ ...(payload as object), ...(payload.shop as object) } as ShopInfo)
              : (payload as ShopInfo);
          setShop(nextShop);
          setStorefront(sf);
          setShopError(null);
          shopInfoCache.set(code, { shop: nextShop, storefront: sf, at: Date.now() });
        }
        setShopLoading(false);
      }

      if (catRes) {
        const parsed = parseCategoriesFromApi(catRes);
        setCategories(parsed);
        categoriesCache.set(code, { categories: parsed, at: Date.now() });
        setCategoriesLoading(false);
      }

      lastLoadedCode.current = code;
    } catch {
      if (gen !== fetchGen.current) return;
      if (!shopHit) {
        setShopError("خطا در ارتباط با سرور");
        setShop(null);
        setStorefront(defaultOnlineStorefront());
        setShopLoading(false);
      }
      if (!catHit) {
        setCategories([]);
        setCategoriesLoading(false);
      }
    }
  }, []);

  const refreshShop = useCallback(async () => {
    if (!shopCode) {
      setShop(null);
      setShopError(null);
      setStorefront(defaultOnlineStorefront());
      setShopLoading(false);
      return;
    }
    await loadShopBundle(shopCode, true);
  }, [shopCode, loadShopBundle]);

  const refreshCategories = useCallback(async () => {
    if (!shopCode) {
      setCategories([]);
      setCategoriesLoading(false);
      return;
    }
    categoriesCache.delete(shopCode);
    await loadShopBundle(shopCode, false);
  }, [shopCode, loadShopBundle]);

  useEffect(() => {
    if (!shopCode) {
      setShop(null);
      setShopError(null);
      setStorefront(defaultOnlineStorefront());
      setCategories([]);
      setShopLoading(false);
      setCategoriesLoading(false);
      lastLoadedCode.current = null;
      return;
    }
    if (lastLoadedCode.current === shopCode && readShopCache(shopCode) && readCategoriesCache(shopCode)) {
      return;
    }
    void loadShopBundle(shopCode, false);
  }, [shopCode, loadShopBundle]);

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

  // وقتی shopCode از context با resolved یکی است، همان توابع پایدار context را برگردان
  // تا وابستگی‌های useEffect (مثل fetch محصول) بی‌دلیل دوباره اجرا نشوند.
  if (ctx.shopCode && ctx.shopCode === resolved) {
    return {
      ...ctx,
      shopCode: resolved,
    };
  }

  return {
    ...ctx,
    shopCode: resolved,
    shopPath: shopPathFn,
    shopApi: shopApiFn,
    getCustomerToken: getCustomerTokenFn,
    clearCustomerSession: clearCustomerSessionFn,
  };
}
