import {
  cartStorageKey,
  getCustomerToken as getShopCustomerToken,
  getLastShopCode,
  shopApiPath,
} from "@/app/lib/shopStorefront";

export interface CartItem {
  id: number;
  name: string;
  sale_price: string;
  original_sale_price?: string;
  discount_percent?: number;
  quantity: number;
  image?: string;
  images?: any[];
  size?: string | null;
  color?: string | null;
}

const LEGACY_CART_KEY = "shikshoo_cart";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoplus.ir";

let activeShopCode: string | null = null;
const syncTimers = new Map<string, ReturnType<typeof setTimeout>>();
const syncInFlight = new Map<string, boolean>();

export function setCartShopCode(shopCode: string | null): void {
  activeShopCode = shopCode;
}

function cartProductsPayload(cart: CartItem[]) {
  return cart.map((item) => ({
    product_id: item.id,
    quantity: item.quantity,
    ...(item.size && { size: item.size }),
    ...(item.color && { color: item.color }),
  }));
}

function resolveShopCode(shopCode?: string | null): string | null {
  return shopCode ?? activeShopCode ?? getLastShopCode();
}

function storageKey(shopCode?: string | null): string {
  const code = resolveShopCode(shopCode);
  return code ? cartStorageKey(code) : LEGACY_CART_KEY;
}

function getToken(shopCode?: string | null): string | null {
  const code = resolveShopCode(shopCode);
  if (code) return getShopCustomerToken(code);
  if (typeof window === "undefined") return null;
  return localStorage.getItem("customer_token");
}

/** همگام‌سازی سبد با سرور — با debounce تا درخواست پشت‌سرهم نزند */
export const syncCartWithServer = (
  shopCode?: string | null,
  debounceMs = 400,
): Promise<void> => {
  const code = resolveShopCode(shopCode);
  if (!code) return Promise.resolve();

  const existing = syncTimers.get(code);
  if (existing) clearTimeout(existing);

  return new Promise((resolve) => {
    const timer = setTimeout(async () => {
      syncTimers.delete(code);
      if (syncInFlight.get(code)) {
        resolve();
        return;
      }
      const token = getToken(code);
      if (!token) {
        resolve();
        return;
      }

      syncInFlight.set(code, true);
      const products = cartProductsPayload(getCart(code));

      try {
        const response = await fetch(`${BASE_URL}${shopApiPath(code, "/api/cart")}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ products }),
        });

        if (!response.ok) {
          console.error("Error syncing cart with server:", response.status);
        }
      } catch (error) {
        console.error("Error syncing cart with server:", error);
      } finally {
        syncInFlight.set(code, false);
        resolve();
      }
    }, debounceMs);
    syncTimers.set(code, timer);
  });
};

export const getCart = (shopCode?: string | null): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const key = storageKey(shopCode);
    const cart = localStorage.getItem(key);
    if (cart) return JSON.parse(cart);
    if (key !== LEGACY_CART_KEY) {
      const legacy = localStorage.getItem(LEGACY_CART_KEY);
      return legacy ? JSON.parse(legacy) : [];
    }
    return [];
  } catch (error) {
    console.error("Error getting cart:", error);
    return [];
  }
};

export const addToCart = (
  product: {
    id: number;
    name: string;
    sale_price: string | number;
    original_sale_price?: string;
    discount_percent?: number;
    image?: string;
    images?: any[];
    size?: string | null;
    color?: string | null;
  },
  shopCode?: string | null,
): CartItem[] => {
  const cart = getCart(shopCode);
  const existingItemIndex = cart.findIndex(
    (item) =>
      item.id === product.id &&
      item.size === (product.size || null) &&
      item.color === (product.color || null),
  );

  if (existingItemIndex >= 0) {
    cart[existingItemIndex].quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      sale_price:
        typeof product.sale_price === "string"
          ? product.sale_price
          : product.sale_price.toString(),
      original_sale_price: product.original_sale_price,
      discount_percent: product.discount_percent,
      quantity: 1,
      image: product.image,
      images: product.images,
      size: product.size || null,
      color: product.color || null,
    });
  }

  localStorage.setItem(storageKey(shopCode), JSON.stringify(cart));
  syncCartWithServer(shopCode).catch((err) => console.error("Error syncing cart:", err));
  return cart;
};

export const removeFromCart = (productId: number, shopCode?: string | null): CartItem[] => {
  const cart = getCart(shopCode);
  const newCart = cart.filter((item) => item.id !== productId);
  localStorage.setItem(storageKey(shopCode), JSON.stringify(newCart));
  syncCartWithServer(shopCode).catch((err) => console.error("Error syncing cart:", err));
  return newCart;
};

export const updateCartItemQuantity = (
  productId: number,
  quantity: number,
  shopCode?: string | null,
): CartItem[] => {
  const cart = getCart(shopCode);
  const itemIndex = cart.findIndex((item) => item.id === productId);

  if (itemIndex >= 0) {
    if (quantity <= 0) {
      return removeFromCart(productId, shopCode);
    }
    cart[itemIndex].quantity = quantity;
    localStorage.setItem(storageKey(shopCode), JSON.stringify(cart));
    syncCartWithServer(shopCode).catch((err) => console.error("Error syncing cart:", err));
  }

  return cart;
};

export const getCartItemCount = (shopCode?: string | null): number => {
  const cart = getCart(shopCode);
  return cart.reduce((total, item) => total + item.quantity, 0);
};

export const clearCart = async (shopCode?: string | null): Promise<void> => {
  localStorage.removeItem(storageKey(shopCode));
  const code = resolveShopCode(shopCode);
  const token = getToken(code);
  if (token && code) {
    try {
      await fetch(`${BASE_URL}${shopApiPath(code, "/api/cart")}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error clearing cart on server:", error);
    }
  }
};

export const isProductInCart = (productId: number, shopCode?: string | null): boolean => {
  const cart = getCart(shopCode);
  return cart.some((item) => item.id === productId);
};

export const getCartItemQuantity = (productId: number, shopCode?: string | null): number => {
  const cart = getCart(shopCode);
  const item = cart.find((item) => item.id === productId);
  return item ? item.quantity : 0;
};
