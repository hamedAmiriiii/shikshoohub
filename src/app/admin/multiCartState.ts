import type { PaymentType } from "@/app/lib/paymentTypes";

export type SettlementMode = "split" | "card_all" | "cash_all";

export type CartSlotSnapshot = {
  cart: any[];
  total: number;
  phone: string;
  customerName?: string;
  credit: number;
  useCreditAmount: number;
  discounttype: number;
  discountDisplay: string;
  profitPercentDisplay?: string;
  discountError: string;
  backPrice: number;
  paymentType: PaymentType;
  installmentCount: number;
  installmentCalculation: any;
  installmentCreditError: string;
  settlementMode: SettlementMode;
  cardAmountInput: string;
  cashAmountInput: string;
  paymentSplitError: string;
  selectedChequeId: number | null;
  selectedChequeIds?: number[];
};

export function createEmptyCartSlot(): CartSlotSnapshot {
  return {
    cart: [],
    total: 0,
    phone: "",
    customerName: "",
    credit: 0,
    useCreditAmount: 0,
    discounttype: 0,
    discountDisplay: "",
    profitPercentDisplay: "",
    discountError: "",
    backPrice: 0,
    paymentType: "cash",
    installmentCount: 2,
    installmentCalculation: null,
    installmentCreditError: "",
    settlementMode: "card_all",
    cardAmountInput: "",
    cashAmountInput: "",
    paymentSplitError: "",
    selectedChequeId: null,
    selectedChequeIds: [],
  };
}

const STORAGE_PREFIX = "admin_pos_multi_cart";
const STORAGE_VERSION = 1 as const;

export type PersistedMultiCartState = {
  version: typeof STORAGE_VERSION;
  slots: CartSlotSnapshot[];
  activeIndex: number;
  pendingProformaId?: number | null;
};

function multiCartStorageKey(): string {
  if (typeof window === "undefined") return STORAGE_PREFIX;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const shopId =
      user?.shop_id ?? user?.shopId ?? user?.shop?.id ?? user?.id ?? "default";
    return `${STORAGE_PREFIX}_${shopId}`;
  } catch {
    return STORAGE_PREFIX;
  }
}

function isSettlementMode(value: unknown): value is SettlementMode {
  return value === "split" || value === "card_all" || value === "cash_all";
}

function normalizeSlot(raw: unknown): CartSlotSnapshot {
  const empty = createEmptyCartSlot();
  if (!raw || typeof raw !== "object") return empty;
  const slot = raw as Partial<CartSlotSnapshot>;
  return {
    ...empty,
    ...slot,
    cart: Array.isArray(slot.cart) ? slot.cart : [],
    total: Number(slot.total) || 0,
    phone: String(slot.phone ?? ""),
    customerName: String(slot.customerName ?? ""),
    credit: Number(slot.credit) || 0,
    useCreditAmount: Number(slot.useCreditAmount) || 0,
    discounttype: Number(slot.discounttype) || 0,
    discountDisplay: String(slot.discountDisplay ?? ""),
    profitPercentDisplay: String(slot.profitPercentDisplay ?? ""),
    discountError: String(slot.discountError ?? ""),
    backPrice: Number(slot.backPrice) || 0,
    paymentType: (slot.paymentType as PaymentType) || "cash",
    installmentCount: Math.max(2, Number(slot.installmentCount) || 2),
    installmentCalculation: slot.installmentCalculation ?? null,
    installmentCreditError: String(slot.installmentCreditError ?? ""),
    settlementMode: isSettlementMode(slot.settlementMode)
      ? slot.settlementMode
      : "card_all",
    cardAmountInput: String(slot.cardAmountInput ?? ""),
    cashAmountInput: String(slot.cashAmountInput ?? ""),
    paymentSplitError: String(slot.paymentSplitError ?? ""),
    selectedChequeId:
      slot.selectedChequeId == null ? null : Number(slot.selectedChequeId) || null,
    selectedChequeIds: Array.isArray(slot.selectedChequeIds)
      ? slot.selectedChequeIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
      : [],
  };
}

export function readPersistedMultiCart(): PersistedMultiCartState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(multiCartStorageKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedMultiCartState;
    if (!parsed || parsed.version !== STORAGE_VERSION) return null;
    if (!Array.isArray(parsed.slots) || parsed.slots.length === 0) return null;
    const slots = parsed.slots.slice(0, 4).map(normalizeSlot);
    if (!slots.length) return null;
    const activeIndex = Math.min(
      Math.max(0, Number(parsed.activeIndex) || 0),
      slots.length - 1,
    );
    return {
      version: STORAGE_VERSION,
      slots,
      activeIndex,
      pendingProformaId:
        parsed.pendingProformaId == null
          ? null
          : Number(parsed.pendingProformaId) || null,
    };
  } catch {
    return null;
  }
}

export function writePersistedMultiCart(state: {
  slots: CartSlotSnapshot[];
  activeIndex: number;
  pendingProformaId?: number | null;
}): void {
  if (typeof window === "undefined") return;
  try {
    const slots = (Array.isArray(state.slots) ? state.slots : [])
      .slice(0, 4)
      .map(normalizeSlot);
    if (!slots.length) {
      slots.push(createEmptyCartSlot());
    }
    const activeIndex = Math.min(
      Math.max(0, Number(state.activeIndex) || 0),
      slots.length - 1,
    );
    const payload: PersistedMultiCartState = {
      version: STORAGE_VERSION,
      slots,
      activeIndex,
      pendingProformaId: state.pendingProformaId ?? null,
    };
    sessionStorage.setItem(multiCartStorageKey(), JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function clearPersistedMultiCart(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(multiCartStorageKey());
  } catch {
    /* ignore */
  }
}
