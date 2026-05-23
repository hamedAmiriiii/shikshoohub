"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Button, Modal, Box, Typography, Table, TableBody, TableContainer, TableHead, TableRow, Paper, IconButton, Input, Card, CardContent, Grid, Container, CircularProgress, TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlashlightOnIcon from '@mui/icons-material/FlashlightOn';
import FlashlightOffIcon from '@mui/icons-material/FlashlightOff';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import SyncIcon from '@mui/icons-material/Sync';
import WarningIcon from '@mui/icons-material/Warning';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import TodayIcon from '@mui/icons-material/Today';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PhoneIcon from '@mui/icons-material/Phone';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const SUPPORT_PHONE = "09399166196";
const BALE_PROFILE_URL = "https://ble.ir/AmiriWebino";
const RUBIKA_PROFILE_URL = "https://rubika.ir/WebinoPlus";
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
import { readProductsCountFromCache, PRODUCTS_CACHE_KEY } from '@/app/lib/productsCache';
import { publishAdminSaleCartSnapshot } from '@/app/admin/onboarding/adminSaleCartCheck';
import CategoryIcon from '@mui/icons-material/Category';





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

export default function ShoppingPage() {
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

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
  const [isOnline, setIsOnline] = useState(true);
  const [pendingPurchases, setPendingPurchases] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [paymentType, setPaymentType] = useState<'cash' | 'installment'>('cash'); // نوع پرداخت: نقدی یا اقساطی
  const [installmentCount, setInstallmentCount] = useState<number>(2); // تعداد اقساط (حداقل 2)
  const [installmentCalculation, setInstallmentCalculation] = useState<any>(null); // اطلاعات محاسبه شده اقساط
  const [calculatingInstallments, setCalculatingInstallments] = useState(false); // وضعیت در حال محاسبه
  const [installmentCreditError, setInstallmentCreditError] = useState<string>(''); // خطای اعتبار ناکافی
  const [registerPhone, setRegisterPhone] = useState('');
  const [todayDashboard, setTodayDashboard] = useState<TodayDashboardSnapshot | null>(null);
  const [salesByDay, setSalesByDay] = useState<SalesByDaySnapshot | null>(null);
  const [productsCount, setProductsCount] = useState(0);
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
    if (paymentType === "installment") {
      const calc = installmentCalculation;
      const first = calc?.installment_details?.[0];
      if (first?.payment_type === "cash" && first?.base_payment != null) {
        return Math.floor(Number(first.base_payment));
      }
      return 0;
    }
    return Math.max(0, total - useCreditAmount - discounttype);
  }, [paymentType, total, useCreditAmount, discounttype, installmentCalculation]);

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
        setCashAmountInput(String(payableNow));
        return;
      }
      const card = Math.min(parseAmountInput(sanitized), payableNow);
      setCardAmountInput(String(card));
      setCashAmountInput(String(Math.max(0, payableNow - card)));
    },
    [sanitizeAmountInput, parseAmountInput, payableNow],
  );

  const handleCashAmountChange = useCallback(
    (value: string) => {
      const sanitized = sanitizeAmountInput(value);
      setPaymentSplitError("");
      if (sanitized === "") {
        setCashAmountInput("");
        setCardAmountInput(String(payableNow));
        return;
      }
      const cash = Math.min(parseAmountInput(sanitized), payableNow);
      setCashAmountInput(String(cash));
      setCardAmountInput(String(Math.max(0, payableNow - cash)));
    },
    [sanitizeAmountInput, parseAmountInput, payableNow],
  );

  const resetPaymentSettlement = useCallback(() => {
    setSettlementMode("card_all");
    setCardAmountInput("");
    setCashAmountInput("");
    setPaymentSplitError("");
  }, []);

  const paymentFieldsValid = useMemo(() => {
    if (payableNow <= 0) return true;
    if (settlementMode === "card_all" || settlementMode === "cash_all") return true;
    const card = parseAmountInput(cardAmountInput);
    const cash = parseAmountInput(cashAmountInput);
    return card + cash === payableNow;
  }, [payableNow, settlementMode, cardAmountInput, cashAmountInput, parseAmountInput]);

  useEffect(() => {
    if (payableNow <= 0) {
      setCardAmountInput("");
      setCashAmountInput("");
      setPaymentSplitError("");
      return;
    }
    if (settlementMode === "card_all") {
      setCardAmountInput(String(payableNow));
      setCashAmountInput("0");
      setPaymentSplitError("");
    } else if (settlementMode === "cash_all") {
      setCardAmountInput("0");
      setCashAmountInput(String(payableNow));
      setPaymentSplitError("");
    } else if (settlementMode === "split") {
      const card = Math.min(parseAmountInput(cardAmountInput), payableNow);
      setCashAmountInput(String(Math.max(0, payableNow - card)));
    }
  }, [payableNow, settlementMode, cardAmountInput, parseAmountInput]);

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
      setIsOnline(navigator.onLine);
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
    (parseInt(price) > 0) && setBackPrice(parseInt(price) )
    
  }, [searchParams]);

  const refreshShopDashboard = useCallback(async () => {
    const [todaySnap, salesSnap] = await Promise.all([
      fetchAndCacheTodayDashboard(),
      fetchAndCacheSalesByDay(10),
    ]);
    if (todaySnap) setTodayDashboard(todaySnap);
    if (salesSnap) setSalesByDay(salesSnap);
  }, []);

  useEffect(() => {
    const cachedToday = readTodayDashboardCache();
    const todayKey = getLocalDateKey();
    if (cachedToday?.dateKey === todayKey) {
      setTodayDashboard(cachedToday);
    }
    setSalesByDay(readSalesByDayCache());
    setProductsCount(readProductsCountFromCache());
    void refreshShopDashboard();
  }, [refreshShopDashboard]);

  useEffect(() => {
    if (items.length > 0) {
      setProductsCount(items.length);
    }
  }, [items.length]);

  // بارگذاری خریدهای pending از localStorage
  useEffect(() => {
    try {
      const pending = localStorage.getItem('pending_purchases');
      if (pending) {
        const parsed = JSON.parse(pending);
        if (Array.isArray(parsed)) {
          setPendingPurchases(parsed);
        }
      }
    } catch (error) {
      console.error('خطا در خواندن خریدهای pending:', error);
    }
  }, []);

  // تابع sync برای خریدهای pending
  const syncPendingPurchases = useCallback(async () => {
    if (pendingPurchases.length === 0 || isSyncing) return;
    
    // جلوگیری از sync مکرر - حداقل 5 ثانیه بین هر sync
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTimeRef.current;
    if (timeSinceLastSync < 50000) {
      console.log('Sync خیلی زود است، صبر کنید...');
      return;
    }
    
    setIsSyncing(true);
    lastSyncTimeRef.current = now;
    
    // استفاده از snapshot برای جلوگیری از تغییرات در حین پردازش
    const purchasesToSync = [...pendingPurchases];
    console.log(`شروع sync برای ${purchasesToSync.length} خرید`);
    
    const successful: string[] = [];
    const failed: any[] = [];

    // پردازش همه خریدها به صورت sequential (یکی یکی)
    for (let i = 0; i < purchasesToSync.length; i++) {
      const purchase = purchasesToSync[i];
      console.log(`در حال پردازش خرید ${i + 1} از ${purchasesToSync.length}:`, purchase.id, purchase.data);
      
      try {
        const res = await apiRequestError("Post", {}, purchase.data, `/api/purchased-products`, true, true, "");
        
        if (res.hasError) {
          failed.push(purchase);
          console.log(`خرید ${purchase.id} ناموفق:`, res.errorText);
        } else {
          successful.push(purchase.id);
          console.log(`خرید ${purchase.id} با موفقیت ثبت شد`);
        }
      } catch (error) {
        console.error(`خطا در sync خرید ${purchase.id}:`, error);
        failed.push(purchase);
      }
      
      // یک تاخیر کوچک بین هر درخواست برای جلوگیری از race condition
      if (i < purchasesToSync.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`نتایج sync: ${successful.length} موفق، ${failed.length} ناموفق`);
    console.log('خریدهای موفق:', successful);
    console.log('خریدهای ناموفق:', failed.map(f => f.id));

    // بروزرسانی state و localStorage
    const remaining = failed; // فقط خریدهای ناموفق باقی می‌مانند
    setPendingPurchases(remaining);
    localStorage.setItem('pending_purchases', JSON.stringify(remaining));

    // نمایش پیام‌های مناسب - فقط یک بار
    if (successful.length > 0) {
      void refreshShopDashboard();
    }

    if (successful.length > 0 && failed.length === 0) {
      // همه موفق بودند
      toast.success(`${successful.length} خرید با موفقیت ثبت شد`);
    } else if (successful.length > 0 && failed.length > 0) {
      // بعضی موفق، بعضی ناموفق
      toast.success(`${successful.length} خرید با موفقیت ثبت شد`);
      toast.warn(`${failed.length} خرید هنوز ثبت نشده است`);
    } else if (successful.length === 0 && failed.length > 0) {
      // همه ناموفق بودند - فقط یک بار نمایش بده
      toast.error(`${failed.length} خرید ثبت نشد. لطفاً دوباره تلاش کنید`, {
        toastId: 'sync-failed' // استفاده از toastId برای جلوگیری از نمایش مکرر
      });
    }

    setIsSyncing(false);
  }, [pendingPurchases, isSyncing, refreshShopDashboard]);

  // Auto-sync خریدهای pending وقتی online می‌شود - فقط یک بار
  useEffect(() => {
    // فقط وقتی online می‌شود و خرید pending داریم و در حال sync نیستیم
    if (isOnline && pendingPurchases.length > 0 && !isSyncing) {
      // فقط یک بار sync کن - نه هر بار که state تغییر می‌کند
      const timeSinceLastSync = Date.now() - lastSyncTimeRef.current;
      if (timeSinceLastSync > 5000) {
        syncPendingPurchases();
      }
    }
  }, [isOnline]); // فقط isOnline را track کن، نه pendingPurchases.length

  useEffect(() => {
    let hasCachedData = false;
    
    // خواندن از cache (localStorage) در ابتدا - همیشه از cache استفاده کن
    const loadCachedProducts = () => {
      try {
        const cachedData = localStorage.getItem(PRODUCTS_CACHE_KEY);
        
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setItems(parsedData);
            setProductsCount(parsedData.length);
            hasCachedData = true;
            console.log('محصولات از cache بارگذاری شد:', parsedData.length, 'محصول');
          }
        }
      } catch (error) {
        console.error('خطا در خواندن cache:', error);
      }
    };

    // بارگذاری از cache - همیشه اول cache را بارگذاری کن
    loadCachedProducts();

    // دریافت از API و بروزرسانی cache (بدون پاک کردن cache قدیمی)
    const fetchProducts = async () => {
      try {
        const token = tokenCode();
        const res = await apiRequestError("Get", {}, {}, `/api/product-all`, true, true, token);
        console.log('res : ',res);
        if (res.hasError) {
          // اگر خطا بود و cache داشتیم، از cache استفاده می‌کنیم (قبلاً set شده)
          if (!hasCachedData) {
            toast.error("خطا در دریافت محصولات");
          } else {
            toast.warn("خطا در بروزرسانی محصولات - از cache استفاده می‌شود");
          }
          return;
        }
        
        // فقط در صورت موفقیت، cache را بروزرسانی کن (هرگز پاک نکن)
        if (Array.isArray(res) && res.length > 0) {
          try {
            localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(res));
            localStorage.setItem('products_cache_timestamp', Date.now().toString());
            console.log('Cache بروزرسانی شد:', res.length, 'محصول');
          } catch (error) {
            console.error('خطا در ذخیره cache:', error);
          }
          
          // بروزرسانی state
          setItems(res);
          setProductsCount(res.length);
          console.log('محصولات از API بروزرسانی شد');
        } else {
          console.warn('داده‌های دریافتی معتبر نیستند، cache حفظ می‌شود');
        }
      } catch (error) {
        console.error('خطا در دریافت محصولات:', error);
        // اگر خطا بود و cache داشتیم، از cache استفاده می‌کنیم (قبلاً set شده)
        if (!hasCachedData) {
          toast.error("خطا در دریافت محصولات");
        } else {
          toast.warn("خطا در بروزرسانی محصولات - از cache استفاده می‌شود");
        }
      }
    };

    // دریافت از API در background (بدون پاک کردن cache)
    fetchProducts();
  }, []);

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

  // دیباگ: بررسی تغییرات state
  useEffect(() => {
    console.log("Credit State Updated:", { credit, useCreditAmount, checkingCredit });
  }, [credit, useCreditAmount, checkingCredit]);

  // تابع برای اضافه کردن محصول به سبد از طریق بارکد
  const addProductByBarcode = useCallback((barcode: string) => {
    if (!barcode || barcode.length < 3) return;
    
    const item = items?.find((item) => item.barcode === barcode);
    if (item) {
      setCart((prevCart) => {
        const newCart = [...prevCart];
        const existingItemIndex = newCart.findIndex((i) => i.id === item.id);

        if (existingItemIndex === -1) {
          newCart.push({ ...item, quantity: 1 });
        } else {
          newCart[existingItemIndex].quantity += 1;
        }

        let newTotal = 0;
        newCart.forEach((item) => {
          newTotal += Number(item.sale_price) * item.quantity; 
        });

        setTotal(newTotal);
        return newCart;
      });

      const beep = new Audio("/sound/008.mp3"); 
      beep.play().catch(() => {});

      if (navigator.vibrate) {
        navigator.vibrate(70);
      }
    } else {
      toast.error("محصولی با این بارکد یافت نشد");
    }
  }, [items]);

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
      products: cart.map(item => ({
        product_id: Number(item.id),
        quantity: item.quantity,
        purchase_price: Number(item.purchase_price)
      }))
    };
