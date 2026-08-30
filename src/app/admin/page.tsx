"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Button, Modal, Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Table, TableBody, TableContainer, TableHead, TableRow, Paper, IconButton, Input, Card, CardContent, Grid, Container, CircularProgress, TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Tooltip, MenuItem, Select, InputLabel } from '@mui/material';
import SafeBarcodeScanner from "@/app/coponent/SafeBarcodeScanner";
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlashlightOnIcon from '@mui/icons-material/FlashlightOn';
import FlashlightOffIcon from '@mui/icons-material/FlashlightOff';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import SyncIcon from '@mui/icons-material/Sync';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import TodayIcon from '@mui/icons-material/Today';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import PhoneIcon from '@mui/icons-material/Phone';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PrintIcon from '@mui/icons-material/Print';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const SUPPORT_PHONE = "09399166196";
const BALE_PROFILE_URL = "https://ble.ir/AmiriWebino";
const RUBIKA_PROFILE_URL = "https://rubika.ir/WebinoPlus";
const NETWORK_TIMEOUT_MS = 8000;
const NETWORK_GOOD_MS = 4000;
const BOOTSTRAP_NETWORK_DELAY_MS = 8000;
const NETWORK_TIMEOUT_ERROR = "NETWORK_TIMEOUT";
const SLOW_NETWORK_TOAST_ID = "slow-network-offline";
import { styled } from '@mui/material/styles';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import { apiRequestError } from '@/app/lib/apiRequestError/client';
import { toast, ToastContainer } from 'react-toastify';
import { useSearchParams, useRouter } from "next/navigation";
import 'react-toastify/dist/ReactToastify.css';
import PhoneNumberInput from '@/app/coponent/PhoneNumberInput/PhoneNumberInput';
import tokenCode from '@/app/coponent/tokenCode';
import { FetchWithJwtClient } from '@/app/coponent/fetchWithJwtClient';
import {
  readTodayDashboardCache,
  fetchAndCacheTodayDashboard,
  getLocalDateKey,
  type TodayDashboardSnapshot,
} from '@/app/lib/shopTodayDashboard';
import {
  readSalesByDayCache,
  fetchAndCacheSalesByDay,
  type SalesByDaySnapshot,
} from '@/app/lib/shopSalesByDay';
import SalesByDayChart from '@/app/coponent/SalesByDayChart';
import { readProductsCountFromCache, readProductsFromCache } from '@/app/lib/productsCache';
import { catalogItemKey, isProducedGoodItem } from '@/app/lib/catalogItems';
import {
  OUTBOX_CHANGED_EVENT,
  attachClientIdToPayload,
  enqueueOutboxItem,
  listPendingOutboxItems,
  outboxItemToLegacyPending,
  readProductsCacheAsync,
  saveProductsCache,
  savePosSettingsCache,
  syncAllPendingPurchases,
  upsertCustomerCreditCache,
  findCustomerCreditInCache,
} from '@/app/lib/offline';
import {
  readAdminPosSettings,
  ADMIN_POS_SETTINGS_CHANGED_EVENT,
} from '@/app/lib/adminPosSettings';
import { formatAmountInput, parseAmountInput as parseMoneyAmount } from '@/app/lib/amountInput';
import type { PaymentType } from '@/app/lib/paymentTypes';
import SaleProductListPanel from '@/app/admin/SaleProductListPanel';
import AdminMenuModeView from '@/app/admin/AdminMenuModeView';
import type { AdminMenuModeCartPanelProps } from '@/app/admin/AdminMenuModeCartPanel';
import { ADMIN_SIDEBAR_WIDTH } from '@/app/admin/AdminHamburgerSidebar';
import CartQuantityControl from '@/app/admin/CartQuantityControl';
import MultiCartToolbar, { MAX_MULTI_CARTS } from '@/app/admin/MultiCartToolbar';
import { getPriceUnitLabel, getDefaultCartQuantity, getQuantityIncrement, normalizeQuantityValue } from '@/app/lib/productUnits';
import { createEmptyCartSlot, type CartSlotSnapshot } from '@/app/admin/multiCartState';
import { publishAdminSaleCartSnapshot } from '@/app/admin/onboarding/adminSaleCartCheck';
import CategoryIcon from '@mui/icons-material/Category';
import {
  type SaleReceiptData,
  saveSaleReceiptPrintData,
  openSaleReceiptPrintPage,
  readSaleReceiptPrintSettings,
} from '@/app/lib/saleReceiptPrint';
import {
  buildAvailableChequesForSaleUrl,
  extractChequeList,
  filterChequesForSale,
  formatChequeOptionLabel,
  parseAmount,
  type Cheque,
} from '@/app/lib/cheques';
import ChequeFormSheet from '@/app/admin/cheques/ChequeFormSheet';





