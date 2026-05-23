export const ADMIN_SALE_CART_SNAPSHOT_KEY = "admin_sale_cart_snapshot";
export const ADMIN_SALE_CART_UPDATED_EVENT = "admin-sale-cart-updated";

export function publishAdminSaleCartSnapshot(cart: unknown[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ADMIN_SALE_CART_SNAPSHOT_KEY, JSON.stringify(cart ?? []));
    window.dispatchEvent(new CustomEvent(ADMIN_SALE_CART_UPDATED_EVENT));
  } catch {
    /* ignore */
  }
}

export function adminSaleCartHasItems(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(ADMIN_SALE_CART_SNAPSHOT_KEY);
    if (!raw) return false;
    const cart = JSON.parse(raw) as unknown[];
    return Array.isArray(cart) && cart.length > 0;
  } catch {
    return false;
  }
}

export const SALE_ADD_CART_STEP_ID = "sale-add-cart";
export const COMPLETE_SALE_STEP_ID = "complete-sale";

export function getSaleAddCartStepIndex(steps: { id: string }[]) {
  return steps.findIndex((s) => s.id === SALE_ADD_CART_STEP_ID);
}

export function getCompleteSaleStepIndex(steps: { id: string }[]) {
  return steps.findIndex((s) => s.id === COMPLETE_SALE_STEP_ID);
}
