import type { PaymentType } from "@/app/lib/paymentTypes";

export type SettlementMode = "split" | "card_all" | "cash_all";

export type CartSlotSnapshot = {
  cart: any[];
  total: number;
  phone: string;
  credit: number;
  useCreditAmount: number;
  discounttype: number;
  discountDisplay: string;
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
};

export function createEmptyCartSlot(): CartSlotSnapshot {
  return {
    cart: [],
    total: 0,
    phone: "",
    credit: 0,
    useCreditAmount: 0,
    discounttype: 0,
    discountDisplay: "",
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
  };
}