const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontWeight: "600",
    [theme.breakpoints.down('md')]: {
      fontSize: "12px",
      padding: "8px 12px",
    },
    [theme.breakpoints.up('md')]: {
      fontSize: "16px",
      padding: "16px 24px",
    },
  },
  [`&.${tableCellClasses.body}`]: {
    color: "var(--admin-text)",
    [theme.breakpoints.down('md')]: {
      fontSize: 12,
      padding: "8px 12px",
    },
    [theme.breakpoints.up('md')]: {
      fontSize: 16,
      padding: "16px 24px",
    },
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

function moneyField(n: number): string {
  return formatAmountInput(String(Math.max(0, Math.floor(n || 0))));
}

export default function ShoppingPage() {
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [cartCount, setCartCount] = useState(1);
  const [activeCartIndex, setActiveCartIndex] = useState(0);
  const cartSlotsRef = useRef<CartSlotSnapshot[]>([createEmptyCartSlot()]);

  useEffect(() => {
    publishAdminSaleCartSnapshot(cart);
  }, [cart]);
  const [scannedCode, setScannedCode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [items, setItems] = useState([]); // New state for items from API
  const [phone, setPhone] = useState('');
  const [credit, setCredit] = useState(0);
  const [discounttype, setDiscounttype] = useState(0);
  const [discountDisplay, setDiscountDisplay] = useState('');
  const [discountError, setDiscountError] = useState('');
  const [isDiscountFocused, setIsDiscountFocused] = useState(false);
  const [useCreditAmount, setUseCreditAmount] = useState(0);
  const [backPrice, setBackPrice] = useState(0);
  const [checkingCredit, setCheckingCredit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );
  const [forcedOffline, setForcedOffline] = useState(false);
  const [isCheckingNetworkSpeed, setIsCheckingNetworkSpeed] = useState(false);
  const [networkWarningOpen, setNetworkWarningOpen] = useState(false);
  const [networkWarningMessage, setNetworkWarningMessage] = useState("");
  const [pendingPurchases, setPendingPurchases] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [installmentCount, setInstallmentCount] = useState<number>(2); // تعداد اقساط (حداقل 2)
  const [installmentCalculation, setInstallmentCalculation] = useState<any>(null); // اطلاعات محاسبه شده اقساط
  const [calculatingInstallments, setCalculatingInstallments] = useState(false); // وضعیت در حال محاسبه
  const [installmentCreditError, setInstallmentCreditError] = useState<string>(''); // خطای اعتبار ناکافی
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [askCustomerName, setAskCustomerName] = useState(false);
  const [todayDashboard, setTodayDashboard] = useState<TodayDashboardSnapshot | null>(null);
  const [salesByDay, setSalesByDay] = useState<SalesByDaySnapshot | null>(null);
  const [isRefreshingDashboard, setIsRefreshingDashboard] = useState(false);
  const [productsCount, setProductsCount] = useState(0);
  const [showProductListOnMainPage, setShowProductListOnMainPage] = useState(false);
  const [menuMode, setMenuMode] = useState(false);
  const [classicPosMode, setClassicPosMode] = useState(false);
  const [installmentPaymentEnabled, setInstallmentPaymentEnabled] = useState(true);
  const [debtPaymentEnabled, setDebtPaymentEnabled] = useState(false);
  const [chequePaymentEnabled, setChequePaymentEnabled] = useState(false);
  const [selectedChequeId, setSelectedChequeId] = useState<number | null>(null);
  const [availableCheques, setAvailableCheques] = useState<Cheque[]>([]);
  const [loadingAvailableCheques, setLoadingAvailableCheques] = useState(false);
  const [chequeCreateOpen, setChequeCreateOpen] = useState(false);
  const [kgSalesEnabled, setKgSalesEnabled] = useState(false);
  const [salePriceEditEnabled, setSalePriceEditEnabled] = useState(false);
  const [saleSuccessOpen, setSaleSuccessOpen] = useState(false);
  const [lastSaleReceipt, setLastSaleReceipt] = useState<SaleReceiptData | null>(null);
  const [skipPrintPreview, setSkipPrintPreview] = useState(false);
  const [isRegisteringUser, setIsRegisteringUser] = useState(false);
  const lastSyncTimeRef = useRef<number>(0);
  const installmentCalcRequestIdRef = useRef(0);
  const installmentCalculationRef = useRef<any>(null);
  const manualCodeInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  type SettlementMode = "split" | "card_all" | "cash_all";
  const [settlementMode, setSettlementMode] = useState<SettlementMode>("card_all");
  const [cardAmountInput, setCardAmountInput] = useState("");
  const [cashAmountInput, setCashAmountInput] = useState("");
  const [paymentSplitError, setPaymentSplitError] = useState("");
  const effectiveOnline = isOnline && !forcedOffline;

  const withTimeout = useCallback(
    async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(NETWORK_TIMEOUT_ERROR)), timeoutMs),
        ),
      ]);
    },
    [],
  );

  const parseAmountInput = useCallback((value: string): number => {
    const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
    const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
    const normalized = value
      .replace(/[۰-۹]/g, (c) => String(persianDigits.indexOf(c)))
      .replace(/[٠-٩]/g, (c) => String(arabicDigits.indexOf(c)))
      .replace(/,/g, "")
      .replace(/\D/g, "");
    if (normalized === "") return 0;
    const n = parseInt(normalized, 10);
    return Number.isNaN(n) ? 0 : n;
  }, []);

  const payableNow = useMemo(() => {
    if (paymentType === "debt" || paymentType === "cheque") return 0;
    if (paymentType === "installment") {
      const calc = installmentCalculation;
      const first = calc?.installment_details?.[0];
      if (first?.payment_type === "cash" && first?.base_payment != null) {
        return Math.floor(Number(first.base_payment));
      }
      return 0;
    }
    return Math.max(0, total - useCreditAmount - discounttype - backPrice);
  }, [paymentType, total, useCreditAmount, discounttype, backPrice, installmentCalculation]);

  const salePayableAmount = useMemo(
    () => Math.max(0, total - useCreditAmount - discounttype - backPrice),
    [total, useCreditAmount, discounttype, backPrice],
  );

  const matchingCheques = useMemo(
    () => filterChequesForSale(availableCheques, salePayableAmount),
    [availableCheques, salePayableAmount],
  );

  const selectedCheque = useMemo(
    () => matchingCheques.find((c) => c.id === selectedChequeId) ?? null,
    [matchingCheques, selectedChequeId],
  );

  const selectedChequeAmount = selectedCheque ? parseAmount(selectedCheque.amount) : 0;
  const chequeRemainder =
    paymentType === "cheque" && selectedCheque
      ? Math.max(0, salePayableAmount - selectedChequeAmount)
      : 0;
  const settlementTarget = paymentType === "cheque" ? chequeRemainder : payableNow;

  const sanitizeAmountInput = useCallback(
    (value: string) => value.replace(/[^\d۰-۹٠-٩,]/g, ""),
    [],
  );

  const handleCardAmountChange = useCallback(
    (value: string) => {
      const sanitized = sanitizeAmountInput(value);
      setPaymentSplitError("");
      if (sanitized === "") {
        setCardAmountInput("");
        setCashAmountInput(moneyField(settlementTarget));
        return;
      }
      const card = Math.min(parseAmountInput(sanitized), settlementTarget);
      setCardAmountInput(moneyField(card));
      setCashAmountInput(moneyField(Math.max(0, settlementTarget - card)));
    },
    [sanitizeAmountInput, parseAmountInput, settlementTarget],
  );

  const handleCashAmountChange = useCallback(
    (value: string) => {
      const sanitized = sanitizeAmountInput(value);
      setPaymentSplitError("");
      if (sanitized === "") {
        setCashAmountInput("");
        setCardAmountInput(moneyField(settlementTarget));
        return;
      }
      const cash = Math.min(parseAmountInput(sanitized), settlementTarget);
      setCashAmountInput(moneyField(cash));
      setCardAmountInput(moneyField(Math.max(0, settlementTarget - cash)));
    },
    [sanitizeAmountInput, parseAmountInput, settlementTarget],
  );

  const resetPaymentSettlement = useCallback(() => {
    setSettlementMode("card_all");
    setCardAmountInput("");
    setCashAmountInput("");
    setPaymentSplitError("");
  }, []);

  const captureCurrentSlot = useCallback((): CartSlotSnapshot => ({
    cart: Array.isArray(cart) ? [...cart] : [],
    total,
    phone,
    credit,
    useCreditAmount,
    discounttype,
    discountDisplay,
    discountError,
    backPrice,
    paymentType,
    installmentCount,
    installmentCalculation,
    installmentCreditError,
    settlementMode,
    cardAmountInput,
    cashAmountInput,
    paymentSplitError,
    selectedChequeId,
  }), [
    cart,
    total,
    phone,
    credit,
    useCreditAmount,
    discounttype,
    discountDisplay,
    discountError,
    backPrice,
    paymentType,
    installmentCount,
    installmentCalculation,
    installmentCreditError,
    settlementMode,
    cardAmountInput,
    cashAmountInput,
    paymentSplitError,
    selectedChequeId,
  ]);

  const applyCartSlot = useCallback((slot: CartSlotSnapshot) => {
    setCart(slot.cart ?? []);
    setTotal(slot.total ?? 0);
    setPhone(slot.phone ?? "");
    setCredit(slot.credit ?? 0);
    setUseCreditAmount(slot.useCreditAmount ?? 0);
    setDiscounttype(slot.discounttype ?? 0);
    setDiscountDisplay(slot.discountDisplay ?? "");
    setDiscountError(slot.discountError ?? "");
    setBackPrice(slot.backPrice ?? 0);
    setPaymentType(slot.paymentType ?? "cash");
    setInstallmentCount(slot.installmentCount ?? 2);
    setInstallmentCalculation(slot.installmentCalculation ?? null);
    installmentCalculationRef.current = slot.installmentCalculation ?? null;
    setInstallmentCreditError(slot.installmentCreditError ?? "");
    setSettlementMode(slot.settlementMode ?? "card_all");
    setCardAmountInput(formatAmountInput(slot.cardAmountInput ?? ""));
    setCashAmountInput(formatAmountInput(slot.cashAmountInput ?? ""));
    setPaymentSplitError(slot.paymentSplitError ?? "");
    setSelectedChequeId(slot.selectedChequeId ?? null);
    setIsDiscountFocused(false);
  }, []);

  const switchCart = useCallback(
    (index: number) => {
      if (index === activeCartIndex) return;
      if (index < 0 || index >= cartSlotsRef.current.length) return;
      const slots = [...cartSlotsRef.current];
      slots[activeCartIndex] = captureCurrentSlot();
      cartSlotsRef.current = slots;
      setActiveCartIndex(index);
      applyCartSlot(slots[index] ?? createEmptyCartSlot());
    },
    [activeCartIndex, captureCurrentSlot, applyCartSlot],
  );

  const addCartSlot = useCallback(() => {
    if (cartSlotsRef.current.length >= MAX_MULTI_CARTS) {
      toast.info("حداکثر ۴ سبد می‌توانید داشته باشید");
      return;
    }
    const slots = [...cartSlotsRef.current];
    slots[activeCartIndex] = captureCurrentSlot();
    slots.push(createEmptyCartSlot());
    cartSlotsRef.current = slots;
    setCartCount(slots.length);
    setActiveCartIndex(slots.length - 1);
    applyCartSlot(createEmptyCartSlot());
  }, [activeCartIndex, captureCurrentSlot, applyCartSlot]);

  const clearOrRemoveActiveCart = useCallback(
    (options?: { clearScanned?: boolean }) => {
      const slots = [...cartSlotsRef.current];
      if (slots.length <= 1) {
        const empty = createEmptyCartSlot();
        cartSlotsRef.current = [empty];
        setCartCount(1);
        setActiveCartIndex(0);
        applyCartSlot(empty);
        if (options?.clearScanned) setScannedCode("");
        return;
      }
      slots.splice(activeCartIndex, 1);
      const nextIndex = Math.min(activeCartIndex, slots.length - 1);
      cartSlotsRef.current = slots;
      setCartCount(slots.length);
      setActiveCartIndex(nextIndex);
      applyCartSlot(slots[nextIndex] ?? createEmptyCartSlot());
      if (options?.clearScanned) setScannedCode("");
    },
    [activeCartIndex, applyCartSlot],
  );

  const paymentFieldsValid = useMemo(() => {
    if (settlementTarget <= 0) return true;
    if (settlementMode === "card_all" || settlementMode === "cash_all") return true;
    const card = parseAmountInput(cardAmountInput);
    const cash = parseAmountInput(cashAmountInput);
    return card + cash === settlementTarget;
  }, [settlementTarget, settlementMode, cardAmountInput, cashAmountInput, parseAmountInput]);

  useEffect(() => {
    if (settlementTarget <= 0) {
      setCardAmountInput(paymentType === "cheque" ? moneyField(0) : "");
      setCashAmountInput(paymentType === "cheque" ? moneyField(0) : "");
      setPaymentSplitError("");
      return;
    }
    if (settlementMode === "card_all") {
      setCardAmountInput(moneyField(settlementTarget));
      setCashAmountInput(moneyField(0));
      setPaymentSplitError("");
    } else if (settlementMode === "cash_all") {
      setCardAmountInput(moneyField(0));
      setCashAmountInput(moneyField(settlementTarget));
      setPaymentSplitError("");
    } else if (settlementMode === "split") {
      const existingCard = parseAmountInput(cardAmountInput);
      if (!cardAmountInput || cardAmountInput === "") {
        setCardAmountInput(moneyField(settlementTarget));
        setCashAmountInput(moneyField(0));
      } else {
        const card = Math.min(existingCard, settlementTarget);
        setCardAmountInput(moneyField(card));
        setCashAmountInput(moneyField(Math.max(0, settlementTarget - card)));
      }
    }
  }, [settlementTarget, settlementMode, cardAmountInput, parseAmountInput, paymentType]);

  const appendPaymentSettlement = useCallback(
    (loadData: Record<string, unknown>): string | null => {
      if (payableNow <= 0) return null;

      if (settlementMode === "card_all") {
        loadData.payment_settlement = "card";
        return null;
      }
      if (settlementMode === "cash_all") {
        loadData.payment_settlement = "cash";
        return null;
      }

      const card = parseAmountInput(cardAmountInput);
      const cash = parseAmountInput(cashAmountInput);
      if (card + cash !== payableNow) {
        const fmt = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
        return `جمع کارت (${fmt(card)}) و نقد (${fmt(cash)}) باید برابر ${fmt(payableNow)} تومان باشد`;
      }
      loadData.card_amount = card;
      loadData.cash_amount = cash;
      return null;
    },
    [payableNow, settlementMode, cardAmountInput, cashAmountInput, parseAmountInput],
  );

  const darkFieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "var(--admin-surface-alt)",
      color: "var(--admin-text)",
      "& fieldset": { borderColor: "#505669" },
      "&:hover fieldset": { borderColor: "var(--admin-accent)" },
      "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
    },
    "& .MuiInputBase-input": {
      color: "var(--admin-text)",
      fontSize: { xs: "13px", md: "14px" },
      padding: { xs: "10px 12px", md: "12px 14px" },
      textAlign: "right",
      direction: "ltr",
    },
    "& .MuiFormHelperText-root": { color: "#ff4444", fontSize: { xs: "11px", md: "12px" } },
  } as const;
  
  // Online/Offline detection
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (!online) {
        setForcedOffline(false);
      }
    };



    

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  
  useEffect(() => {
    const price = searchParams.get("price");
    const priceNum = Number.parseInt(price || "", 10);
    if (Number.isFinite(priceNum) && priceNum > 0) {
      setBackPrice(priceNum);
    }
  }, [searchParams]);

  const refreshShopDashboard = useCallback(async () => {
    if (isRefreshingDashboard) return;
    setIsRefreshingDashboard(true);
    try {
      const [todaySnap, salesSnap] = await Promise.all([
        fetchAndCacheTodayDashboard(),
        fetchAndCacheSalesByDay(10),
      ]);
      if (todaySnap) setTodayDashboard(todaySnap);
      if (salesSnap) setSalesByDay(salesSnap);
    } finally {
      setIsRefreshingDashboard(false);
    }
  }, [isRefreshingDashboard]);

  useEffect(() => {
    const cachedToday = readTodayDashboardCache();
    const todayKey = getLocalDateKey();
    if (cachedToday?.dateKey === todayKey) {
      setTodayDashboard(cachedToday);
    }
    setSalesByDay(readSalesByDayCache());
    setProductsCount(readProductsCountFromCache());
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      setProductsCount(items.length);
    }
  }, [items.length]);

  // بارگذاری صف outbox از IndexedDB
  useEffect(() => {
    const loadPending = async () => {
      try {
        const items = await listPendingOutboxItems();
        setPendingPurchases(items.map(outboxItemToLegacyPending));
      } catch (error) {
        console.error('خطا در خواندن صف outbox:', error);
      }
    };

    loadPending();
    window.addEventListener(OUTBOX_CHANGED_EVENT, loadPending);
    return () => window.removeEventListener(OUTBOX_CHANGED_EVENT, loadPending);
  }, []);

  // تابع sync برای خریدهای pending (IndexedDB outbox)
  const syncPendingPurchases = useCallback(async () => {
    if (isSyncing) return;

    const pending = await listPendingOutboxItems();
    if (pending.length === 0) return;

    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTimeRef.current;
    if (timeSinceLastSync < 5000) {
      console.log('Sync خیلی زود است، صبر کنید...');
      return;
    }

    setIsSyncing(true);
    lastSyncTimeRef.current = now;

    const result = await syncAllPendingPurchases();
    const remaining = await listPendingOutboxItems();
    setPendingPurchases(remaining.map(outboxItemToLegacyPending));

    const successCount = result.successful.length + result.duplicate.length;

    if (successCount > 0 && result.failed.length === 0) {
      toast.success(`${successCount} خرید با موفقیت ثبت شد`);
    } else if (successCount > 0 && result.failed.length > 0) {
      toast.success(`${successCount} خرید با موفقیت ثبت شد`);
      toast.warn(`${result.failed.length} خرید هنوز ثبت نشده است`);
    } else if (successCount === 0 && result.failed.length > 0) {
      toast.error(`${result.failed.length} خرید ثبت نشد. لطفاً دوباره تلاش کنید`, {
        toastId: 'sync-failed',
      });
    }

    setIsSyncing(false);
  }, [isSyncing]);

  // Auto-sync خریدهای pending وقتی online می‌شود
  useEffect(() => {
    if (effectiveOnline && !isSyncing) {
      void listPendingOutboxItems().then((items) => {
        if (items.length > 0) {
          const timeSinceLastSync = Date.now() - lastSyncTimeRef.current;
          if (timeSinceLastSync > 5000) {
            syncPendingPurchases();
          }
        }
      });
    }
  }, [effectiveOnline, isSyncing, syncPendingPurchases]);

  const checkNetworkSpeed = useCallback(async () => {
    if (!navigator.onLine) {
      setNetworkWarningMessage("اتصال اینترنت در دسترس نیست. بهتر است در حالت آفلاین بمانید.");
      setNetworkWarningOpen(true);
      return;
    }

    setIsCheckingNetworkSpeed(true);
    try {
      const token = tokenCode();
      const startedAt = Date.now();
      const res = await withTimeout(
        apiRequestError("Get", {}, {}, `/api/product-all`, true, true, token),
        NETWORK_TIMEOUT_MS,
      );
      const elapsed = Date.now() - startedAt;

      if (!res?.hasError && elapsed <= NETWORK_GOOD_MS) {
        if (Array.isArray(res) && res.length > 0) {
          await saveProductsCache(res);
          setItems(res);
          setProductsCount(res.length);
        }
        setForcedOffline(false);
        toast.success(`سرعت شبکه مناسب است (${elapsed}ms) — به حالت آنلاین برگشتید.`);
        return;
      }

      setNetworkWarningMessage(
        elapsed > NETWORK_GOOD_MS
          ? `پاسخ شبکه کند بود (${elapsed}ms). بهتر است در حالت آفلاین بمانید.`
          : "وضعیت اینترنت پایدار نیست. بهتر است در حالت آفلاین بمانید.",
      );
      setNetworkWarningOpen(true);
    } catch (error) {
      setNetworkWarningMessage("وضعیت اینترنت خوب نیست. بهتر است در حالت آفلاین بمانید.");
      setNetworkWarningOpen(true);
    } finally {
      setIsCheckingNetworkSpeed(false);
    }
  }, [withTimeout]);

  useEffect(() => {
    let isActive = true;
    let hasCachedData = false;

    const applyCachedProducts = (list: any[], source: "localStorage" | "indexedDB") => {
      if (!isActive || !Array.isArray(list) || list.length === 0) return;
      setItems(list);
      setProductsCount(list.length);
      hasCachedData = true;
      console.log(`محصولات از ${source} بارگذاری شد:`, list.length, "محصول");
    };

    // دریافت از API و بروزرسانی cache (بدون پاک کردن cache قدیمی)
    const fetchProducts = async () => {
      try {
        const token = tokenCode();
        const res = await withTimeout(
          apiRequestError("Get", {}, {}, `/api/product-all`, true, true, token),
          NETWORK_TIMEOUT_MS,
        );
        if (!isActive) return;
        console.log('res : ',res);
        if (res.hasError) {
          if (!navigator.onLine) return;
          if (!hasCachedData) {
            toast.error("خطا در دریافت محصولات", { toastId: "products-fetch-error" });
          } else {
            toast.warn("خطا در بروزرسانی محصولات - از cache استفاده می‌شود", {
              toastId: "products-cache-fallback",
            });
          }
          return;
        }
        
        if (Array.isArray(res) && res.length > 0) {
          try {
            await saveProductsCache(res);
            console.log(' بروزرسانی شد:', res.length, 'محصول');
          } catch (error) {
            console.error('خطا در ذخیره محصولات:', error);
          }
          
          if (!isActive) return;
          setItems(res);
          setProductsCount(res.length);
          console.log('محصولات از API بروزرسانی شد');
        } else {
          console.warn('داده‌های دریافتی معتبر نیستند،  حفظ می‌شود');
        }
      } catch (error) {
        if (!isActive) return;
        console.error('خطا در دریافت محصولات:', error);
        const isTimeout =
          error instanceof Error && error.message === NETWORK_TIMEOUT_ERROR && navigator.onLine;
        if (isTimeout) {
          setForcedOffline(true);
          toast.warn("اینترنت کند است؛ سیستم موقتاً روی حالت آفلاین رفت.", {
            toastId: SLOW_NETWORK_TOAST_ID,
          });
          return;
        }
        if (!hasCachedData && navigator.onLine) {
          toast.error("خطا در دریافت محصولات", { toastId: "products-fetch-error" });
        } else if (hasCachedData && navigator.onLine) {
          toast.warn("خطا در بروزرسانی محصولات - از cache استفاده می‌شود", {
            toastId: "products-cache-fallback",
          });
        }
      }
    };

    const bootstrapProducts = async () => {
      // 1) سریع‌ترین مسیر: cache هم‌زمان localStorage
      try {
        const localCached = readProductsFromCache();
        applyCachedProducts(localCached as any[], "localStorage");
      } catch (error) {
        console.error("خطا در خواندن cache localStorage:", error);
      }

      // 2) سپس cache یکپارچه IndexedDB
      try {
        const idbCached = await readProductsCacheAsync();
        applyCachedProducts(idbCached as any[], "indexedDB");
      } catch (error) {
        console.error("خطا در خواندن cache indexedDB:", error);
      }

      // 3) پس از مهلت اولیه، refresh از API
      if (!navigator.onLine) return;
      await new Promise((resolve) => setTimeout(resolve, BOOTSTRAP_NETWORK_DELAY_MS));
      if (!isActive || !navigator.onLine) return;
      await fetchProducts();
    };

    void bootstrapProducts();
    return () => {
      isActive = false;
    };
  }, [withTimeout]);

  const normalizeInstallmentResult = (res: any): any => ({
    ...res,
    user_credit: res.user_installment_credit ?? res.user_credit,
  });

  // محاسبه مبلغ اقساط با سود (درخواست مستقیم از مرورگر با توکن)
  useEffect(() => {
    const calculateInstallments = async () => {
      if (paymentType !== 'installment' || installmentCount < 2 || total <= 0) {
        installmentCalculationRef.current = null;
        setInstallmentCalculation(null);
        setInstallmentCreditError('');
        return;
      }

      const totalAmount = Math.max(0, total - useCreditAmount - discounttype);
      if (totalAmount <= 0) {
        installmentCalculationRef.current = null;
        setInstallmentCalculation(null);
        setInstallmentCreditError('');
        return;
      }

      if (!phone || phone.trim() === '') {
        installmentCalculationRef.current = null;
        setInstallmentCalculation(null);
        setInstallmentCreditError('');
        return;
      }

      const requestId = ++installmentCalcRequestIdRef.current;
      setCalculatingInstallments(true);
      setInstallmentCreditError('');

      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const requestBody: Record<string, unknown> = {
          total_amount: totalAmount,
          installment_count: installmentCount,
          atelier_code: user.atelier_id,
          phone: phone.trim(),
        };

        const res = await FetchWithJwtClient(
          'POST',
          '/api/purchased-products/calculate-installments',
          requestBody,
        );

        if (requestId !== installmentCalcRequestIdRef.current) return;

        if (!res || res.hasError) {
          installmentCalculationRef.current = null;
          setInstallmentCalculation(null);
          const errMsg =
            typeof res?.error === 'string'
              ? res.error
              : typeof res?.message === 'string'
                ? res.message
                : 'خطا در محاسبه اقساط';
          if (errMsg.includes('اعتبار')) {
            setInstallmentCreditError(errMsg);
          } else {
            setInstallmentCreditError('');
            toast.error(errMsg);
          }
          return;
        }

        const normalized = normalizeInstallmentResult(res);

        if (normalized.has_enough_credit === false) {
          setInstallmentCreditError(
            (typeof normalized.error === 'string' && normalized.error) || 'اعتبار کاربر کافی نیست',
          );
          installmentCalculationRef.current = { ...normalized, hasError: true };
          setInstallmentCalculation(installmentCalculationRef.current);
        } else {
          setInstallmentCreditError('');
          installmentCalculationRef.current = normalized;
          setInstallmentCalculation(normalized);
        }
      } catch (error) {
        if (requestId !== installmentCalcRequestIdRef.current) return;
        console.error('خطا در محاسبه اقساط:', error);
        installmentCalculationRef.current = null;
        setInstallmentCalculation(null);
        setInstallmentCreditError('');
      } finally {
        if (requestId === installmentCalcRequestIdRef.current) {
          setCalculatingInstallments(false);
        }
      }
    };

    calculateInstallments();
  }, [paymentType, installmentCount, total, useCreditAmount, discounttype, phone]);

  useEffect(() => {
    const applyPosSettings = () => {
      const settings = readAdminPosSettings();
      setShowProductListOnMainPage(settings.showProductListOnMainPage);
      setMenuMode(settings.menuMode);
      setClassicPosMode(settings.classicPosMode);
      setAskCustomerName(settings.askCustomerName);
      setInstallmentPaymentEnabled(settings.installmentPaymentEnabled);
      setDebtPaymentEnabled(settings.debtPaymentEnabled);
      setChequePaymentEnabled(settings.chequePaymentEnabled);
      setKgSalesEnabled(settings.kgSalesEnabled);
      setSalePriceEditEnabled(settings.salePriceEditEnabled);
      void savePosSettingsCache(settings);
    };
    applyPosSettings();
    window.addEventListener(ADMIN_POS_SETTINGS_CHANGED_EVENT, applyPosSettings);
    return () => window.removeEventListener(ADMIN_POS_SETTINGS_CHANGED_EVENT, applyPosSettings);
  }, []);

  useEffect(() => {
    if (!installmentPaymentEnabled && paymentType === "installment") {
      setPaymentType("cash");
      setInstallmentCount(2);
      setInstallmentCalculation(null);
      installmentCalculationRef.current = null;
      setInstallmentCreditError("");
    }
  }, [installmentPaymentEnabled, paymentType]);

  useEffect(() => {
    if (!debtPaymentEnabled && paymentType === "debt") {
      setPaymentType("cash");
    }
  }, [debtPaymentEnabled, paymentType]);

  useEffect(() => {
    if (!chequePaymentEnabled && paymentType === "cheque") {
      setPaymentType("cash");
      setSelectedChequeId(null);
    }
  }, [chequePaymentEnabled, paymentType]);

  useEffect(() => {
    if (paymentType !== "cheque" || !chequePaymentEnabled) {
      return;
    }
    if (
      selectedChequeId &&
      !matchingCheques.some((cheque) => cheque.id === selectedChequeId)
    ) {
      setSelectedChequeId(null);
    }
  }, [paymentType, chequePaymentEnabled, matchingCheques, selectedChequeId]);

  const loadAvailableCheques = useCallback(async () => {
    setLoadingAvailableCheques(true);
    try {
      const token = tokenCode();
      if (!token) {
        setAvailableCheques([]);
        return;
      }
      const res = await FetchWithJwtClient(
        "GET",
        buildAvailableChequesForSaleUrl(),
        token,
      );
      if (res?.hasError) {
        setAvailableCheques([]);
        return;
      }
      setAvailableCheques(extractChequeList(res));
    } finally {
      setLoadingAvailableCheques(false);
    }
  }, []);

  useEffect(() => {
    if (paymentType !== "cheque" || !chequePaymentEnabled) {
      setAvailableCheques([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoadingAvailableCheques(true);
      try {
        const token = tokenCode();
        if (!token) {
          if (!cancelled) setAvailableCheques([]);
          return;
        }
        const res = await FetchWithJwtClient(
          "GET",
          buildAvailableChequesForSaleUrl(),
          token,
        );
        if (cancelled) return;
        if (res?.hasError) {
          setAvailableCheques([]);
          return;
        }
        setAvailableCheques(extractChequeList(res));
      } finally {
        if (!cancelled) setLoadingAvailableCheques(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [paymentType, chequePaymentEnabled]);

  const clearMenuCart = useCallback(() => {
    clearOrRemoveActiveCart();
  }, [clearOrRemoveActiveCart]);

  const addProductToCart = useCallback((item: any) => {
    setCart((prevCart) => {
      const addQty = kgSalesEnabled && item.unit_type === "kg"
        ? getDefaultCartQuantity(item)
        : 1;
      const incomingKey = catalogItemKey(item);
      const existing = prevCart.find((i) => catalogItemKey(i) === incomingKey);

      const newCart = existing
        ? prevCart.map((cartItem) =>
            catalogItemKey(cartItem) === incomingKey
              ? {
                  ...cartItem,
                  quantity: normalizeQuantityValue(
                    cartItem.quantity + addQty,
                    kgSalesEnabled ? item : { unit_type: "piece" },
                  ),
                }
              : cartItem,
          )
        : [
            ...prevCart,
            {
              ...item,
              quantity: addQty,
              sale_price: parseMoneyAmount(item.sale_price),
              ...(salePriceEditEnabled
                ? { default_sale_price: parseMoneyAmount(item.sale_price) }
                : {}),
            },
          ];

      const newTotal = newCart.reduce(
        (sum, cartItem) => sum + Number(cartItem.sale_price) * cartItem.quantity,
        0,
      );
      setTotal(newTotal);
      return newCart;
    });

    const beep = new Audio("/sound/008.mp3");
    beep.play().catch(() => {});

    if (navigator.vibrate) {
      navigator.vibrate(70);
    }
  }, [kgSalesEnabled, salePriceEditEnabled]);

  const addProductByBarcode = useCallback((barcode: string) => {
    if (!barcode || barcode.length < 3) return;

    const item = items?.find((product) => product.barcode === barcode);
    if (item) {
      addProductToCart(item);
    } else {
      toast.error("محصولی با این بارکد یافت نشد");
    }
  }, [items, addProductToCart]);

  const formatNumber = useCallback((num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  }, []);

  const handleOpenModal = useCallback(() => {
    setOpenModal(true);
    // Focus input after modal opens
    setTimeout(() => {
      if (manualCodeInputRef.current) {
        manualCodeInputRef.current.focus();
      }
    }, 100);
  }, []);

  const getShopNameFromUser = useCallback((): string | undefined => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.atelier_name || user.name || user.shop_name || undefined;
    } catch {
      return undefined;
    }
  }, []);

  const buildSaleReceiptFromCurrentSale = useCallback(
    (purchaseId?: number | string): SaleReceiptData => {
      const calc = installmentCalculationRef.current ?? installmentCalculation;
      const finalTotal = Math.max(0, total - useCreditAmount - discounttype - backPrice);
      return {
        purchaseId,
        createdAt: new Date().toISOString(),
        shopName: getShopNameFromUser(),
        phone: phone || undefined,
        items: cart.map((item: any) => {
          const unitPrice = Number(item.sale_price);
          return {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice,
            lineTotal: unitPrice * item.quantity,
          };
        }),
        subtotal: total,
        discount: discounttype,
        creditUsed: useCreditAmount,
        backPrice,
        finalTotal,
        payableNow,
        paymentType,
        settlementMode,
        cardAmount: parseAmountInput(cardAmountInput),
        cashAmount: parseAmountInput(cashAmountInput),
        installmentCount: paymentType === "installment" ? installmentCount : undefined,
        installmentAmount: calc?.installment_amount,
        chequeId: paymentType === "cheque" ? selectedChequeId ?? undefined : undefined,
        chequeNumber: paymentType === "cheque" ? selectedCheque?.cheque_number ?? undefined : undefined,
      };
    },
    [
      cart,
      phone,
      total,
      discounttype,
      useCreditAmount,
      backPrice,
      payableNow,
      paymentType,
      settlementMode,
      cardAmountInput,
      cashAmountInput,
      installmentCount,
      installmentCalculation,
      selectedChequeId,
      selectedCheque,
      getShopNameFromUser,
      parseAmountInput,
    ],
  );

  const resetCartAfterSale = useCallback(() => {
    clearOrRemoveActiveCart({ clearScanned: true });
  }, [clearOrRemoveActiveCart]);

  const finalizeSuccessfulSale = useCallback(
    (res: any, successMessage: string) => {
      const purchaseId = res?.id ?? res?.purchase_id ?? res?.data?.id;
      const receipt = buildSaleReceiptFromCurrentSale(purchaseId);
      const directPrint = Boolean(readSaleReceiptPrintSettings().autoPrint);
      saveSaleReceiptPrintData(receipt);
      setLastSaleReceipt(receipt);
      setSkipPrintPreview(directPrint);
      setSaleSuccessOpen(true);
      toast.success(successMessage);
      resetCartAfterSale();
      setIsSubmitting(false);
    },
    [buildSaleReceiptFromCurrentSale, resetCartAfterSale],
  );

  const handlePrintLastSaleReceipt = useCallback(() => {
    if (!lastSaleReceipt) {
      toast.error("اطلاعات فاکتور در دسترس نیست");
      return;
    }
    openSaleReceiptPrintPage(
      skipPrintPreview ? "/admin/print/sale?direct=1" : "/admin/print/sale",
      lastSaleReceipt,
    );
  }, [lastSaleReceipt, skipPrintPreview]);

  const resetCartAfterQueuedSale = useCallback(() => {
    clearOrRemoveActiveCart({ clearScanned: true });
    setIsSubmitting(false);
  }, [clearOrRemoveActiveCart]);

  const queueCurrentPurchase = useCallback(
    async (
      purchasePayload: Record<string, unknown>,
      clientId: string,
      message: string,
      level: "success" | "warn" = "success",
    ) => {
      const receipt = buildSaleReceiptFromCurrentSale();
      const directPrint = Boolean(readSaleReceiptPrintSettings().autoPrint);
      await enqueueOutboxItem({
        type: "purchase",
        clientId,
        payload: purchasePayload,
        meta: { cart, total, phone },
      });
      saveSaleReceiptPrintData(receipt);
      setLastSaleReceipt(receipt);
      setSkipPrintPreview(directPrint);
      setSaleSuccessOpen(true);
      const items = await listPendingOutboxItems();
      setPendingPurchases(items.map(outboxItemToLegacyPending));
      if (level === "warn") toast.warn(message);
      else toast.success(message);
      resetCartAfterQueuedSale();
    },
    [buildSaleReceiptFromCurrentSale, cart, total, phone, resetCartAfterQueuedSale],
  );

  const buildPurchaseProductLine = useCallback(
    (item: any) => {
      if (isProducedGoodItem(item)) {
        const payload: Record<string, unknown> = {
          produced_good_id: Number(item.produced_good_id ?? item.id),
          quantity: item.quantity,
          purchase_price: Number(item.purchase_price),
        };
        if (salePriceEditEnabled) {
          const defaultPrice = Number(item.default_sale_price ?? item.sale_price);
          const currentPrice = Number(item.sale_price);
          if (currentPrice !== defaultPrice) {
            payload.sale_price = currentPrice;
          }
        }
        return payload;
      }

      const payload: Record<string, unknown> = {
        product_id: Number(item.id),
        quantity: item.quantity,
        purchase_price: Number(item.purchase_price),
      };
      if (salePriceEditEnabled) {
        const defaultPrice = Number(item.default_sale_price ?? item.sale_price);
        const currentPrice = Number(item.sale_price);
        if (currentPrice !== defaultPrice) {
          payload.sale_price = currentPrice;
        }
      }
      return payload;
    },
    [salePriceEditEnabled],
  );

  const confirm = useCallback(() => {
    // اعتبارسنجی تخفیف قبل از ارسال
    if (discounttype > 0) {
      const maxDiscount = Math.floor(total * 0.15);
      if (discounttype > maxDiscount) {
        toast.error(`مبلغ تخفیف نمی‌تواند بیشتر از ${formatNumber(maxDiscount)} تومان (15% مبلغ کل) باشد`);
        setIsSubmitting(false);
        return;
      }
    }

    // اعتبارسنجی: برای خرید نسیه باید شماره تلفن وارد شود
    if (paymentType === 'debt' && !phone) {
      toast.error("برای خرید نسیه باید شماره تلفن مشتری را وارد کنید");
      setIsSubmitting(false);
      return;
    }

    // اعتبارسنجی: فروش چکی
    if (paymentType === 'cheque') {
      if (!effectiveOnline) {
        toast.error("فروش چکی فقط در حالت آنلاین امکان‌پذیر است");
        setIsSubmitting(false);
        return;
      }
      if (loadingAvailableCheques) {
        toast.error("در حال بارگذاری چک‌های قابل انتخاب، لطفاً صبر کنید");
        setIsSubmitting(false);
        return;
      }
      if (!selectedChequeId || !selectedCheque) {
        toast.error("چک دریافتی را انتخاب کنید");
        setIsSubmitting(false);
        return;
      }
      if (selectedChequeAmount <= 0 || selectedChequeAmount > salePayableAmount) {
        toast.error("مبلغ چک باید کمتر یا برابر مبلغ قابل پرداخت باشد");
        setIsSubmitting(false);
        return;
      }
    }

    // اعتبارسنجی: برای خرید اقساطی باید شماره تلفن وارد شود
    if (paymentType === 'installment' && !phone) {
      toast.error("برای خرید اقساطی باید شماره تلفن مشتری را وارد کنید");
      setIsSubmitting(false);
      return;
    }

    // اعتبارسنجی: تعداد اقساط باید معتبر باشد (حداقل 2، حداکثر 24)
    if (paymentType === 'installment' && (installmentCount < 2 || installmentCount > 24)) {
      toast.error("تعداد اقساط باید بین 2 تا 24 ماه باشد");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    const loadData: any = {
      products: cart.map((item) => buildPurchaseProductLine(item)),
    };
    if (discounttype> 0) {
      loadData.discount_amount = discounttype;
    }

    if (phone) {
      loadData.phone = phone;
    }

    if (useCreditAmount > 0) {
      loadData.use_credit = true;
    }

    // افزودن اطلاعات پرداخت اقساطی
    loadData.payment_type = paymentType;
    if (paymentType === 'installment') {
      loadData.installment_count = installmentCount;
      // installment_amount در response برمی‌گردد و نیازی به ارسال نیست
    }
    if (paymentType === 'cheque') {
      loadData.cheque_id = selectedChequeId;
      let cash = 0;
      let card = 0;
      if (chequeRemainder > 0) {
        if (settlementMode === "card_all") {
          card = chequeRemainder;
        } else if (settlementMode === "cash_all") {
          cash = chequeRemainder;
        } else {
          if (!paymentFieldsValid) {
            const msg = `جمع نقد و کارت باید برابر باقی‌مانده ${formatNumber(chequeRemainder)} تومان باشد`;
            setPaymentSplitError(msg);
            toast.error(msg);
            setIsSubmitting(false);
            return;
          }
          card = parseAmountInput(cardAmountInput);
          cash = parseAmountInput(cashAmountInput);
        }
      }
      if (cash + card + selectedChequeAmount !== salePayableAmount) {
        const msg = "نقد + کارت + مبلغ چک باید برابر مبلغ قابل پرداخت باشد";
        setPaymentSplitError(msg);
        toast.error(msg);
        setIsSubmitting(false);
        return;
      }
      loadData.cash_amount = cash;
      loadData.card_amount = card;
      setPaymentSplitError("");
    }

    if (paymentType !== 'debt' && paymentType !== 'cheque' && payableNow > 0) {
      if (!paymentFieldsValid) {
        const msg =
          settlementMode === "split"
            ? `جمع کارت و نقد باید برابر ${formatNumber(payableNow)} تومان باشد`
            : "مبلغ پرداخت را بررسی کنید";
        setPaymentSplitError(msg);
        toast.error(msg);
        setIsSubmitting(false);
        return;
      }
      const paymentErr = appendPaymentSettlement(loadData);
      if (paymentErr) {
        setPaymentSplitError(paymentErr);
        toast.error(paymentErr);
        setIsSubmitting(false);
        return;
      }
      setPaymentSplitError("");
    }

    const { clientId, payload: purchasePayload } = attachClientIdToPayload(loadData);

    // اگر offline است، در outbox ذخیره کن
    if (!effectiveOnline) {
      void queueCurrentPurchase(
        purchasePayload,
        clientId,
        "خرید در صف ثبت قرار گرفت (حالت offline)",
      );
      return;
    }

    // بررسی اعتبار برای خرید اقساطی
    if (paymentType === 'installment') {
      if (!phone || phone.trim() === '') {
        toast.error("برای خرید اقساطی باید شماره تلفن مشتری را وارد کنید");
        setIsSubmitting(false);
        return;
      }

      if (calculatingInstallments) {
        toast.error("در حال محاسبه اقساط، لطفاً چند لحظه صبر کنید");
        setIsSubmitting(false);
        return;
      }

      const calc = installmentCalculationRef.current ?? installmentCalculation;

      if (installmentCreditError || (calc && calc.has_enough_credit === false)) {
        toast.error(installmentCreditError || 'اعتبار کاربر کافی نیست. لطفاً اعتبار کاربر را بررسی کنید.');
        setIsSubmitting(false);
        return;
      }

      if (!calc || !calc.installment_amount) {
        toast.error("لطفاً منتظر بمانید تا محاسبه اقساط انجام شود");
        setIsSubmitting(false);
        return;
      }
    }

    const purchaseToken = tokenCode() || '';
    withTimeout(
      apiRequestError("Post", {}, purchasePayload, `/api/purchased-products`, true, true, purchaseToken),
      NETWORK_TIMEOUT_MS,
    ).then((res) => {
     console.log("res : ",res);
     
      if (res.hasError) {
        // چک کردن نوع ارور
        let isInventoryError = false;
        try {
          const errorData = JSON.parse(res.errorText);
          if (errorData.error && errorData.error.includes('موجودی')) {
            isInventoryError = true;
            toast.error(errorData.error);
          }
        } catch (parseError) {
          // اگر parse نشد، فرض کنیم ارور عمومی است
          console.error('خطا در parse ارور:', parseError);
        }

        if (isInventoryError) {
          setIsSubmitting(false);
          return;
        }

        void queueCurrentPurchase(
          purchasePayload,
          clientId,
          "خرید در صف ثبت قرار گرفت (خطا در ارسال)",
          "warn",
        );
        return;
      }
      let successMessage = "خرید ثبت شد";
      if (paymentType === "installment" && res.installments && res.installments.length > 0) {
        const paidCount = res.installments.filter((inst: any) => inst.is_paid).length;
        const totalCount = res.installments.length;
        successMessage = `خرید اقساطی ثبت شد. ${totalCount} قسط ایجاد شد (${paidCount} قسط پرداخت شده)`;
      } else if (paymentType === "cheque") {
        successMessage =
          chequeRemainder > 0
            ? "فروش ترکیبی چک و نقد/کارت ثبت شد"
            : res?.is_cheque_settled
              ? "فروش چکی ثبت و تسویه شد"
              : "فروش چکی ثبت شد — پس از وصول چک، درآمد ثبت می‌شود";
      }
      finalizeSuccessfulSale(res, successMessage);
    }).catch((error) => {
      console.error("Error submitting purchase:", error);
      if (error instanceof Error && error.message === NETWORK_TIMEOUT_ERROR && navigator.onLine) {
        setForcedOffline(true);
      }
      void queueCurrentPurchase(
        purchasePayload,
        clientId,
        "خرید در صف ثبت قرار گرفت (اتصال کند/نامطمئن — حالت آفلاین فعال شد)",
        "warn",
      );
    });
  }, [cart, phone, useCreditAmount, effectiveOnline, discounttype, total, formatNumber, paymentType, installmentCount, payableNow, paymentFieldsValid, settlementMode, appendPaymentSettlement, resetPaymentSettlement, installmentCalculation, calculatingInstallments, installmentCreditError, finalizeSuccessfulSale, queueCurrentPurchase, withTimeout, selectedChequeId, selectedCheque, selectedChequeAmount, chequeRemainder, salePayableAmount, loadingAvailableCheques, buildPurchaseProductLine, parseAmountInput, cardAmountInput, cashAmountInput]);

  // بررسی اعتبارسنجی تخفیف هنگام تغییر total
  useEffect(() => {
    if (discounttype > 0 && total > 0) {
      const maxDiscount = Math.floor(total * 0.15);
      if (discounttype > maxDiscount) {
        setDiscountError(`مبلغ تخفیف نمی‌تواند بیشتر از ${formatNumber(maxDiscount)} تومان (15% مبلغ کل) باشد`);
        setDiscounttype(0);
        setDiscountDisplay('');
      } else if (discountError) {
        // اگر قبلاً خطا بود و حالا درست شد، خطا را پاک کن
        setDiscountError('');
      }
    }
  }, [total, discounttype, discountError, formatNumber]);

  // Handle Enter key press و USB barcode scanner
  useEffect(() => {
    let barcodeBuffer = '';
    let barcodeTimeout: NodeJS.Timeout;
    let lastKeyTime = Date.now();
    let lastBarcodeTime = 0; // زمان آخرین اسکن بارکد
    let lastProcessedBarcode = ''; // آخرین بارکد پردازش شده
    let lastProcessTime = 0; // زمان آخرین پردازش
    let lastCharKeyTime = 0; // آخرین بار که یک کاراکتر تایپ شد (برای تشخیص Enter از اسکنر)

    const processBarcode = (barcode: string) => {
      const now = Date.now();
      // جلوگیری از پردازش دوباره همون بارکد در 500ms
      if (barcode === lastProcessedBarcode && now - lastProcessTime < 500) {
        return;
      }
      addProductByBarcode(barcode);
      lastProcessedBarcode = barcode;
      lastProcessTime = now;
      lastBarcodeTime = now;
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const currentTime = Date.now();
      
      // اگر در input یا textarea هستیم
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const inputElement = target as HTMLInputElement;
        // ثبت خرید فقط با Enter عمدی کاربر؛ اگر بلافاصله بعد از کاراکترها Enter آمده (مثل اسکنر) ثبت نکن
        if (inputElement.name === 'phone' && (event.key === 'Enter' || event.keyCode === 13)) {
          const timeSinceLastChar = currentTime - lastCharKeyTime;
          if (total > 0 && !isSubmitting && timeSinceLastChar > 400) {
            event.preventDefault();
            confirm();
          }
        }
        // برای هر کلید معمولی در input زمان آخرین کاراکتر را به‌روز کن
        if (event.key?.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          lastCharKeyTime = currentTime;
        }
        // اگر در input مودال (کد دستی) هستیم، کاری نکن (بگذار Enter کار خودش را بکند)
        if (inputElement.name === 'manualCode' || target.closest('[role="dialog"]')) {
          return;
        }
        return;
      }

      // اگر Enter زده شد
      if ((event.key === 'Enter' || event.keyCode === 13)) {
        event.preventDefault();
        
        // اگر بافر بارکد داریم، یعنی Enter از بارکدخوان است - بارکد رو پردازش کن
        if (barcodeBuffer.length >= 3) {
          clearTimeout(barcodeTimeout);
          processBarcode(barcodeBuffer.trim());
          barcodeBuffer = '';
          return;
        }
        
        // اگر تازه بارکد اسکن شده (در 300ms گذشته)، Enter رو نادیده بگیر
        if (currentTime - lastBarcodeTime < 300) {
          return;
        }
        
        // در غیر این صورت، Enter معمولی است - هیچ کاری نکن
        // ثبت خرید فقط از طریق input شماره تلفن انجام می‌شود
        return;
      }

      const timeSinceLastKey = currentTime - lastKeyTime;

      // اگر فاصله زمانی بین کلیدها زیاد است (بیش از 100ms)، بافر را پاک کن
      if (timeSinceLastKey > 100 && barcodeBuffer.length > 0) {
        barcodeBuffer = '';
      }

      // اگر کاراکتر معمولی است، به بافر اضافه کن (برای USB barcode scanner)
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        lastCharKeyTime = currentTime;
        // جلوگیری از نمایش کاراکتر در صفحه (فقط وقتی در body یا div هستیم)
        if (target === document.body || target === document.documentElement || (target.tagName === 'DIV' && !openModal)) {
          event.preventDefault();
        }
        
        barcodeBuffer += event.key;
        lastKeyTime = currentTime;
        clearTimeout(barcodeTimeout);
        
        // اگر بعد از 150ms کاراکتری نیامد، بافر را پردازش کن (بارکد کامل شده)
        barcodeTimeout = setTimeout(() => {
          if (barcodeBuffer.length >= 3 && !openModal) {
            processBarcode(barcodeBuffer.trim());
          }
          barcodeBuffer = '';
        }, 150);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearTimeout(barcodeTimeout);
    };
  }, [openModal, total, isSubmitting, addProductByBarcode, confirm]);

  // Focus input when modal opens
  useEffect(() => {
    if (openModal && manualCodeInputRef.current) {
      setTimeout(() => {
        manualCodeInputRef.current?.focus();
      }, 100);
    }
  }, [openModal]);

  const onChangePhone = (value: string) => {
    const phoneValue = value ? (!value.startsWith("0") ? "0" + value : value) : "";
    setPhone(phoneValue);
    
    // اگر شماره تلفن معتبر است (11 رقم یا 10 رقم که با 9 شروع شود)
    if (phoneValue && (phoneValue.length === 11 || (phoneValue.length === 10 && phoneValue.startsWith("9")))) {
      checkCredit(phoneValue);
    } else {
      setCredit(0);
      setUseCreditAmount(0);
    }
  };

  // پر کردن شماره از URL برگشت کالا (?phone=...)
  useEffect(() => {
    const rawPhone = searchParams.get("phone")?.trim();
    if (!rawPhone) return;
    onChangePhone(rawPhone);
    // فقط با تغییر URL؛ نه با هر تغییر onChangePhone
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const checkCredit = async (phoneNumber: string) => {
    setCheckingCredit(true);

    if (!navigator.onLine) {
      try {
        const cached = await findCustomerCreditInCache(phoneNumber);
        if (cached) {
          setCredit(cached.credit);
          setUseCreditAmount(cached.useCredit);
        } else {
          setCredit(0);
          setUseCreditAmount(0);
          toast.warn("اعتبار مشتری در حالت آفلاین در دسترس نیست");
        }
      } finally {
        setCheckingCredit(false);
      }
      return;
    }

    const token = tokenCode();
    try {
      const res = await apiRequestError("Get", {}, {}, `/api/purchased-products/credit?phone=${phoneNumber}`, true, true, token);
      console.log("Credit API Response:", res);
      
      if (res.hasError) {
        setCredit(0);
        setUseCreditAmount(0);
        return;
      }
      
      // بررسی اینکه داده‌ها در res هستند یا res.data
      const data = res.credit !== undefined ? res : (res.data || res);
      console.log("Credit Data:", data);
      
      const creditValue = data.credit ? parseFloat(String(data.credit)) : 0;
      const useCreditValue = data.use_credit ? parseFloat(String(data.use_credit)) : 0;
      
      console.log("Credit Values:", { creditValue, useCreditValue });
      
      setCredit(creditValue);
      setUseCreditAmount(useCreditValue);
      void upsertCustomerCreditCache({
        phone: phoneNumber,
        credit: creditValue,
        useCredit: useCreditValue,
      });
    } catch (error) {
      console.error("Error checking credit:", error);
      setCredit(0);
      setUseCreditAmount(0);
    } finally {
      setCheckingCredit(false);
    }
  };

  const handleRegisterUser = async () => {
    const normalizedPhone = registerPhone.trim();

    if (!/^09\d{9}$/.test(normalizedPhone)) {
      toast.error("شماره تلفن معتبر نیست");
      return;
    }

    setIsRegisteringUser(true);
    try {
      const token = tokenCode() || "";
      const payload: Record<string, unknown> = { phone: normalizedPhone };
      const trimmedName = registerName.trim();
      if (askCustomerName && trimmedName) {
        payload.name = trimmedName;
      }
      const res = await apiRequestError("Post", {}, payload, `/api/customers/register`, true, true, token);

      if (res.hasError) {
        toast.error(res.errorText || "خطا در ثبت کاربر");
        return;
      }

      if (res.already_exists) {
        toast.info(res.message || "کاربر قبلا در شیک‌شو ثبت شده است");
      } else {
        toast.success(res.message || "کاربر با موفقیت ثبت شد");
      }

      // بعد از ثبت/یافتن کاربر، شماره را در فرم خرید هم قرار می‌دهیم.
      setPhone(normalizedPhone);
      setRegisterPhone('');
      setRegisterName('');
    } catch (error) {
      console.error("Error registering user:", error);
      toast.error("خطا در ثبت کاربر");
    } finally {
      setIsRegisteringUser(false);
    }
  };

  const handleBarcodeScan = (result1) => {
    let result = result1 ? result1.text : manualCode
    if (result) {
      setScannedCode(result);
      const item = items?.find((item) => item.barcode === result);
      if (item) {
        addProductToCart(item);
      }
      setOpenModal(false)
      setManualCode("")
      // Focus input شماره تلفن بعد از بسته شدن modal
      setTimeout(() => {
        const phoneInput = document.querySelector('input[name="phone"]') as HTMLInputElement;
        if (phoneInput) {
          phoneInput.focus();
        }
      }, 100);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setManualCode("");
    // Focus input شماره تلفن بعد از بسته شدن modal
    setTimeout(() => {
      const phoneInput = document.querySelector('input[name="phone"]') as HTMLInputElement;
      if (phoneInput && cart.length > 0) {
        phoneInput.focus();
      }
    }, 100);
  };
  
  useEffect(() => {

   
  }, []);

  const removeItemFromCart = (itemId) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter(item => catalogItemKey(item) !== String(itemId));

      // Recalculate total based on updated cart
      let newTotal = 0;
      updatedCart.forEach((item) => {
        newTotal += Number(item.sale_price) * item.quantity;
      });
      setTotal(newTotal);

      return updatedCart;
    });
  };

  // تغییر تعداد کالا (افزایش یا کاهش — برای عددی)
  const updateQuantity = (itemId, increment) => {
    setCart((prevCart) => {
      const newCart = prevCart.map((item) => {
        if (catalogItemKey(item) === String(itemId)) {
          const step = kgSalesEnabled ? getQuantityIncrement(item) : 1;
          const newQuantity = normalizeQuantityValue(
            item.quantity + increment * step,
            kgSalesEnabled ? item : { unit_type: "piece" },
          );

          if (newQuantity > 0) {
            return { ...item, quantity: newQuantity };
          }
        }
        return item;
      });

      let newTotal = 0;
      newCart.forEach((item) => {
        newTotal += Number(item.sale_price) * item.quantity;
      });
      setTotal(newTotal);
      return newCart;
    });
  };

  const setCartItemQuantity = (itemId: number | string, quantity: number) => {
    setCart((prevCart) => {
      const newCart = prevCart
        .map((item) => {
          if (catalogItemKey(item) !== String(itemId)) return item;
          const normalized = normalizeQuantityValue(
            quantity,
            kgSalesEnabled ? item : { unit_type: "piece" },
          );
          if (normalized <= 0) return null;
          return { ...item, quantity: normalized };
        })
        .filter(Boolean);

      let newTotal = 0;
      newCart.forEach((item) => {
        newTotal += Number(item.sale_price) * item.quantity;
      });
      setTotal(newTotal);
      return newCart;
    });
  };

  const setCartItemSalePrice = useCallback((itemId: number | string, value: string) => {
    const parsed = parseAmountInput(value);
    if (parsed <= 0) return;
    setCart((prevCart) => {
      const newCart = prevCart.map((item) =>
        catalogItemKey(item) === String(itemId) ? { ...item, sale_price: parsed } : item,
      );
      const newTotal = newCart.reduce(
        (sum, item) => sum + Number(item.sale_price) * item.quantity,
        0,
      );
      setTotal(newTotal);
      return newCart;
    });
  }, [parseAmountInput]);



  const posCartPanel = useMemo((): AdminMenuModeCartPanelProps => ({
    cart,
    total,
    formatNumber,
    onUpdateQuantity: updateQuantity,
    onSetQuantity: setCartItemQuantity,
    kgSalesEnabled,
    onRemoveItem: removeItemFromCart,
    onClearCart: clearMenuCart,
    cartCount,
    activeCartIndex,
    onSwitchCart: switchCart,
    onAddCart: addCartSlot,
    phone,
    phoneInputKey: `pos-phone-${activeCartIndex}`,
    onChangePhone,
    checkingCredit,
    credit,
    useCreditAmount,
    discounttype,
    discountDisplay,
    discountError,
    isDiscountFocused,
    onDiscountFocus: () => setIsDiscountFocused(true),
    onDiscountChange: (value: string) => {
      const formatted = formatAmountInput(value);
      const numValue = formatted === "" ? 0 : parseAmountInput(formatted);
      const maxDiscount = Math.floor(total * 0.15);
      if (numValue > maxDiscount) {
        setDiscountError(`حداکثر ${formatNumber(maxDiscount)} تومان`);
        setDiscounttype(0);
        setDiscountDisplay("");
      } else {
        setDiscountError("");
        setDiscounttype(numValue);
        setDiscountDisplay(formatted);
      }
    },
    onDiscountBlur: (value: string) => {
      setIsDiscountFocused(false);
      const numValue = parseAmountInput(value);
      if (numValue <= 0) {
        setDiscountDisplay("");
        setDiscounttype(0);
        setDiscountError("");
      } else {
        setDiscountDisplay(formatAmountInput(value));
      }
    },
    paymentType,
    onPaymentTypeChange: (type) => {
      setPaymentType(type);
      if (type === "cash") {
        setInstallmentCount(2);
        setInstallmentCalculation(null);
        installmentCalculationRef.current = null;
        setInstallmentCreditError("");
        setSelectedChequeId(null);
      } else if (type === "installment") {
        setDiscounttype(0);
        setDiscountDisplay("");
        setDiscountError("");
        setSelectedChequeId(null);
      } else if (type === "cheque") {
        setSelectedChequeId(null);
        setSettlementMode("cash_all");
      }
    },
    installmentCount,
    onInstallmentCountChange: setInstallmentCount,
    payableNow,
    settlementMode,
    onSettlementModeChange: (mode) => {
      setSettlementMode(mode);
      setPaymentSplitError("");
      if (mode === "split") {
        setCardAmountInput(moneyField(settlementTarget));
        setCashAmountInput(moneyField(0));
      }
    },
    cardAmountInput,
    cashAmountInput,
    onCardAmountChange: handleCardAmountChange,
    onCashAmountChange: handleCashAmountChange,
    paymentSplitError,
    paymentFieldsValid,
    isSubmitting,
    onConfirm: confirm,
    calculatingInstallments,
    installmentCreditError,
    installmentCalculation,
    installmentPaymentEnabled,
    debtPaymentEnabled,
    chequePaymentEnabled,
    selectedChequeId,
    onSelectedChequeChange: setSelectedChequeId,
    matchingCheques,
    loadingAvailableCheques,
    salePayableAmount,
    backPrice,
    chequeRemainder,
    selectedChequeAmount,
    onOpenCreateCheque: () => setChequeCreateOpen(true),
    salePriceEditEnabled,
    onSalePriceChange: setCartItemSalePrice,
  }), [
    cart,
    total,
    updateQuantity,
    setCartItemQuantity,
    kgSalesEnabled,
    removeItemFromCart,
    clearMenuCart,
    cartCount,
    activeCartIndex,
    switchCart,
    addCartSlot,
    phone,
    onChangePhone,
    checkingCredit,
    credit,
    useCreditAmount,
    discounttype,
    discountDisplay,
    discountError,
    isDiscountFocused,
    paymentType,
    installmentCount,
    payableNow,
    settlementMode,
    cardAmountInput,
    cashAmountInput,
    handleCardAmountChange,
    handleCashAmountChange,
    paymentSplitError,
    paymentFieldsValid,
    isSubmitting,
    confirm,
    calculatingInstallments,
    installmentCreditError,
    installmentCalculation,
    installmentPaymentEnabled,
    debtPaymentEnabled,
    chequePaymentEnabled,
    selectedChequeId,
    matchingCheques,
    loadingAvailableCheques,
    salePayableAmount,
    backPrice,
    chequeRemainder,
    selectedChequeAmount,
    salePriceEditEnabled,
    setCartItemSalePrice,
    formatNumber,
  ]);



  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', direction: "rtl", background: "var(--admin-bg-gradient)" }}>
      <Container maxWidth="xl" sx={{ padding: { xs: '12px', md: '24px' }, paddingBottom: { xs: '140px', md: '56px' } }}>

        {/* Offline / Pending — یک خط فشرده */}
        {(!effectiveOnline || pendingPurchases.length > 0) && (
          <Box
            sx={{
              backgroundColor: !effectiveOnline ? "#ff9800" : "#2196f3",
              color: "var(--admin-text)",
              padding: { xs: "6px 10px", md: "8px 14px" },
              borderRadius: { xs: "8px", md: "12px" },
              marginBottom: { xs: "12px", md: "16px" },
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.75, md: 1 },
              flexWrap: "nowrap",
              overflow: "hidden",
            }}
          >
            {!effectiveOnline && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  minWidth: 0,
                  flex: "1 1 auto",
                }}
              >
                <CloudOffIcon sx={{ fontSize: { xs: 16, md: 20 }, flexShrink: 0 }} />
                <Typography
                  noWrap
                  sx={{
                    fontSize: { xs: "11px", md: "13px" },
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  حالت Offline - خریدها در صف ثبت قرار می‌گیرند
                </Typography>
              </Box>
            )}

            {effectiveOnline && pendingPurchases.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  minWidth: 0,
                  flex: "1 1 auto",
                }}
              >
                <CloudQueueIcon sx={{ fontSize: { xs: 16, md: 20 }, flexShrink: 0 }} />
                <Typography
                  noWrap
                  sx={{ fontSize: { xs: "11px", md: "13px" }, fontWeight: 600 }}
                >
                  {pendingPurchases.length} خرید در صف ثبت
                  {isSyncing ? " (همگام‌سازی...)" : ""}
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                flexShrink: 0,
                ml: "auto",
              }}
            >
              {!effectiveOnline && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={checkNetworkSpeed}
                  disabled={isCheckingNetworkSpeed}
                  sx={{
                    minWidth: 0,
                    px: { xs: 1, md: 1.5 },
                    py: 0.35,
                    bgcolor: "#fff",
                    color: "#d97706",
                    fontSize: { xs: "10px", md: "12px" },
                    whiteSpace: "nowrap",
                    "&:hover": { bgcolor: "#f8fafc" },
                  }}
                >
                  {isCheckingNetworkSpeed ? "..." : "بررسی شبکه"}
                </Button>
              )}

              {pendingPurchases.length > 0 && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => router.push("/admin/pending-purchases")}
                  sx={{
                    minWidth: 0,
                    px: { xs: 1, md: 1.5 },
                    py: 0.35,
                    bgcolor: "#fff",
                    color: !effectiveOnline ? "#d97706" : "#1565c0",
                    fontSize: { xs: "10px", md: "12px" },
                    whiteSpace: "nowrap",
                    "&:hover": { bgcolor: "#f8fafc" },
                  }}
                >
                  مشاهده صف
                  {pendingPurchases.length > 0 ? ` (${pendingPurchases.length})` : ""}
                </Button>
              )}

              {effectiveOnline && pendingPurchases.length > 0 && !isSyncing && (
                <IconButton
                  size="small"
                  onClick={syncPendingPurchases}
                  aria-label="همگام‌سازی صف"
                  sx={{
                    color: "var(--admin-text)",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    p: 0.5,
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.35)" },
                  }}
                >
                  <SyncIcon sx={{ fontSize: { xs: 16, md: 18 } }} />
                </IconButton>
              )}
              {isSyncing && (
                <CircularProgress size={16} sx={{ color: "var(--admin-text)" }} />
              )}
            </Box>
          </Box>
        )}

        {menuMode || classicPosMode ? (
          <AdminMenuModeView
            products={items}
            onAddProduct={addProductToCart}
            formatNumber={formatNumber}
            cartPanel={posCartPanel}
            classicPosMode={classicPosMode}
            onOpenScanner={handleOpenModal}
          />
        ) : (
        <Grid container spacing={3} sx={{ maxWidth: { md: "1400px" }, margin: { md: "0 auto" } }}>
          {/* Cart Items */}
          <Grid item xs={12} md={(cart.length > 0 || cartCount > 1) ? 8 : 12}>
            {cart.length > 0 ? (
              <Box sx={{ marginBottom: { xs: "12px", md: "0" } }}>
                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    maxWidth: '100%', 
                    overflowX: 'auto',
                    borderRadius: { xs: "16px", md: "20px" },
                    backgroundColor: "#1e2330",
                    border: "1px solid rgba(120, 181, 104, 0.2)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      border: "1px solid rgba(120, 181, 104, 0.3)",
                    }
                  }}
                >
                  <Table aria-label="shopping table" size="small" sx={{
                "& .MuiTableCell-root": {
                  fontSize: { xs: "12px", md: "16px" },
                  padding: { xs: "8px 12px", md: "16px 24px" }
                }
              }}>
                    <TableHead>
                      <TableRow>
                        <StyledTableCell align="right" sx={{ 
                          color: "var(--admin-text)", 
                          fontWeight: "700", 
                          backgroundColor: "#0f1117",
                          fontSize: { xs: "13px", md: "17px" },
                          padding: { xs: "12px 16px", md: "18px 28px" },
                          borderBottom: "2px solid rgba(120, 181, 104, 0.3)"
                        }}>
                          کالا
                        </StyledTableCell>
                        <StyledTableCell align="right" sx={{ 
                          color: "var(--admin-text)", 
                          fontWeight: "700", 
                          backgroundColor: "#0f1117",
                          fontSize: { xs: "13px", md: "17px" },
                          padding: { xs: "12px 16px", md: "18px 28px" },
                          borderBottom: "2px solid rgba(120, 181, 104, 0.3)"
                        }}>
                          قیمت
                        </StyledTableCell>
                        <StyledTableCell align="right" sx={{ 
                          color: "var(--admin-text)", 
                          fontWeight: "700", 
                          backgroundColor: "#0f1117",
                          fontSize: { xs: "13px", md: "17px" },
                          padding: { xs: "12px 16px", md: "18px 28px" },
                          borderBottom: "2px solid rgba(120, 181, 104, 0.3)"
                        }}>
                          تعداد
                        </StyledTableCell>
                        <StyledTableCell align="right" sx={{ 
                          color: "var(--admin-text)", 
                          fontWeight: "700", 
                          backgroundColor: "#0f1117",
                          fontSize: { xs: "13px", md: "17px" },
                          padding: { xs: "12px 16px", md: "18px 28px" },
                          borderBottom: "2px solid rgba(120, 181, 104, 0.3)"
                        }}>
                          حذف
                        </StyledTableCell>
                      </TableRow>
                    </TableHead>
                <TableBody>
                  {cart.map((item) => (
                    <StyledTableRow 
                      key={catalogItemKey(item)}
                      sx={{
                        backgroundColor: "#1e2330",
                        borderBottom: "1px solid var(--admin-menu-hover)",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: "#252a3a",
                          transform: "translateX(-4px)",
                          }
                      }}
                    >
                      <StyledTableCell align="right" component="th" scope="row" sx={{ 
                        width: "40%", 
                        whiteSpace: 'nowrap', 
                        color: "var(--admin-text)", 
                        fontSize: { xs: "12px", md: "16px" },
                        padding: { xs: "8px 12px", md: "16px 24px" }
                      }}>
                        {item.name}
                      </StyledTableCell>
                      <StyledTableCell align="right" sx={{ 
                        padding: { xs: "8px 12px", md: "16px 24px" }
                      }}>
                        {salePriceEditEnabled ? (
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "flex-end", minWidth: 120 }}>
                            <TextField
                              size="small"
                              value={String(item.sale_price ?? "")}
                              onChange={(e) => setCartItemSalePrice(catalogItemKey(item), e.target.value)}
                              inputProps={{ inputMode: "numeric", style: { textAlign: "right", direction: "ltr" } }}
                              sx={{
                                width: { xs: 110, md: 140 },
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: "var(--admin-surface-alt)",
                                  color: "var(--admin-accent)",
                                  fontWeight: 600,
                                  "& fieldset": { borderColor: "var(--admin-border)" },
                                  "&:hover fieldset": { borderColor: "var(--admin-accent)" },
                                  "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
                                },
                                "& .MuiInputBase-input": {
                                  fontSize: { xs: "12px", md: "14px" },
                                  py: 0.75,
                                },
                              }}
                            />
                            {item.default_sale_price != null &&
                              Number(item.sale_price) !== Number(item.default_sale_price) && (
                              <Typography sx={{ fontSize: "10px", color: "#ff9800" }}>
                                پیش‌فرض: {formatNumber(Number(item.default_sale_price))}
                              </Typography>
                            )}
                            {kgSalesEnabled && (
                              <Typography sx={{ fontSize: "10px", color: "var(--admin-text-muted)" }}>
                                {getPriceUnitLabel(item)}
                              </Typography>
                            )}
                          </Box>
                        ) : item.has_discount ? (
                          <Box sx={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
                            <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "11px", textDecoration: "line-through" }}>
                              {formatNumber(Number(item.original_sale_price))} تومان
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Typography sx={{ color: "var(--admin-accent)", fontSize: { xs: "12px", md: "16px" }, fontWeight: "600" }}>
                                {formatNumber(Number(item.sale_price))} تومان
                                {kgSalesEnabled && (
                                  <Typography component="span" sx={{ fontSize: "10px", color: "var(--admin-text-muted)", mr: 0.5 }}>
                                    {" "}({getPriceUnitLabel(item)})
                                  </Typography>
                                )}
                              </Typography>
                              <Typography sx={{ 
                                color: "#ff9100", 
                                fontSize: "10px", 
                                fontWeight: "600",
                                backgroundColor: "rgba(255, 145, 0, 0.1)",
                                padding: "2px 6px",
                                borderRadius: "4px"
                              }}>
                                {formatNumber(Number(item.discount_percent))}%
                              </Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Typography sx={{ color: "var(--admin-accent)", fontWeight: "600", fontSize: { xs: "14px", md: "19px" } }}>
                            {formatNumber(Number(item.sale_price))} تومان
                            {kgSalesEnabled && (
                              <Typography component="span" sx={{ fontSize: "10px", color: "var(--admin-text-muted)", mr: 0.5 }}>
                                {" "}({getPriceUnitLabel(item)})
                              </Typography>
                            )}
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="right" sx={{ color: "var(--admin-text)", padding: { xs: "8px 12px", md: "16px 24px" } }}>
                        <CartQuantityControl
                          item={item}
                          kgSalesEnabled={kgSalesEnabled}
                          onChange={setCartItemQuantity}
                        />
                      </StyledTableCell>
                      <StyledTableCell align="right" sx={{ padding: { xs: "8px 12px", md: "16px 24px" } }}>
                        <IconButton 
                          onClick={() => removeItemFromCart(catalogItemKey(item))} 
                          sx={{ 
                            color: "#ff4444",
                            padding: { xs: "4px", md: "8px" },
                            "&:hover": { 
                              backgroundColor: "rgba(255, 68, 68, 0.1)",
                              transform: "scale(1.1)"
                            }
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: { xs: "18px", md: "24px" } }} />
                        </IconButton>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
            ) : backPrice > 0 ? (
              <Card
                sx={{
                  backgroundColor: "#1e2330",
                  borderRadius: { xs: "16px", md: "20px" },
                  border: "1px solid rgba(26, 180, 77, 0.35)",
                  marginBottom: { xs: "12px", md: "0" },
                }}
              >
                <CardContent sx={{ textAlign: "center", padding: { xs: "24px", md: "40px" } }}>
                  <CheckCircleIcon sx={{ fontSize: { xs: 48, md: 64 }, color: "rgba(26, 180, 77, 0.85)", mb: 1.5 }} />
                  <Typography sx={{ color: "rgba(26, 180, 77, 0.9)", fontSize: { xs: "15px", md: "18px" }, fontWeight: 600 }}>
                    کالا با موفقیت برگشت خورد
                  </Typography>
                  <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: { xs: "12px", md: "14px" }, mt: 1 }}>
                    منتظر کالای جدید هستید
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ marginBottom: { xs: "12px", md: 0 } }}>
                <Grid container spacing={{ xs: 1.5, md: 2 }} alignItems="stretch">
                  <Grid item xs={12} md={6}>
                    <Card
                      sx={{
                        height: "100%",
                        background: "var(--admin-dashboard-card-bg)",
                        borderRadius: { xs: "16px", md: "20px" },
                        border: "1px solid var(--admin-accent-border)",
                        overflow: "hidden",
                      }}
                    >
                      <CardContent sx={{ padding: { xs: "16px", md: "20px" }, height: "100%" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: { xs: 1.5, md: 2 } }}>
                          <TodayIcon sx={{ color: "var(--admin-accent)", fontSize: { xs: 22, md: 26 } }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: { xs: "15px", md: "17px" } }}>
                              {todayDashboard?.dateKey === getLocalDateKey()
                                ? "عملکرد امروز"
                                : "آخرین آمار فروش"}
                            </Typography>
                            <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: { xs: "11px", md: "12px" } }}>
                              {todayDashboard
                                ? "برای بروزرسانی آمار، دکمه رفرش را بزنید"
                                : "پس از اولین فروش امروز اینجا نمایش داده می‌شود"}
                            </Typography>
                          </Box>
                          <Tooltip title="بروزرسانی آمار فروش">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => void refreshShopDashboard()}
                                disabled={isRefreshingDashboard}
                                sx={{ color: "var(--admin-accent)" }}
                                aria-label="بروزرسانی آمار فروش"
                              >
                                {isRefreshingDashboard ? (
                                  <CircularProgress size={20} color="inherit" />
                                ) : (
                                  <RefreshIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>

                        <Grid container spacing={{ xs: 1.25, md: 1.5 }}>
                          {[
                            
                            {
                              icon: <AttachMoneyIcon sx={{ fontSize: 20 }} />,
                              label: "مبلغ فروش",
                              value: todayDashboard ? formatNumber(todayDashboard.totalSales) : "—",
                              suffix: "تومان",
                              gradient: "linear-gradient(135deg,rgb(52, 185, 97) 0%,rgb(45, 128, 84) 100%)",
                            },
                            {
                              icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
                              label: "سود امروز",
                              value: todayDashboard ? formatNumber(todayDashboard.totalProfit) : "—",
                              suffix: "تومان",
                              gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                            },
                            {
                              icon: <CategoryIcon sx={{ fontSize: 20 }} />,
                              label: "تعداد کالا",
                              value: productsCount > 0 ? formatNumber(productsCount) : "—",
                              suffix: productsCount > 0 ? "عدد" : "",
                              gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            },
                            {
                              icon: <Inventory2Icon sx={{ fontSize: 20 }} />,
                              label: "ارزش کل انبار",
                              value: todayDashboard ? formatNumber(todayDashboard.inventorySaleValue) : "—",
                              suffix: "تومان",
                              gradient: "linear-gradient(135deg, #4facfe 0%,rgb(13, 76, 80) 100%)",
                            },
                            ...(todayDashboard &&
                            (todayDashboard.debtsCollected != null ||
                              todayDashboard.uncollectedDebts != null)
                              ? [
                                  {
                                    icon: <AccountBalanceWalletIcon sx={{ fontSize: 20 }} />,
                                    label: "وصول نسیه",
                                    value: formatNumber(todayDashboard.debtsCollected ?? 0),
                                    suffix: "تومان",
                                    gradient: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
                                  },
                                  {
                                    icon: <WarningIcon sx={{ fontSize: 20 }} />,
                                    label: "بدهی باز",
                                    value: formatNumber(todayDashboard.uncollectedDebts ?? 0),
                                    suffix: "تومان",
                                    gradient: "linear-gradient(135deg, #ef5350 0%, #c62828 100%)",
                                  },
                                ]
                              : []),
                          ].map((stat) => (
                            <Grid item xs={6} key={stat.label}>
                              <Box
                                sx={{
                                  p: { xs: 1.25, md: 1.5 },
                                  borderRadius: "12px",
                                  background: stat.gradient,
                                  minHeight: { xs: 88, md: 96 },
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "var(--admin-stat-on-gradient)" }}>
                                  {stat.icon}
                                  <Typography sx={{ fontSize: { xs: "10px", md: "11px" }, fontWeight: 500, color: "var(--admin-stat-on-gradient)" }}>
                                    {stat.label}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    justifyContent: "space-between",
                                    gap: 0.75,
                                    width: "100%",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      color: "var(--admin-stat-on-gradient)",
                                      fontWeight: 700,
                                      fontSize: {
                                        xs: stat.value === "—" ? "18px" : "15px",
                                        md: stat.value === "—" ? "22px" : "17px",
                                      },
                                      lineHeight: 1.3,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {stat.value}
                                  </Typography>
                                  {stat.suffix && stat.value !== "—" && (
                                    <Typography
                                      sx={{
                                        color: "rgba(255,255,255,0.85)",
                                        fontSize: { xs: "10px", md: "11px" },
                                        fontWeight: 500,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {stat.suffix}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card
                      sx={{
                        height: "100%",
                        background: "var(--admin-dashboard-chart-bg)",
                        borderRadius: { xs: "16px", md: "20px" },
                        border: "1px solid var(--admin-accent-border)",
                        overflow: "hidden",
                      }}
                    >
                      <CardContent sx={{ padding: { xs: "16px", md: "20px" }, height: "100%" }}>
                        <SalesByDayChart
                          data={salesByDay}
                          formatNumber={formatNumber}
                          onRefresh={() => void refreshShopDashboard()}
                          isRefreshing={isRefreshingDashboard}
                        />
                      </CardContent>
                    </Card>
                  </Grid>

                  {showProductListOnMainPage && (
                    <Grid item xs={12} sx={{ display: { xs: "block", md: "none" } }}>
                      <SaleProductListPanel
                        variant="embedded"
                        products={items}
                        onAddProduct={addProductToCart}
                        formatNumber={formatNumber}
                      />
                    </Grid>
                  )}

                  {/* <Grid item xs={12}>
                    <Box
                      sx={{
                        p: { xs: 1.25, md: 1.5 },
                        borderRadius: "12px",
                        backgroundColor: "rgba(120, 181, 104, 0.08)",
                        border: "1px dashed rgba(120, 181, 104, 0.35)",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <AddCircleOutlineIcon sx={{ color: "var(--admin-accent)", fontSize: { xs: 22, md: 24 } }} />
                      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: { xs: "12px", md: "13px" } }}>
                        برای شروع فروش، بارکد را اسکن کنید یا دکمه{" "}
                        <Box component="span" sx={{ color: "var(--admin-accent)", fontWeight: 700 }}>
                          +
                        </Box>{" "}
                        را بزنید
                      </Typography>
                    </Box>
                  </Grid> */}

                  <Grid item xs={12}>
                    <Box
                      sx={{
                        mt: { xs: 1.5, md: 2 },
                        mb: "15px",
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: "stretch",
                        gap: { xs: 1, sm: 1.5 },
                      }}
                    >
                      <Card
                        id="register-user"
                        sx={{
                          width: { xs: "100%", sm: "33.333%" },
                          flexShrink: 0,
                          backgroundColor: "var(--admin-surface)",
                          borderRadius: "12px",
                          border: "1px solid var(--admin-border)",
                          boxShadow: "none",
                        }}
                      >
                        <CardContent sx={{ py: 1.25, px: 1.5, "&:last-child": { pb: 1.25 } }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
                            <PersonAddIcon sx={{ color: "var(--admin-accent)", fontSize: 18 }} />
                            <Typography sx={{ color: "var(--admin-text)", fontWeight: 600, fontSize: "13px" }}>
                              ثبت مشتری جدید
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                            {askCustomerName ? (
                              <TextField
                                value={registerName}
                                onChange={(e) => setRegisterName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !isRegisteringUser) {
                                    e.preventDefault();
                                    handleRegisterUser();
                                  }
                                }}
                                placeholder="نام مشتری"
                                size="small"
                                fullWidth
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    backgroundColor: "var(--admin-surface-alt)",
                                    color: "var(--admin-text)",
                                    borderRadius: "10px",
                                    height: 36,
                                    "& fieldset": { borderColor: "var(--admin-border)" },
                                    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
                                    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
                                  },
                                  "& .MuiInputBase-input": {
                                    color: "var(--admin-text)",
                                    fontSize: "12px",
                                  },
                                }}
                              />
                            ) : null}
                            <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
                            <TextField
                              value={registerPhone}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/[^\d]/g, "").slice(0, 11);
                                setRegisterPhone(numericValue);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !isRegisteringUser) {
                                  e.preventDefault();
                                  handleRegisterUser();
                                }
                              }}
                              placeholder="09xxxxxxxxx"
                              type="tel"
                              size="small"
                              fullWidth
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: "var(--admin-surface-alt)",
                                  color: "var(--admin-text)",
                                  borderRadius: "10px",
                                  height: 36,
                                  "& fieldset": { borderColor: "var(--admin-border)" },
                                  "&:hover fieldset": { borderColor: "var(--admin-accent)" },
                                  "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
                                },
                                "& .MuiInputBase-input": {
                                  color: "var(--admin-text)",
                                  fontSize: "12px",
                                  textAlign: "left",
                                  direction: "ltr",
                                },
                              }}
                            />
                            <Button
                              type="button"
                              onClick={handleRegisterUser}
                              disabled={isRegisteringUser || registerPhone.length !== 11}
                              variant="contained"
                              size="small"
                              sx={{
                                flexShrink: 0,
                                minWidth: 56,
                                height: 36,
                                fontSize: "12px",
                                fontWeight: 700,
                                background: "linear-gradient(135deg, var(--admin-accent) 0%, var(--admin-accent-hover) 100%)",
                              }}
                            >
                              {isRegisteringUser ? "..." : "ثبت"}
                            </Button>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>

                      <Card
                        sx={{
                          flex: 1,
                          backgroundColor: "var(--admin-surface)",
                          borderRadius: "12px",
                          border: "1px solid var(--admin-border)",
                          boxShadow: "none",
                        }}
                      >
                        <CardContent sx={{ py: 1.25, px: 1.5, "&:last-child": { pb: 1.25 } }}>
                          <Typography
                            sx={{
                              color: "var(--admin-text)",
                              fontWeight: 600,
                              fontSize: "13px",
                              mb: 1,
                            }}
                          >
                            تماس با پشتیبانی
                          </Typography>
                          <Box sx={{ display: "flex", gap: 0.75 }}>
                            <Button
                              component="a"
                              href={`tel:${SUPPORT_PHONE}`}
                              variant="contained"
                              size="small"
                              
                              sx={{
                                flex: 1,
                                height: 36,
                                fontSize: "11px",
                                fontWeight: 600,
                                borderRadius: "10px",
                                textDecoration: "none",
                                background: "linear-gradient(135deg, #43a047 0%, #2e7d32 100%)",
                                "& .MuiButton-startIcon": { mr: 0.5, ml: 0 },
                              }}
                            >
                              تماس
                            </Button>
                            <Button
                              component="a"
                              href={BALE_PROFILE_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="contained"
                              size="small"
                              
                              sx={{
                                flex: 1,
                                height: 36,
                                fontSize: "11px",
                                fontWeight: 600,
                                borderRadius: "10px",
                                textDecoration: "none",
                                background: "linear-gradient(135deg, #00b894 0%, #008f72 100%)",
                                "& .MuiButton-startIcon": { mr: 0.5, ml: 0 },
                              }}
                            >
                              بله
                            </Button>
                            <Button
                              component="a"
                              href={RUBIKA_PROFILE_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="contained"
                              size="small"
                              sx={{
                                flex: 1,
                                height: 36,
                                fontSize: "11px",
                                fontWeight: 600,
                                borderRadius: "10px",
                                textDecoration: "none",
                                background: "linear-gradient(135deg, #e91e63 0%, #c2185b 100%)",
                              }}
                            >
                              روبیکا
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Grid>

          {/* Total and Submit - Desktop Sidebar */}
          {(cart.length > 0 || cartCount > 1) && (
            <Grid item xs={12} md={4}>
              <Box sx={{ position: { md: "sticky" }, top: { md: "24px" }, pb: { xs: 3, md: 2 } }}>
                {/* Phone Number Input */}
                <Card sx={{ 
                  backgroundColor: "var(--admin-surface)", 
                  borderRadius: { xs: "16px", md: "20px" },
                  marginBottom: { xs: "16px", md: "24px" },
                  border: "1px solid var(--admin-border)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    border: "1px solid var(--admin-accent-border)",
                    transform: "translateY(-2px)",
                  }
                }}>
                  <CardContent sx={{ padding: { xs: "12px", md: "20px" }, display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <MultiCartToolbar
                      cartCount={cartCount}
                      activeIndex={activeCartIndex}
                      onSwitch={switchCart}
                      onAdd={addCartSlot}
                      onClearOrRemove={clearMenuCart}
                    />
                    <PhoneNumberInput
                      key={`phone-${activeCartIndex}`}
                      name="phone"
                      defaultValue={phone}
                      onChange={onChangePhone}
                      size="small"
                      sx={{
                        width: '100%',
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "var(--admin-surface-alt)",
                          color: "var(--admin-text)",
                          "& fieldset": {
                            borderColor: "var(--admin-border)",
                          },
                          "&:hover fieldset": {
                            borderColor: "var(--admin-accent)",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "var(--admin-accent)",
                          },
                        },
                        "& .MuiInputBase-input": {
                          color: "var(--admin-text)",
                          fontSize: { xs: "13px", md: "14px" },
                          padding: { xs: "10px 12px", md: "12px 14px" },
                        },
                      }}
                    />
                    {checkingCredit && (
                      <Typography sx={{ 
                        color: "var(--admin-text-muted)", 
                        fontSize: { xs: "11px", md: "14px" }, 
                        marginTop: { xs: "6px", md: "10px" } 
                      }}>
                        در حال بررسی اعتبار...
                      </Typography>
                    )}
                    {!checkingCredit && credit > 0 && (
                      <Box sx={{ 
                        marginTop: { xs: "8px", md: "12px" }, 
                        padding: { xs: "8px", md: "12px" }, 
                        backgroundColor: "var(--admin-surface-alt)", 
                        borderRadius: { xs: "6px", md: "8px" } 
                      }}>
                        <Typography sx={{ 
                          color: "var(--admin-accent)", 
                          fontSize: { xs: "12px", md: "15px" }
                        }}>
                          اعتبار موجود: {formatNumber(credit)} تومان
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  {paymentType !== 'installment' && (
                    <CardContent sx={{ padding: { xs: "12px", md: "20px" }, paddingTop: 0 }}>
                      <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: { xs: 1, md: 2 },
                        flexWrap: { xs: "wrap", sm: "nowrap" },
                      }}>
                      <Typography sx={{ 
                        color: "var(--admin-text)", 
                        fontSize: { xs: "13px", md: "14px" },
                        fontWeight: "500",
                        flexShrink: 0,
                      }}>
                        تخفیف (تومان):
                      </Typography>
                      <TextField
                      value={discountDisplay}
                      onChange={(e) => {
                        const formatted = formatAmountInput(e.target.value);
                        const numValue = formatted === "" ? 0 : parseAmountInput(formatted);
                        const maxDiscount = Math.floor(total * 0.15);
                        if (numValue > maxDiscount) {
                          setDiscountError(`مبلغ تخفیف نمی‌تواند بیشتر از ${formatNumber(maxDiscount)} تومان (15% مبلغ کل) باشد`);
                          setDiscounttype(0);
                          setDiscountDisplay("");
                        } else {
                          setDiscountError("");
                          setDiscounttype(numValue);
                          setDiscountDisplay(formatted);
                        }
                      }}
                      onFocus={() => {
                        setIsDiscountFocused(true);
                      }}
                      onBlur={(e) => {
                        setIsDiscountFocused(false);
                        const numValue = parseAmountInput(e.target.value);
                        if (numValue <= 0) {
                          setDiscountDisplay("");
                          setDiscounttype(0);
                          setDiscountError("");
                        } else {
                          setDiscountDisplay(formatAmountInput(e.target.value));
                        }
                      }}
                      placeholder="مقدار تخفیف را وارد کنید"
                      type="text"
                      size="small"
                      error={!!discountError}
                      helperText={discountError || undefined}
                      sx={{
                        flex: 1,
                        minWidth: { xs: "100%", sm: 160 },
                        maxWidth: { sm: 220 },
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "var(--admin-surface-alt)",
                          color: "var(--admin-text)",
                          "& fieldset": {
                            borderColor: discountError ? "#ff4444" : "var(--admin-border)",
                          },
                          "&:hover fieldset": {
                            borderColor: discountError ? "#ff4444" : "var(--admin-accent)",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: discountError ? "#ff4444" : "var(--admin-accent)",
                          },
                        },
                        "& .MuiInputBase-input": {
                          color: "var(--admin-text)",
                          fontSize: { xs: "13px", md: "14px" },
                          padding: { xs: "10px 12px", md: "12px 14px" },
                          textAlign: "right",
                          direction: "ltr"
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "var(--admin-text-secondary)",
                          opacity: 1
                        },
                        "& .MuiFormHelperText-root": {
                          color: "#ff4444",
                          fontSize: { xs: "11px", md: "12px" },
                          marginTop: "4px"
                        }
                      }}
                    />
                      </Box>
                    </CardContent>
                  )}
                  <CardContent sx={{ padding: { xs: "12px", md: "20px" }, paddingTop: 0 }}>
                    {(installmentPaymentEnabled || debtPaymentEnabled || chequePaymentEnabled) && (
                    <Box sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: { xs: 1, md: 2 },
                      flexWrap: { xs: "wrap", sm: "nowrap" },
                    }}>
                    <Typography sx={{ 
                      color: "var(--admin-text)", 
                      fontSize: { xs: "13px", md: "14px" },
                      fontWeight: "500",
                      flexShrink: 0,
                    }}>
                      نوع پرداخت:
                    </Typography>
                    <FormControl component="fieldset" sx={{ flex: 1, minWidth: 0 }}>
                      <RadioGroup
                        row
                        value={paymentType}
                        onChange={(e) => {
                          const next = e.target.value as PaymentType;
                          setPaymentType(next);
                          if (next === 'cash') {
                            setInstallmentCount(2);
                            setInstallmentCalculation(null);
                            installmentCalculationRef.current = null;
                            setInstallmentCreditError('');
                            setSelectedChequeId(null);
                          } else if (next === 'installment') {
                            setDiscounttype(0);
                            setDiscountDisplay('');
                            setDiscountError('');
                            setSelectedChequeId(null);
                          } else if (next === 'cheque') {
                            setSelectedChequeId(null);
                            setSettlementMode("cash_all");
                          }
                        }}
                        sx={{
                          display: "flex",
                          gap: { xs: "4px", md: "12px" },
                          justifyContent: { xs: "flex-start", sm: "flex-end" },
                          flexWrap: "wrap",
                        }}
                      >
                        <FormControlLabel
                          value="cash"
                          control={
                            <Radio
                              size="small"
                              sx={{
                                color: "var(--admin-text-secondary)",
                                "&.Mui-checked": {
                                  color: "var(--admin-accent)"
                                }
                              }}
                            />
                          }
                          label={
                            <Typography sx={{ color: "var(--admin-text)", fontSize: { xs: "12px", md: "14px" } }}>
                              نقدی
                            </Typography>
                          }
                          sx={{ mr: 0, ml: 0 }}
                        />
                        {installmentPaymentEnabled && (
                        <FormControlLabel
                          value="installment"
                          control={
                            <Radio
                              size="small"
                              sx={{
                                color: "var(--admin-text-secondary)",
                                "&.Mui-checked": {
                                  color: "var(--admin-accent)"
                                }
                              }}
                            />
                          }
                          label={
                            <Typography sx={{ color: "var(--admin-text)", fontSize: { xs: "12px", md: "14px" } }}>
                              اقساطی
                            </Typography>
                          }
                          sx={{ mr: 0, ml: 0 }}
                        />
                        )}
                        {debtPaymentEnabled && (
                        <FormControlLabel
                          value="debt"
                          control={
                            <Radio
                              size="small"
                              sx={{
                                color: "var(--admin-text-secondary)",
                                "&.Mui-checked": {
                                  color: "var(--admin-accent)"
                                }
                              }}
                            />
                          }
                          label={
                            <Typography sx={{ color: "var(--admin-text)", fontSize: { xs: "12px", md: "14px" } }}>
                              نسیه
                            </Typography>
                          }
                          sx={{ mr: 0, ml: 0 }}
                        />
                        )}
                        {chequePaymentEnabled && (
                        <FormControlLabel
                          value="cheque"
                          control={
                            <Radio
                              size="small"
                              sx={{
                                color: "var(--admin-text-secondary)",
                                "&.Mui-checked": {
                                  color: "var(--admin-accent)"
                                }
                              }}
                            />
                          }
                          label={
                            <Typography sx={{ color: "var(--admin-text)", fontSize: { xs: "12px", md: "14px" } }}>
                              چک + نقد/کارت
                            </Typography>
                          }
                          sx={{ mr: 0, ml: 0 }}
                        />
                        )}
                      </RadioGroup>
                    </FormControl>
                    </Box>
                    )}
                    {paymentType === 'debt' && (
                      <Box sx={{ mt: { xs: "8px", md: "12px" }, p: { xs: "8px", md: "12px" }, bgcolor: "var(--admin-surface-alt)", borderRadius: "8px" }}>
                        <Typography sx={{ color: "#ff9800", fontSize: { xs: "11px", md: "13px" } }}>
                          فاکتور نسیه — مبلغ به بدهی مشتری اضافه می‌شود و پرداخت نقد/کارت ثبت نمی‌شود.
                        </Typography>
                        {(!phone || phone.trim() === '') && (
                          <Typography sx={{ color: "#e57373", fontSize: { xs: "11px", md: "12px" }, mt: 0.5 }}>
                            شماره تلفن مشتری الزامی است
                          </Typography>
                        )}
                      </Box>
                    )}
                    {chequePaymentEnabled && paymentType === 'cheque' && (
                      <Box sx={{ mt: { xs: "8px", md: "12px" } }}>
                        <Typography sx={{
                          color: "var(--admin-text)",
                          fontSize: { xs: "12px", md: "14px" },
                          fontWeight: 600,
                          mb: 0.5,
                        }}>
                          فروش ترکیبی: چک + نقد/کارت
                        </Typography>
                        <Typography sx={{
                          color: "var(--admin-text-muted)",
                          fontSize: { xs: "11px", md: "13px" },
                          mb: 1,
                        }}>
                          مبلغ فاکتور: {formatNumber(salePayableAmount)} تومان
                          {selectedCheque
                            ? ` — چک: ${formatNumber(selectedChequeAmount)} — باقی‌مانده نقد/کارت: ${formatNumber(chequeRemainder)}`
                            : " — چک را انتخاب کنید؛ باقی‌مانده با نقد یا کارت تسویه می‌شود"}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          <FormControl fullWidth size="small" sx={darkFieldSx} disabled={loadingAvailableCheques}>
                            <InputLabel sx={{ color: "var(--admin-text-muted)" }}>انتخاب چک دریافتی</InputLabel>
                            <Select
                              value={selectedChequeId ?? ""}
                              label="انتخاب چک دریافتی"
                              onChange={(e) =>
                                setSelectedChequeId(e.target.value ? Number(e.target.value) : null)
                              }
                              sx={{
                                color: "var(--admin-text)",
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--admin-border)" },
                              }}
                            >
                              <MenuItem value="">
                                <em>انتخاب کنید</em>
                              </MenuItem>
                              {matchingCheques.map((cheque) => (
                                <MenuItem key={cheque.id} value={cheque.id}>
                                  {formatChequeOptionLabel(cheque)}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <IconButton
                            onClick={() => setChequeCreateOpen(true)}
                            aria-label="ثبت چک جدید"
                            sx={{
                              bgcolor: "var(--admin-icon-bg)",
                              border: "1px solid var(--admin-border)",
                              borderRadius: "10px",
                              color: "var(--admin-accent)",
                              flexShrink: 0,
                            }}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                        {loadingAvailableCheques ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
                            <CircularProgress size={18} sx={{ color: "var(--admin-accent)" }} />
                            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: { xs: "11px", md: "13px" } }}>
                              در حال بارگذاری چک‌های قابل انتخاب...
                            </Typography>
                          </Box>
                        ) : matchingCheques.length === 0 ? (
                          <Typography sx={{ color: "#e57373", fontSize: { xs: "11px", md: "13px" }, mt: 1 }}>
                            چک مناسب یافت نشد — با + چک دریافتی ثبت کنید (مبلغ می‌تواند کمتر از فاکتور باشد).
                          </Typography>
                        ) : null}

                        <Box
                          sx={{
                            mt: 1.5,
                            p: { xs: "8px", md: "12px" },
                            bgcolor: "var(--admin-surface-alt)",
                            borderRadius: "8px",
                            border: "1px solid rgba(33, 150, 243, 0.25)",
                            opacity: selectedCheque ? 1 : 0.7,
                          }}
                        >
                          <Typography sx={{ color: "var(--admin-text)", fontSize: { xs: "11px", md: "13px" }, fontWeight: 600, mb: 1 }}>
                            {chequeRemainder > 0
                              ? `باقی‌مانده را با نقد یا کارت بپردازید: ${formatNumber(chequeRemainder)} تومان`
                              : selectedCheque
                                ? "چک کل مبلغ را پوشش می‌دهد — نقد/کارت صفر ارسال می‌شود"
                                : "پس از انتخاب چک، باقی‌مانده نقد/کارت اینجا مشخص می‌شود"}
                          </Typography>
                          <RadioGroup
                            row
                            value={settlementMode}
                            onChange={(e) => {
                              const mode = e.target.value as SettlementMode;
                              setSettlementMode(mode);
                              setPaymentSplitError("");
                              if (mode === "split") {
                                setCardAmountInput(moneyField(Math.max(0, chequeRemainder)));
                                setCashAmountInput(moneyField(0));
                              }
                            }}
                            sx={{
                              display: "flex",
                              gap: { xs: 0, md: 0.5 },
                              "& .MuiFormControlLabel-root": { mr: 0, ml: 0 },
                            }}
                          >
                            <FormControlLabel
                              value="card_all"
                              disabled={!selectedCheque || chequeRemainder <= 0}
                              control={<Radio size="small" sx={{ color: "var(--admin-text-secondary)", "&.Mui-checked": { color: "var(--admin-accent)" } }} />}
                              label={<Typography sx={{ fontSize: { xs: "11px", md: "13px" } }}>کارت</Typography>}
                            />
                            <FormControlLabel
                              value="cash_all"
                              disabled={!selectedCheque || chequeRemainder <= 0}
                              control={<Radio size="small" sx={{ color: "var(--admin-text-secondary)", "&.Mui-checked": { color: "var(--admin-accent)" } }} />}
                              label={<Typography sx={{ fontSize: { xs: "11px", md: "13px" } }}>نقد</Typography>}
                            />
                            <FormControlLabel
                              value="split"
                              disabled={!selectedCheque || chequeRemainder <= 0}
                              control={<Radio size="small" sx={{ color: "var(--admin-text-secondary)", "&.Mui-checked": { color: "var(--admin-accent)" } }} />}
                              label={<Typography sx={{ fontSize: { xs: "11px", md: "13px" } }}>نقد + کارت</Typography>}
                            />
                          </RadioGroup>
                          {selectedCheque && chequeRemainder > 0 && settlementMode === "split" && (
                            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                              <TextField
                                label="کارت خوان"
                                value={cardAmountInput}
                                onChange={(e) => handleCardAmountChange(e.target.value)}
                                size="small"
                                fullWidth
                                InputLabelProps={{ sx: { color: "var(--admin-text-muted)" } }}
                                sx={darkFieldSx}
                              />
                              <TextField
                                label="نقدی"
                                value={cashAmountInput}
                                onChange={(e) => handleCashAmountChange(e.target.value)}
                                size="small"
                                fullWidth
                                InputLabelProps={{ sx: { color: "var(--admin-text-muted)" } }}
                                sx={darkFieldSx}
                              />
                            </Box>
                          )}
                          {selectedCheque && (
                            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: { xs: "10px", md: "12px" }, mt: 1 }}>
                              ارسال: چک {formatNumber(selectedChequeAmount)}
                              {" + "}نقد {formatNumber(
                                chequeRemainder <= 0
                                  ? 0
                                  : settlementMode === "cash_all"
                                    ? chequeRemainder
                                    : settlementMode === "split"
                                      ? parseAmountInput(cashAmountInput)
                                      : 0,
                              )}
                              {" + "}کارت {formatNumber(
                                chequeRemainder <= 0
                                  ? 0
                                  : settlementMode === "card_all"
                                    ? chequeRemainder
                                    : settlementMode === "split"
                                      ? parseAmountInput(cardAmountInput)
                                      : 0,
                              )}
                              {" = "}{formatNumber(salePayableAmount)}
                            </Typography>
                          )}
                          {paymentSplitError && (
                            <Typography sx={{ color: "#ff4444", fontSize: { xs: "11px", md: "12px" }, mt: 1 }}>
                              {paymentSplitError}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    {installmentPaymentEnabled && paymentType === 'installment' && (
                      <Box sx={{ marginTop: { xs: "12px", md: "16px" } }}>
                        <Typography sx={{ 
                          color: "var(--admin-text)", 
                          fontSize: { xs: "13px", md: "14px" },
                          marginBottom: { xs: "8px", md: "10px" },
                          fontWeight: "500"
                        }}>
                          تعداد اقساط (ماه):
                        </Typography>
                        <TextField
                          value={installmentCount}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            if (value === '' || (Number(value) >= 2 && Number(value) <= 24)) {
                              setInstallmentCount(value === '' ? 2 : Number(value));
                            }
                          }}
                          type="number"
                          inputProps={{ min: 2, max: 24 }}
                          size="small"
                          fullWidth
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "var(--admin-surface-alt)",
                              color: "var(--admin-text)",
                              "& fieldset": {
                                borderColor: "var(--admin-border)",
                              },
                              "&:hover fieldset": {
                                borderColor: "var(--admin-accent)",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "var(--admin-accent)",
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: "var(--admin-text-secondary)",
                            },
                            "& .MuiInputBase-input": {
                              color: "var(--admin-text)",
                              fontSize: { xs: "13px", md: "14px" },
                              padding: { xs: "10px 12px", md: "12px 14px" },
                              textAlign: "right",
                              direction: "ltr"
                            },
                          }}
                        />
                        {installmentCount >= 2 && total > 0 && (
                          <Box sx={{ 
                            marginTop: { xs: "8px", md: "12px" },
                            padding: { xs: "8px", md: "12px" },
                            backgroundColor: "var(--admin-surface-alt)",
                            borderRadius: { xs: "6px", md: "8px" }
                          }}>
                            {!phone || phone.trim() === '' ? (
                              <Typography sx={{ 
                                color: "#ff9800", 
                                fontSize: { xs: "10px", md: "12px" }
                              }}>
                                لطفاً شماره تلفن مشتری را وارد کنید
                              </Typography>
                            ) : calculatingInstallments ? (
                              <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <CircularProgress size={16} sx={{ color: "var(--admin-accent)" }} />
                                <Typography sx={{ 
                                  color: "var(--admin-text-muted)", 
                                  fontSize: { xs: "10px", md: "12px" }
                                }}>
                                  در حال محاسبه...
                                </Typography>
                              </Box>
                            ) : installmentCreditError ? (
                              <Box>
                                <Typography sx={{ 
                                  color: "#ff4444", 
                                  fontSize: { xs: "11px", md: "13px" },
                                  marginBottom: { xs: "4px", md: "6px" },
                                  fontWeight: "600"
                                }}>
                                  ⚠️ {installmentCreditError}
                                </Typography>
                                {installmentCalculation && installmentCalculation.final_total_amount && (
                                  <>
                                    <Typography sx={{ 
                                      color: "var(--admin-text-muted)", 
                                      fontSize: { xs: "10px", md: "12px" },
                                      marginBottom: { xs: "2px", md: "4px" }
                                    }}>
                                      مبلغ مورد نیاز: {formatNumber(Math.floor(installmentCalculation.final_total_amount || 0))} تومان
                                    </Typography>
                                    {(installmentCalculation.user_credit !== undefined ||
                                      installmentCalculation.user_installment_credit !== undefined) && (
                                      <Typography sx={{ 
                                        color: "var(--admin-text-muted)", 
                                        fontSize: { xs: "9px", md: "11px" },
                                        marginBottom: { xs: "2px", md: "4px" }
                                      }}>
                                        اعتبار موجود: {formatNumber(Math.floor(installmentCalculation.user_credit ?? installmentCalculation.user_installment_credit ?? 0))} تومان
                                      </Typography>
                                    )}
                                    {installmentCalculation.credit_shortage != null &&
                                      Math.floor(installmentCalculation.credit_shortage) > 0 && (
                                      <Typography sx={{ 
                                        color: "#ff9800", 
                                        fontSize: { xs: "9px", md: "11px" }
                                      }}>
                                        کمبود اعتبار: {formatNumber(Math.floor(installmentCalculation.credit_shortage))} تومان
                                      </Typography>
                                    )}
                                  </>
                                )}
                              </Box>
                            ) : installmentCalculation ? (
                              <Typography sx={{ 
                                color: "var(--admin-text-muted)", 
                                fontSize: { xs: "10px", md: "12px" }
                              }}>
                                جزئیات اقساط در پایین صفحه نمایش داده می‌شود
                              </Typography>
                            ) : (
                              <>
                                <Typography sx={{ 
                                  color: "var(--admin-accent)", 
                                  fontSize: { xs: "11px", md: "13px" },
                                  marginBottom: { xs: "4px", md: "6px" }
                                }}>
                                  مبلغ هر قسط: {formatNumber(Math.floor((Math.max(0, total - useCreditAmount - discounttype)) / installmentCount))} تومان
                                </Typography>
                                <Typography sx={{ 
                                  color: "var(--admin-text-muted)", 
                                  fontSize: { xs: "10px", md: "12px" }
                                }}>
                                  مبلغ کل: {formatNumber(Math.max(0, total - useCreditAmount - discounttype))} تومان
                                </Typography>
                              </>
                            )}
                          </Box>
                        )}
                      </Box>
                    )}
                    {paymentType === 'cash' && payableNow > 0 && (
                      <Box
                        sx={{
                          marginTop: { xs: "12px", md: "16px" },
                          padding: { xs: "10px", md: "14px" },
                          backgroundColor: "var(--admin-surface-alt)",
                          borderRadius: { xs: "8px", md: "10px" },
                          border: "1px solid rgba(120, 181, 104, 0.25)",
                        }}
                      >
                        <Box sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: { xs: 0.5, md: 1 },
                          flexWrap: { xs: "wrap", md: "nowrap" },
                        }}>
                          <Typography
                            sx={{
                              color: "var(--admin-text)",
                              fontSize: { xs: "12px", md: "14px" },
                              fontWeight: "600",
                              flexShrink: 0,
                            }}
                          >
                            نوع پرداخت:
                          </Typography>
                          <FormControl component="fieldset" sx={{ flex: 1, minWidth: 0 }}>
                            <RadioGroup
                              row
                              value={settlementMode}
                              onChange={(e) => {
                                const mode = e.target.value as SettlementMode;
                                setSettlementMode(mode);
                                setPaymentSplitError("");
                                if (mode === "split") {
                                  setCardAmountInput(moneyField(settlementTarget));
                                  setCashAmountInput(moneyField(0));
                                }
                              }}
                              sx={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: { xs: "flex-start", md: "flex-end" },
                                flexWrap: "nowrap",
                                gap: { xs: 0, md: 0.5 },
                                "& .MuiFormControlLabel-root": { mr: 0, ml: 0 },
                              }}
                            >
                              <FormControlLabel
                                value="card_all"
                                control={
                                  <Radio
                                    size="small"
                                    sx={{
                                      color: "var(--admin-text-secondary)",
                                      "&.Mui-checked": { color: "var(--admin-accent)" },
                                    }}
                                  />
                                }
                                label={
                                  <Typography sx={{ color: "var(--admin-text)", fontSize: { xs: "11px", md: "13px" }, whiteSpace: "nowrap" }}>
                                    کارتخوان
                                  </Typography>
                                }
                              />
                              <FormControlLabel
                                value="cash_all"
                                control={
                                  <Radio
                                    size="small"
                                    sx={{
                                      color: "var(--admin-text-secondary)",
                                      "&.Mui-checked": { color: "var(--admin-accent)" },
                                    }}
                                  />
                                }
                                label={
                                  <Typography sx={{ color: "var(--admin-text)", fontSize: { xs: "11px", md: "13px" }, whiteSpace: "nowrap" }}>
                                    نقد
                                  </Typography>
                                }
                              />
                              <FormControlLabel
                                value="split"
                                control={
                                  <Radio
                                    size="small"
                                    sx={{
                                      color: "var(--admin-text-secondary)",
                                      "&.Mui-checked": { color: "var(--admin-accent)" },
                                    }}
                                  />
                                }
                                label={
                                  <Typography sx={{ color: "var(--admin-text)", fontSize: { xs: "11px", md: "13px" }, whiteSpace: "nowrap" }}>
                                    کارت + نقد
                                  </Typography>
                                }
                              />
                            </RadioGroup>
                          </FormControl>
                        </Box>
                        {settlementMode === "split" && (
                          <Box sx={{ marginTop: { xs: "8px", md: "10px" }, display: "flex", flexDirection: "column", gap: { xs: "8px", md: "10px" } }}>
                            <TextField
                              label="کارت خوان"
                              placeholder="کارت خوان"
                              value={cardAmountInput}
                              onChange={(e) => handleCardAmountChange(e.target.value)}
                              size="small"
                              fullWidth
                              InputLabelProps={{ sx: { color: "var(--admin-text-muted)" } }}
                              sx={darkFieldSx}
                            />
                            <TextField
                              label="نقدی"
                              placeholder="نقدی"
                              value={cashAmountInput}
                              onChange={(e) => handleCashAmountChange(e.target.value)}
                              size="small"
                              fullWidth
                              InputLabelProps={{ sx: { color: "var(--admin-text-muted)" } }}
                              sx={darkFieldSx}
                            />
                            {!paymentFieldsValid && (
                              <Typography sx={{ color: "#ff4444", fontSize: { xs: "11px", md: "12px" } }}>
                                جمع کارت ({formatNumber(parseAmountInput(cardAmountInput))}) و نقد (
                                {formatNumber(parseAmountInput(cashAmountInput))}) باید برابر{" "}
                                {formatNumber(payableNow)} تومان باشد
                              </Typography>
                            )}
                          </Box>
                        )}
                        {paymentSplitError && (
                          <Typography sx={{ color: "#ff4444", fontSize: { xs: "11px", md: "12px" }, marginTop: "8px" }}>
                            {paymentSplitError}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>

                <Card sx={{ 
                  background: "var(--admin-title-gradient)",
                  borderRadius: { xs: "16px", md: "20px" },
                  marginBottom: { xs: "16px", md: "24px" },
                  border: "1px solid var(--admin-accent-border)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                   transform: "translateY(-2px)",
                  }
                }}>
                  <CardContent sx={{ padding: { xs: "12px", md: "20px" } }}>
                    <Box sx={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: useCreditAmount > 0 ? { xs: "8px", md: "12px" } : 0
                    }}>
                      <Typography sx={{ 
                        color: "var(--admin-stat-on-gradient)", 
                        fontSize: { xs: "13px", md: "16px" }
                      }}>
                        مجموع خرید:
                      </Typography>
                      <Typography sx={{ 
                        color: "var(--admin-stat-on-gradient)", 
                        fontSize: { xs: "18px", md: "21px" }, 
                        fontWeight: "700" 
                      }}>
                        {formatNumber(total)} تومان
                      </Typography>
                    </Box>
                    {backPrice > 0 && <Box sx={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: useCreditAmount > 0 ? { xs: "8px", md: "12px" } : 0
                    }}>
                      <Typography sx={{ 
                        color: "var(--admin-stat-on-gradient)", 
                        fontSize: { xs: "13px", md: "16px" }
                      }}>
                          مبلغ برگشتی :
                      </Typography>
                      <Typography sx={{ 
                        color: "var(--admin-stat-on-gradient)", 
                        fontSize: { xs: "18px", md: "21px" }, 
                        fontWeight: "700" 
                      }}>
                        {formatNumber(backPrice)} تومان
                      </Typography>
                    </Box>}
                    {backPrice > 0 && <Box sx={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: useCreditAmount > 0 ? { xs: "8px", md: "12px" } : 0
                    }}>
                      <Typography sx={{ 
                        color: "var(--admin-stat-on-gradient)", 
                        fontSize: { xs: "13px", md: "16px" }
                      }}>
                        مجموع خرید با کسر برگشتی:
                      </Typography>
                      <Typography sx={{ 
                        color: "var(--admin-stat-on-gradient)", 
                        fontSize: { xs: "18px", md: "21px" }, 
                        fontWeight: "700" 
                      }}>
                        {formatNumber(total - backPrice)} تومان
                      </Typography>
                    </Box>}
                    {(useCreditAmount > 0 || discounttype > 0)  &&  (
                      <Box sx={{ marginTop: { xs: "8px", md: "12px" } }}>
                        <Typography sx={{ 
                          color: "var(--admin-stat-on-gradient)", 
                          fontSize: { xs: "14px", md: "20px" }, 
                          fontWeight: "600"
                        }}>
                          مبلغ نهایی: {formatNumber(Math.max(0, total - useCreditAmount - discounttype))} تومان
                        </Typography>
                      </Box>
                    )}
                    {installmentPaymentEnabled && paymentType === 'installment' && installmentCount >= 2 && (
                      <Box sx={{ 
                        marginTop: { xs: "12px", md: "16px" }, 
                        padding: { xs: "12px", md: "16px" }, 
                        backgroundColor: "rgba(255, 255, 255, 0.12)", 
                        borderRadius: { xs: "12px", md: "16px" },
                        border: "1px solid rgba(255, 255, 255, 0.28)",
                        backdropFilter: "blur(10px)"
                      }}>
                        <Typography sx={{ 
                          color: "var(--admin-stat-on-gradient)", 
                          fontSize: { xs: "12px", md: "14px" },
                          marginBottom: { xs: "4px", md: "6px" }
                        }}>
                          نوع پرداخت: اقساطی ({installmentCount} قسط)
                        </Typography>
                        {/* نمایش پیش پرداخت اگر اولین آیتم payment_type: "cash" باشد */}
                        {installmentCalculation && 
                         installmentCalculation.installment_details && 
                         Array.isArray(installmentCalculation.installment_details) && 
                         installmentCalculation.installment_details.length > 0 &&
                         installmentCalculation.installment_details[0]?.payment_type === "cash" &&
                         Math.floor(installmentCalculation.installment_details[0]?.base_payment || 0) > 0 && (
                          <Typography sx={{ 
                            color: "#fde68a", 
                            fontSize: { xs: "12px", md: "14px" },
                            marginBottom: { xs: "4px", md: "6px" },
                            fontWeight: "600"
                          }}>
                            پیش پرداخت: {formatNumber(Math.floor(installmentCalculation.installment_details[0]?.base_payment || 0))} تومان
                          </Typography>
                        )}
                        <Typography sx={{ 
                          color: "var(--admin-stat-on-gradient)", 
                          fontSize: { xs: "13px", md: "16px" },
                          fontWeight: "600",
                          marginBottom: { xs: "4px", md: "6px" }
                        }}>
                          مبلغ هر قسط: {installmentCalculation && installmentCalculation.installment_amount 
                            ? formatNumber(Math.floor(installmentCalculation.installment_amount)) 
                            : formatNumber(Math.floor((Math.max(0, total - useCreditAmount - discounttype)) / installmentCount))} تومان
                        </Typography>
                        {installmentCalculation && installmentCalculation.final_total_amount && (
                          <Typography sx={{ 
                            color: "rgba(255, 255, 255, 0.88)", 
                            fontSize: { xs: "11px", md: "13px" },
                            marginBottom: { xs: "2px", md: "4px" }
                          }}>
                            مبلغ کل با سود: {formatNumber(Math.floor(installmentCalculation.final_total_amount))} تومان
                          </Typography>
                        )}
                        {installmentCalculation && installmentCalculation.total_amount && (
                          <Typography sx={{ 
                            color: "rgba(255, 255, 255, 0.88)", 
                            fontSize: { xs: "10px", md: "12px" },
                            marginBottom: { xs: "2px", md: "4px" }
                          }}>
                            مبلغ اصلی: {formatNumber(Math.floor(installmentCalculation.total_amount))} تومان
                          </Typography>
                        )}
                        {installmentCalculation &&
                          installmentCalculation.total_interest != null &&
                          Math.floor(installmentCalculation.total_interest) > 0 && (
                          <Typography sx={{ 
                            color: "#fde68a", 
                            fontSize: { xs: "10px", md: "12px" },
                            marginBottom: { xs: "2px", md: "4px" }
                          }}>
                            سود کل: {formatNumber(Math.floor(installmentCalculation.total_interest))} تومان
                            {installmentCalculation.monthly_interest_rate > 0
                              ? ` (${installmentCalculation.monthly_interest_rate}% ماهانه)`
                              : ""}
                          </Typography>
                        )}
                        {(installmentCalculation?.user_credit !== undefined ||
                          installmentCalculation?.user_installment_credit !== undefined) && (
                          <Typography sx={{ 
                            color: installmentCalculation.has_enough_credit ? "#ecfdf5" : "#fecaca", 
                            fontSize: { xs: "10px", md: "12px" },
                            fontWeight: 600,
                          }}>
                            اعتبار کاربر: {formatNumber(Math.floor(installmentCalculation.user_credit ?? installmentCalculation.user_installment_credit ?? 0))} تومان
                            {installmentCalculation.has_enough_credit ? ' ✓' : ' ✗'}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>

                <Button
                  type="button"
                  disabled={
                    !total || 
                    isSubmitting || 
                    (paymentType !== 'debt' && paymentType !== 'cheque' && payableNow > 0 && !paymentFieldsValid) ||
                    (installmentPaymentEnabled && paymentType === 'installment' && (
                      !phone || 
                      phone.trim() === '' || 
                      !!installmentCreditError || 
                      (installmentCalculation && installmentCalculation.has_enough_credit === false) ||
                      !installmentCalculation?.installment_amount ||
                      calculatingInstallments
                    )) ||
                    (paymentType === 'debt' && (!phone || phone.trim() === '')) ||
                    (chequePaymentEnabled && paymentType === 'cheque' && (
                      loadingAvailableCheques ||
                      !selectedChequeId ||
                      (chequeRemainder > 0 && !paymentFieldsValid)
                    ))
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    confirm();
                  }}
                  variant="contained"
                  fullWidth
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={20} sx={{ color: "#fff" }} />
                    ) : (
                      <CheckCircleIcon sx={{ fontSize: { xs: "18px", md: "24px" } }} />
                    )
                  }
                  sx={{
                    color: "#fff",
                    height: { xs: "48px", md: "60px" },
                    borderRadius: { xs: "16px", md: "20px" },
                    marginBottom: { xs: "24px", md: "12px" },
                    background: total && !isSubmitting 
                      ? "linear-gradient(135deg, var(--admin-accent) 0%, var(--admin-accent-hover) 100%)" 
                      : "rgba(120, 181, 104, 0.2)",
                    fontWeight: "700",
                    fontSize: { xs: "15px", md: "19px" },
                    transition: "all 0.3s ease",
                    "&:hover": {
                      color: "#fff",
                      transform: total && !isSubmitting ? "translateY(-3px) scale(1.02)" : "none",
                     
                      background: total && !isSubmitting 
                        ? "linear-gradient(135deg, var(--admin-accent-hover) 0%, var(--admin-accent) 100%)" 
                        : "rgba(120, 181, 104, 0.2)",
                    },
                    "&:disabled": {
                      color: "var(--admin-text-secondary)",
                      background: "var(--admin-menu-hover)",
                    }
                  }}
                >
                  {isSubmitting ? "در حال ثبت..." : "ثبت خرید"}
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
        )}
      </Container>

      {!menuMode && !classicPosMode && showProductListOnMainPage && (
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <SaleProductListPanel
            variant="floating"
            products={items}
            onAddProduct={addProductToCart}
            formatNumber={formatNumber}
          />
        </Box>
      )}

      {/* Floating Action Button — کنار سایدبار راست تا روی منو نرود */}
      {(!menuMode || classicPosMode) && (
      <Button
        data-admin-tour="scan-product"
        onClick={handleOpenModal}
        aria-label="افزودن کالا با اسکن"
        sx={
          classicPosMode
            ? {
                position: "fixed",
                bottom: { xs: "88px", md: "80px" },
                right: {
                  xs: "20px",
                  md: `${ADMIN_SIDEBAR_WIDTH + 16}px`,
                },
                zIndex: 1300,
                borderRadius: "4px",
                width: { xs: "48px", md: "52px" },
                height: { xs: "48px", md: "52px" },
                minWidth: { xs: "48px", md: "52px" },
                bgcolor: "var(--admin-surface)",
                color: "var(--admin-text)",
                border: "1px solid var(--admin-border)",
                fontSize: { xs: "26px", md: "28px" },
                fontWeight: 400,
                lineHeight: 1,
                boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                transition: "background-color 120ms ease, border-color 120ms ease",
                "&:hover": {
                  bgcolor: "var(--admin-surface-alt)",
                  borderColor: "var(--admin-accent)",
                  color: "var(--admin-accent)",
                },
              }
            : {
                position: "fixed",
                bottom: { xs: "88px", md: "80px" },
                right: {
                  xs: "20px",
                  md: `${ADMIN_SIDEBAR_WIDTH + 16}px`,
                },
                zIndex: 1300,
                borderRadius: "50%",
                width: { xs: "56px", md: "72px" },
                height: { xs: "56px", md: "72px" },
                minWidth: { xs: "56px", md: "72px" },
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                fontSize: { xs: "28px", md: "36px" },
                fontWeight: 300,
                lineHeight: 1,
                boxShadow: "0 8px 24px rgba(102, 126, 234, 0.45)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.15)",
                },
              }
        }
      >
        +
      </Button>
      )}

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'var(--admin-surface)',
            p: 3,
            width: '90%',
            maxWidth: '450px',
            borderRadius: '16px',
            border: "1px solid rgba(55, 84, 165, 0.3)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <Typography sx={{ color: 'var(--admin-text)', fontSize: "16px", fontWeight: "700", textAlign: "center", flex: 1 }}>
              اسکن بارکد
            </Typography>
            <IconButton
              onClick={() => setTorchOn(!torchOn)}
              sx={{
                color: "var(--admin-text)",
                backgroundColor: torchOn ? "var(--admin-accent)" : "var(--admin-surface-alt)",
                padding: "6px",
                "&:hover": {
                  backgroundColor: torchOn ? "var(--admin-accent-hover)" : "var(--admin-surface)",
                }
              }}
            >
              {torchOn ? <FlashlightOnIcon sx={{ fontSize: "20px" }} /> : <FlashlightOffIcon sx={{ fontSize: "20px" }} />}
            </IconButton>
          </Box>
          <Box sx={{ 
            backgroundColor: "var(--admin-surface-alt)", 
            borderRadius: "10px", 
            padding: "12px",
            marginBottom: "12px",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative"
          }}>
            {openModal && (
              <SafeBarcodeScanner
                width={250}
                height={250}
                torch={torchOn}
                onUpdate={(err, result) => {
                  if (err) {
                    console.error("Scanner error:", err);
                    return;
                  }
                  if (result) {
                    handleBarcodeScan(result);
                    setOpenModal(false);
                  }
                }}
              />
            )}
          </Box>

          <Typography sx={{ color: 'var(--admin-text)', marginTop: 1, textAlign: "center", fontSize: "12px" }}>
            {scannedCode ? `بارکد اسکن شده: ${scannedCode}` : "بارکد یافت نشد"}
          </Typography>
          <Box sx={{ marginTop: "12px" }}>
            <Input
              inputRef={manualCodeInputRef}
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.keyCode === 13) {
                  e.preventDefault();
                  if (manualCode.trim()) {
                    handleBarcodeScan(null);
                  }
                }
              }}
              placeholder="کد را وارد کنید"
              sx={{ 
                width: '100%', 
                marginTop: '8px', 
                padding: '10px',
                backgroundColor: "var(--admin-surface-alt)",
                borderRadius: "10px",
                color: "var(--admin-text)",
                fontSize: "12px",
                "&::placeholder": {
                  color: "var(--admin-text-secondary)"
                }
              }}
            />
            <Button
              onClick={() => handleBarcodeScan(null)}
              variant="contained"
              fullWidth
              sx={{ 
                marginTop: '12px', 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: 'var(--admin-text)',
                height: "40px",
                borderRadius: "10px",
                fontWeight: "600",
                fontSize: "13px",
                "&:hover": {
                }
              }}
            >
              تایید
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal
        open={saleSuccessOpen}
        onClose={() => setSaleSuccessOpen(false)}
        aria-labelledby="sale-success-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "92%", sm: 420 },
            bgcolor: "var(--admin-surface)",
            borderRadius: "16px",
            boxShadow: 24,
            p: 3,
            textAlign: "center",
            direction: "rtl",
            border: "1px solid var(--admin-menu-hover)",
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 56, color: "#1ab44d", mb: 1.5 }} />
          <Typography id="sale-success-modal" sx={{ fontWeight: 700, fontSize: "18px", color: "var(--admin-text)", mb: 1 }}>
            {lastSaleReceipt?.purchaseId != null ? "خرید با موفقیت ثبت شد" : "خرید در صف آفلاین ثبت شد"}
          </Typography>
          {lastSaleReceipt?.purchaseId != null && (
            <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px", mb: 2 }}>
              شماره فاکتور: {lastSaleReceipt.purchaseId}
            </Typography>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrintLastSaleReceipt}
              sx={{
                bgcolor: "#78b568",
                "&:hover": { bgcolor: "#5a9a4a" },
                borderRadius: "12px",
                py: 1.2,
              }}
            >
              چاپ فاکتور
            </Button>
            <Button
              variant="outlined"
              onClick={() => setSaleSuccessOpen(false)}
              sx={{
                borderColor: "var(--admin-menu-hover)",
                color: "var(--admin-text)",
                borderRadius: "12px",
                py: 1.2,
              }}
            >
              ادامه فروش
            </Button>
          </Box>
        </Box>
      </Modal>

      <ChequeFormSheet
        open={chequeCreateOpen}
        onClose={() => setChequeCreateOpen(false)}
        defaultType="received"
        lockType
        defaultAmount={salePayableAmount}
        defaultPayee={phone}
        onSaved={(cheque) => {
          const amount = parseAmount(cheque.amount);
          setAvailableCheques((prev) => {
            if (prev.some((c) => c.id === cheque.id)) return prev;
            return [cheque, ...prev];
          });
          setChequeCreateOpen(false);
          if (amount > 0 && amount <= salePayableAmount) {
            setSelectedChequeId(cheque.id);
          } else if (amount > salePayableAmount) {
            toast.warn("مبلغ چک بیشتر از مبلغ فاکتور است و قابل انتخاب نیست");
          }
          void loadAvailableCheques();
        }}
      />

      <Dialog
        open={networkWarningOpen}
        onClose={() => setNetworkWarningOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ direction: "rtl", textAlign: "right" }}>بررسی وضعیت اینترنت</DialogTitle>
        <DialogContent>
          <Typography sx={{ direction: "rtl", textAlign: "right", color: "var(--admin-text)" }}>
            {networkWarningMessage || "وضعیت اینترنت خوب نیست و بهتر است در حالت آفلاین بمانید."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ direction: "rtl", justifyContent: "flex-start", px: 2, pb: 2 }}>
          <Button variant="contained" onClick={() => setNetworkWarningOpen(false)}>
            متوجه شدم
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer autoClose={3000} style={{ marginBottom: '76px', borderRadius: "15px" }} position={"bottom-right"} />
    </Box>
  );
}