console.log("discounttype" , discounttype);

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

    if (payableNow > 0) {
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

    // اگر offline است، در queue ذخیره کن
    if (!isOnline) {
      // ساخت ID یکتا با استفاده از timestamp + random + counter
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const counter = pendingPurchases.length;
      const purchaseId = `purchase_${timestamp}_${random}_${counter}`;
      const pendingPurchase = {
        id: purchaseId,
        data: loadData,
        timestamp: timestamp,
        cart: cart,
        total: total,
        phone: phone
      };

      const updatedPending = [...pendingPurchases, pendingPurchase];
      setPendingPurchases(updatedPending);
      
      try {
        localStorage.setItem('pending_purchases', JSON.stringify(updatedPending));
      } catch (error) {
        console.error('خطا در ذخیره خرید pending:', error);
      }

      toast.success("خرید در صف ثبت قرار گرفت (حالت offline)");
      setCart([]);
      setTotal(0);
      setScannedCode("");
      setPhone("");
      setCredit(0);
      setUseCreditAmount(0);
      setDiscounttype(0);
      setDiscountDisplay('');
      setDiscountError('');
      setPaymentType('cash');
      setInstallmentCount(2);
      resetPaymentSettlement();
      setIsSubmitting(false);
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
    // اگر online است، مستقیماً ارسال کن
    apiRequestError("Post", {}, loadData, `/api/purchased-products`, true, true, purchaseToken).then((res) => {
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
          // برای ارور موجودی، خرید را ذخیره نکن و متوقف کن
          setIsSubmitting(false);
          return;
        }

        // اگر خطا بود و موجودی نبود، در queue ذخیره کن
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const counter = pendingPurchases.length;
        const purchaseId = `purchase_${timestamp}_${random}_${counter}`;
        const pendingPurchase = {
          id: purchaseId,
          data: loadData,
          timestamp: timestamp,
          cart: cart,
          total: total,
          phone: phone
        };

        const updatedPending = [...pendingPurchases, pendingPurchase];
        setPendingPurchases(updatedPending);
        
        try {
          localStorage.setItem('pending_purchases', JSON.stringify(updatedPending));
        } catch (error) {
          console.error('خطا در ذخیره خرید pending:', error);
        }

        toast.warn("خرید در صف ثبت قرار گرفت (خطا در ارسال)");
        setCart([]);
        setTotal(0);
        setScannedCode("");
        setPhone("");
        setCredit(0);
        setUseCreditAmount(0);
        setDiscounttype(0);
        setDiscountDisplay('');
        setDiscountError('');
        setPaymentType('cash');
        setInstallmentCount(2);
        resetPaymentSettlement();
        setIsSubmitting(false);
        return;
      }
      // نمایش پیام موفقیت با جزئیات اقساط (اگر اقساطی باشد)
      if (paymentType === 'installment' && res.installments && res.installments.length > 0) {
        const paidCount = res.installments.filter((inst: any) => inst.is_paid).length;
        const totalCount = res.installments.length;
        toast.success(`خرید اقساطی ثبت شد. ${totalCount} قسط ایجاد شد (${paidCount} قسط پرداخت شده)`);
      } else {

        toast.success("خرید ثبت شد");
        router.push(`/admin`);
      }
      void refreshShopDashboard();
      setCart([])
      setTotal(0)
      setScannedCode("")
      setPhone("")
      setCredit(0)
      setUseCreditAmount(0)
      setDiscounttype(0)
      setDiscountDisplay('');
      setDiscountError('');
      setPaymentType('cash');
      setInstallmentCount(2);
      resetPaymentSettlement();
      setIsSubmitting(false);
    }).catch((error) => {
      console.error("Error submitting purchase:", error);
      
      // در صورت خطا، در queue ذخیره کن
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const counter = pendingPurchases.length;
      const purchaseId = `purchase_${timestamp}_${random}_${counter}`;
      const pendingPurchase = {
        id: purchaseId,
        data: loadData,
        timestamp: timestamp,
        cart: cart,
        total: total,
        phone: phone
      };

      const updatedPending = [...pendingPurchases, pendingPurchase];
      setPendingPurchases(updatedPending);
      
      try {
        localStorage.setItem('pending_purchases', JSON.stringify(updatedPending));
      } catch (error) {
        console.error('خطا در ذخیره خرید pending:', error);
      }

      toast.warn("خرید در صف ثبت قرار گرفت (خطا در اتصال)");
      setCart([]);
      setTotal(0);
      setScannedCode("");
      setPhone("");
      setCredit(0);
      setUseCreditAmount(0);
      setDiscounttype(0);
      setDiscountDisplay('');
      setDiscountError('');
      setPaymentType('cash');
      setInstallmentCount(2);
      resetPaymentSettlement();
      setIsSubmitting(false);
    });
  }, [cart, phone, useCreditAmount, isOnline, pendingPurchases, discounttype, total, formatNumber, paymentType, installmentCount, payableNow, paymentFieldsValid, settlementMode, appendPaymentSettlement, resetPaymentSettlement, router, installmentCalculation, calculatingInstallments, installmentCreditError, refreshShopDashboard]);

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

  const checkCredit = async (phoneNumber: string) => {
    setCheckingCredit(true);
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
      const res = await apiRequestError("Post", {}, { phone: normalizedPhone }, `/api/customers/register`, true, true, token);

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
        setCart((prevCart) => {
          const newCart = [...prevCart];
          const existingItemIndex = newCart.findIndex((i) => i.id === item.id);

          if (existingItemIndex === -1) {
            newCart.push({ ...item, quantity: 1 });
          } else {
            newCart[existingItemIndex].quantity += 1;
          }

          let newTotal = 0;
          newCart.forEach((item) => {
            newTotal += Number(item.sale_price) * item.quantity; 
          });

          setTotal(newTotal);
          return newCart;
        });

        const beep = new Audio("/sound/008.mp3"); 
        beep.play();

        if (navigator.vibrate) {
          navigator.vibrate(70);
        }
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
      const updatedCart = prevCart.filter(item => item.id !== itemId);

      // Recalculate total based on updated cart
      let newTotal = 0;
      updatedCart.forEach((item) => {
        newTotal += Number(item.sale_price) * item.quantity;
      });
      setTotal(newTotal);

      return updatedCart;
    });
  };

  // تغییر تعداد کالا (افزایش یا کاهش)
  const updateQuantity = (itemId, increment) => {
    setCart((prevCart) => {
      const newCart = prevCart.map((item) => {
        if (item.id === itemId) {
          const newQuantity = item.quantity + increment;

          if (newQuantity > 0) {
            return { ...item, quantity: newQuantity };
          }
        }
        return item;
      });

      // محاسبه قیمت کل جدید بعد از تغییرات
      let newTotal = 0;
      newCart.forEach((item) => {
        newTotal += Number(item.sale_price) * item.quantity;
      });
      setTotal(newTotal); // بروزرسانی قیمت کل
      return newCart;
    });
  };



  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', direction: "rtl", background: "var(--admin-bg-gradient)" }}>
      <Container maxWidth="xl" sx={{ padding: { xs: '12px', md: '24px' }, paddingBottom: { xs: '140px', md: '56px' } }}>

        {/* Offline Status Banner */}
        {!isOnline && (
          <Box sx={{
            backgroundColor: "#ff9800",
            color: "var(--admin-text)",
            padding: { xs: "8px 12px", md: "12px 20px" },
            borderRadius: { xs: "8px", md: "12px" },
            marginBottom: { xs: "12px", md: "16px" },
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "space-between"
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CloudOffIcon sx={{ fontSize: { xs: "18px", md: "24px" } }} />
              <Typography sx={{ fontSize: { xs: "12px", md: "14px" }, fontWeight: "600" }}>
                حالت Offline - خریدها در صف ثبت قرار می‌گیرند
              </Typography>
            </Box>
          </Box>
        )}

        {/* Pending Purchases Banner */}
        {pendingPurchases.length > 0 && (
          <Box 
            onClick={() => router.push('/admin/pending-purchases')}
            sx={{
              backgroundColor: isOnline ? "#2196f3" : "#ff9800",
              color: "var(--admin-text)",
              padding: { xs: "8px 12px", md: "12px 20px" },
              borderRadius: { xs: "8px", md: "12px" },
              marginBottom: { xs: "12px", md: "16px" },
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: isOnline ? "#1976d2" : "#f57c00",
                transform: "translateY(-2px)",
              }
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
              {isOnline ? (
                <>
                  <CloudQueueIcon sx={{ fontSize: { xs: "18px", md: "24px" } }} />
                  <Typography sx={{ fontSize: { xs: "12px", md: "14px" }, fontWeight: "600" }}>
                    {pendingPurchases.length} خرید در صف ثبت {isSyncing && "(در حال همگام‌سازی...)"} - کلیک برای مشاهده
                  </Typography>
                </>
              ) : (
                <>
                  <WarningIcon sx={{ fontSize: { xs: "18px", md: "24px" } }} />
                  <Typography sx={{ fontSize: { xs: "12px", md: "14px" }, fontWeight: "600" }}>
                    {pendingPurchases.length} خرید در صف ثبت (بعد از اتصال به اینترنت ارسال می‌شود) - کلیک برای مشاهده
                  </Typography>
                </>
              )}
            </Box>
            {isOnline && !isSyncing && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  syncPendingPurchases();
                }}
                sx={{
                  color: "var(--admin-text)",
                  backgroundColor: "var(--admin-icon-bg)",
                  padding: { xs: "4px", md: "6px" },
                  "&:hover": {
                    backgroundColor: "var(--admin-text-secondary)",
                  }
                }}
              >
                <SyncIcon sx={{ fontSize: { xs: "16px", md: "20px" } }} />
              </IconButton>
            )}
            {isSyncing && (
              <CircularProgress size={20} sx={{ color: "var(--admin-text)" }} />
            )}
          </Box>
        )}

        {/* Desktop Layout */}
        <Grid container spacing={3} sx={{ maxWidth: { md: "1400px" }, margin: { md: "0 auto" } }}>
          {/* Cart Items */}
          <Grid item xs={12} md={cart.length > 0 ? 8 : 12}>
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
                      key={item.id}
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
                        {item.has_discount ? (
                          <Box sx={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
                            <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "11px", textDecoration: "line-through" }}>
                              {formatNumber(Number(item.original_sale_price))} تومان
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Typography sx={{ color: "var(--admin-accent)", fontSize: { xs: "12px", md: "16px" }, fontWeight: "600" }}>
                                {formatNumber(Number(item.sale_price))} تومان
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
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="right" sx={{ color: "var(--admin-text)", padding: { xs: "8px 12px", md: "16px 24px" } }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: "6px", md: "12px" }, justifyContent: "flex-end" }}>
                          <IconButton 
                            onClick={() => updateQuantity(item.id, -1)}
                            sx={{ 
                              color: "var(--admin-text)", 
                              backgroundColor: "var(--admin-surface-alt)",
                              width: { xs: "24px", md: "32px" },
                              height: { xs: "24px", md: "32px" },
                              fontSize: { xs: "16px", md: "20px" },
                              "&:hover": { backgroundColor: "var(--admin-accent)" }
                            }}
                          >
                            -
                          </IconButton>
                          <Typography sx={{ 
                            color: "var(--admin-text)", 
                            minWidth: { xs: "24px", md: "40px" }, 
                            textAlign: "center", 
                            fontSize: { xs: "12px", md: "16px" } 
                          }}>
                            {item.quantity}
                          </Typography>
                          <IconButton 
                            onClick={() => updateQuantity(item.id, 1)}
                            sx={{ 
                              color: "var(--admin-text)", 
                              backgroundColor: "var(--admin-surface-alt)",
                              width: { xs: "24px", md: "32px" },
                              height: { xs: "24px", md: "32px" },
                              fontSize: { xs: "16px", md: "20px" },
                              "&:hover": { backgroundColor: "var(--admin-accent)" }
                            }}
                          >
                            +
                          </IconButton>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell align="right" sx={{ padding: { xs: "8px 12px", md: "16px 24px" } }}>
                        <IconButton 
                          onClick={() => removeItemFromCart(item.id)} 
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
            ) : backPrice ? (
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
                          <Box>
                            <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: { xs: "15px", md: "17px" } }}>
                              {todayDashboard?.dateKey === getLocalDateKey()
                                ? "عملکرد امروز"
                                : "آخرین آمار فروش"}
                            </Typography>
                            <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: { xs: "11px", md: "12px" } }}>
                              {todayDashboard
                                ? "بعد از هر خرید به‌روز می‌شود"
                                : "پس از اولین فروش امروز اینجا نمایش داده می‌شود"}
                            </Typography>
                          </Box>
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
                        <SalesByDayChart data={salesByDay} formatNumber={formatNumber} />
                      </CardContent>
                    </Card>
                  </Grid>

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
                              startIcon={<PhoneIcon sx={{ fontSize: 16 }} />}
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
                              startIcon={<SupportAgentIcon sx={{ fontSize: 16 }} />}
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
          {cart.length > 0 && (
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
                  <CardContent sx={{ padding: { xs: "12px", md: "20px" } }}>
                  
                    <PhoneNumberInput
                      name="phone"
                      defaultValue={phone}
                      onChange={onChangePhone}
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
                      <Typography sx={{ 
                        color: "var(--admin-text)", 
                        fontSize: { xs: "13px", md: "14px" },
                        marginBottom: { xs: "8px", md: "10px" },
                        fontWeight: "500"
                      }}>
                        تخفیف (تومان):
                      </Typography>
                      <TextField
                      value={isDiscountFocused ? discountDisplay.replace(/,/g, '') : (discountDisplay || '')}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, ''); // حذف جداکننده‌ها
                        if (value === '' || /^\d+$/.test(value)) {
                          const numValue = value === '' ? 0 : Number(value);
                          
                          // اعتبارسنجی: تخفیف نباید بیشتر از 15% مبلغ کل باشد
                          const maxDiscount = Math.floor(total * 0.15);
                          if (numValue > maxDiscount) {
                            setDiscountError(`مبلغ تخفیف نمی‌تواند بیشتر از ${formatNumber(maxDiscount)} تومان (15% مبلغ کل) باشد`);
                            setDiscounttype(0);
                            setDiscountDisplay('');
                          } else {
                            setDiscountError('');
                            setDiscounttype(numValue);
                            setDiscountDisplay(value === '' ? '' : value);
                          }
                        }
                      }}
                      onFocus={() => {
                        setIsDiscountFocused(true);
                      }}
                      onBlur={(e) => {
                        setIsDiscountFocused(false);
                        const value = e.target.value.replace(/,/g, '');
                        // اگر مقدار خالی است، مطمئن شو که 0 ست شده
                        if (value === '' || value === '0') {
                          setDiscountDisplay('');
                          setDiscounttype(0);
                          setDiscountError('');
                        } else {
                          // فرمت کردن برای نمایش
                          const numValue = Number(value);
                          setDiscountDisplay(new Intl.NumberFormat('fa-IR').format(numValue));
                        }
                      }}
                      placeholder="مقدار تخفیف را وارد کنید"
                      type="text"
                      size="small"
                      fullWidth
                      error={!!discountError}
                      helperText={discountError}
                      sx={{
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
                    </CardContent>
                  )}
                  <CardContent sx={{ padding: { xs: "12px", md: "20px" }, paddingTop: 0 }}>
                    <Typography sx={{ 
                      color: "var(--admin-text)", 
                      fontSize: { xs: "13px", md: "14px" },
                      marginBottom: { xs: "8px", md: "10px" },
                      fontWeight: "500"
                    }}>
                      نوع پرداخت:
                    </Typography>
                    <FormControl component="fieldset" fullWidth>
                      <RadioGroup
                        row
                        value={paymentType}
                        onChange={(e) => {
                          setPaymentType(e.target.value as 'cash' | 'installment');
                          if (e.target.value === 'cash') {
                            setInstallmentCount(2);
                          } else if (e.target.value === 'installment') {
                            // صفر کردن تخفیف در حالت اقساطی
                            setDiscounttype(0);
                            setDiscountDisplay('');
                            setDiscountError('');
                          }
                        }}
                        sx={{
                          display: "flex",
                          gap: { xs: "8px", md: "16px" },
                          justifyContent: "flex-end"
                        }}
                      >
                        <FormControlLabel
                          value="cash"
                          control={
                            <Radio
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
                        />
                        <FormControlLabel
                          value="installment"
                          control={
                            <Radio
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
                        />
                      </RadioGroup>
                    </FormControl>
                    {paymentType === 'installment' && (
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
                                    {installmentCalculation.credit_shortage !== undefined && (
                                      <Typography sx={{ 
                                        color: "#ff9800", 
                                        fontSize: { xs: "9px", md: "11px" }
                                      }}>
                                        کمبود اعتبار: {formatNumber(Math.floor(installmentCalculation.credit_shortage || 0))} تومان
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
                    {payableNow > 0 && (
                      <Box
                        sx={{
                          marginTop: { xs: "12px", md: "16px" },
                          padding: { xs: "10px", md: "14px" },
                          backgroundColor: "var(--admin-surface-alt)",
                          borderRadius: { xs: "8px", md: "10px" },
                          border: "1px solid rgba(120, 181, 104, 0.25)",
                        }}
                      >
                        <Typography
                          sx={{
                            color: "var(--admin-text)",
                            fontSize: { xs: "13px", md: "14px" },
                            fontWeight: "600",
                            marginBottom: { xs: "4px", md: "6px" },
                          }}
                        >
                         نوع پرداخت 
                        </Typography>
                       
                        <FormControl component="fieldset" fullWidth>
                          <RadioGroup
                            value={settlementMode}
                            onChange={(e) => {
                              const mode = e.target.value as SettlementMode;
                              setSettlementMode(mode);
                              setPaymentSplitError("");
                              if (mode === "split") {
                                setCardAmountInput(String(payableNow));
                                setCashAmountInput("0");
                              }
                            }}
                            sx={{ gap: { xs: "2px", md: "4px" } }}
                          >
                            <FormControlLabel
                              value="card_all"
                              control={
                                <Radio
                                  sx={{
                                    color: "var(--admin-text-secondary)",
                                    "&.Mui-checked": { color: "var(--admin-accent)" },
                                  }}
                                />
                              }
                              label={
                                <Typography sx={{ color: "var(--admin-text)", fontSize: { xs: "12px", md: "13px" } }}>
                                  کارتخوان
                                </Typography>
                              }
                            />
                            <FormControlLabel
                              value="cash_all"
                              control={
                                <Radio
                                  sx={{
                                    color: "var(--admin-text-secondary)",
                                    "&.Mui-checked": { color: "var(--admin-accent)" },
                                  }}
                                />
                              }
                              label={
                                <Typography sx={{ color: "var(--admin-text)", fontSize: { xs: "12px", md: "13px" } }}>
                                نقد
                                </Typography>
                              }
                            />
                            <FormControlLabel
                              value="split"
                              control={
                                <Radio
                                  sx={{
                                    color: "var(--admin-text-secondary)",
                                    "&.Mui-checked": { color: "var(--admin-accent)" },
                                  }}
                                />
                              }
                              label={
                                <Typography sx={{ color: "var(--admin-text)", fontSize: { xs: "12px", md: "13px" } }}>
                                  کارت + نقد
                                </Typography>
                              }
                            />
                          </RadioGroup>
                        </FormControl>
                        {settlementMode === "split" && (
                          <Box sx={{ marginTop: { xs: "8px", md: "10px" }, display: "flex", flexDirection: "column", gap: { xs: "8px", md: "10px" } }}>
                            <TextField
                              label="مبلغ کارتخوان (تومان)"
                              value={cardAmountInput}
                              onChange={(e) => handleCardAmountChange(e.target.value)}
                              size="small"
                              fullWidth
                              InputLabelProps={{ sx: { color: "var(--admin-text-muted)" } }}
                              sx={darkFieldSx}
                            />
                            <TextField
                              label="مبلغ نقد / دستی (تومان)"
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
                    { backPrice && <Box sx={{ 
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
                        {formatNumber( backPrice)} تومان
                      </Typography>
                    </Box>}
                    { backPrice && <Box sx={{ 
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
                    {paymentType === 'installment' && installmentCount >= 2 && (
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
                         installmentCalculation.installment_details[0]?.payment_type === "cash" && (
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
                        {installmentCalculation && installmentCalculation.total_interest !== undefined && (
                          <Typography sx={{ 
                            color: "#fde68a", 
                            fontSize: { xs: "10px", md: "12px" },
                            marginBottom: { xs: "2px", md: "4px" }
                          }}>
                            سود کل: {formatNumber(Math.floor(installmentCalculation.total_interest || 0))} تومان ({installmentCalculation.monthly_interest_rate || 0}% ماهانه)
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
                    (payableNow > 0 && !paymentFieldsValid) ||
                    (paymentType === 'installment' && (
                      !phone || 
                      phone.trim() === '' || 
                      !!installmentCreditError || 
                      (installmentCalculation && installmentCalculation.has_enough_credit === false) ||
                      !installmentCalculation?.installment_amount ||
                      calculatingInstallments
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
      </Container>

      {/* Floating Action Button */}
      <Button
        data-admin-tour="scan-product"
        onClick={handleOpenModal}
        sx={{
          position: 'fixed',
          bottom: { xs: '125px', md: '80px' },
          right: { xs: '16px', md: '40px' },
          borderRadius: '50%',
          width: { xs: '56px', md: '72px' },
          height: { xs: '56px', md: '72px' },
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: 'white',
          fontSize: '28px',
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "scale(1.15)",
          }
        }}
      >
        <AddIcon sx={{ fontSize: { xs: "32px", md: "40px" } }} />
      </Button>


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
            <BarcodeScannerComponent
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
      <ToastContainer autoClose={3000} style={{ marginBottom: '76px', borderRadius: "15px" }} position={"bottom-right"} />
    </Box>
  );
}
