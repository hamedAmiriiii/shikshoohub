"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import { Button, Modal, Box, Typography, Table, TableBody, TableContainer, TableHead, TableRow, Paper, IconButton, Input, Card, CardContent, Grid, Container, CircularProgress, TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import DeleteIcon from '@mui/icons-material/Delete';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlashlightOnIcon from '@mui/icons-material/FlashlightOn';
import FlashlightOffIcon from '@mui/icons-material/FlashlightOff';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import SyncIcon from '@mui/icons-material/Sync';
import WarningIcon from '@mui/icons-material/Warning';
import { styled } from '@mui/material/styles';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import { apiRequestError } from '@/app/lib/apiRequestError';
import { toast, ToastContainer } from 'react-toastify';
import { useSearchParams, useRouter } from "next/navigation";
import 'react-toastify/dist/ReactToastify.css';
import PhoneNumberInput from '@/app/coponent/PhoneNumberInput/PhoneNumberInput';
import tokenCode from '@/app/coponent/tokenCode';





const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#1a1d2e",
    color: "#fff",
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
    color: "#fff",
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
  const [isRegisteringUser, setIsRegisteringUser] = useState(false);
  const lastSyncTimeRef = useRef<number>(0);
  const manualCodeInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
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
  }, [pendingPurchases, isSyncing]);

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
        const cachedData = localStorage.getItem('products_cache');
        
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setItems(parsedData);
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
        const res = await apiRequestError("Get", {}, {}, `/api/product-all`, true, true, "");
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
            localStorage.setItem('products_cache', JSON.stringify(res));
            localStorage.setItem('products_cache_timestamp', Date.now().toString());
            console.log('Cache بروزرسانی شد:', res.length, 'محصول');
          } catch (error) {
            console.error('خطا در ذخیره cache:', error);
          }
          
          // بروزرسانی state
          setItems(res);
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

  // محاسبه مبلغ اقساط با سود
  useEffect(() => {
    const calculateInstallments = async () => {
      if (paymentType !== 'installment' || installmentCount < 2 || total <= 0) {
        setInstallmentCalculation(null);
        setInstallmentCreditError('');
        return;
      }

      const totalAmount = Math.max(0, total - useCreditAmount - discounttype);
      if (totalAmount <= 0) {
        setInstallmentCalculation(null);
        setInstallmentCreditError('');
        return;
      }

      // اگر phone وارد نشده، محاسبه نکن (برای خرید اقساطی phone اجباری است)
      if (!phone || phone.trim() === '') {
        setInstallmentCalculation(null);
        setInstallmentCreditError('');
        return;
      }

      setCalculatingInstallments(true);
      setInstallmentCreditError('');
      try {
        const token = tokenCode();
        const requestBody: any = {
          total_amount: totalAmount,
          installment_count: installmentCount
        };

        // اگر phone وارد شده، آن را به request اضافه کن
        if (phone && phone.trim() !== '') {
          requestBody.phone = phone.trim();
        }

        const res = await apiRequestError(
          "Post",
          {},
          requestBody,
          `/api/purchased-products/calculate-installments`,
          false, // نیاز به احراز هویت ندارد (Public)
          true,
          token
        );

        if (res.hasError) {
          console.error("خطا در محاسبه اقساط:", res.errorText);
          
          // بررسی خطای اعتبار ناکافی
          try {
            const errorData = JSON.parse(res.errorText);
            if (errorData.error && errorData.error.includes('اعتبار')) {
              setInstallmentCreditError(errorData.error || 'اعتبار کاربر کافی نیست');
              setInstallmentCalculation({
                ...errorData,
                hasError: true
              });
            } else {
              setInstallmentCreditError('');
              setInstallmentCalculation(null);
            }
          } catch (parseError) {
            // اگر نتوانستیم parse کنیم، فقط خطا را نمایش بده
            if (res.statusCode === 400) {
              setInstallmentCreditError('اعتبار کاربر کافی نیست');
            } else {
              setInstallmentCreditError('');
            }
            setInstallmentCalculation(null);
          }
        } else {
          // بررسی اینکه آیا اعتبار کافی است یا نه
          if (res.has_enough_credit === false) {
            setInstallmentCreditError(res.error || 'اعتبار کاربر کافی نیست');
            setInstallmentCalculation({
              ...res,
              hasError: true
            });
          } else {
            setInstallmentCreditError('');
            setInstallmentCalculation(res);
          }
        }
      } catch (error) {
        console.error("خطا در محاسبه اقساط:", error);
        setInstallmentCalculation(null);
        setInstallmentCreditError('');
      } finally {
        setCalculatingInstallments(false);
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
      
      if (installmentCreditError || (installmentCalculation && installmentCalculation.has_enough_credit === false)) {
        toast.error(installmentCreditError || 'اعتبار کاربر کافی نیست. لطفاً اعتبار کاربر را بررسی کنید.');
        setIsSubmitting(false);
        return;
      }
      
      if (!installmentCalculation) {
        toast.error("لطفاً منتظر بمانید تا محاسبه اقساط انجام شود");
        setIsSubmitting(false);
        return;
      }
    }

    // اگر online است، مستقیماً ارسال کن
    apiRequestError("Post", {}, loadData, `/api/purchased-products`, true, true, "").then((res) => {
     console.log("res : ",res);
     
      if (res.hasError) {
        // اگر خطا بود، در queue ذخیره کن
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
        router.push(`/shikshoo/admin`);
      }
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
      setIsSubmitting(false);
    });
  }, [cart, phone, useCreditAmount, isOnline, pendingPurchases, discounttype, total, formatNumber, paymentType, installmentCount]);

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
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
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
    try {
      const res = await apiRequestError("Get", {}, {}, `/api/purchased-products/credit?phone=${phoneNumber}`, true, true, "");
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
      const res = await apiRequestError("Post", {}, { phone: normalizedPhone }, `/api/customers/register`, true, true, "");

      if (res.hasError) {
        toast.error(res.errorText || "خطا در ثبت کاربر");
        return;
      }

      if (res.already_exists) {
        toast.info(res.message || "کاربر قبلا در شیک‌شو ثبت شده است");
      } else {
        console.log("ddddddddddddd" , res);
        
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
    <Box sx={{ position: 'relative', minHeight: '100vh', direction: "rtl", background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)" }}>
      <Container maxWidth="xl" sx={{ padding: { xs: '12px', md: '24px' }, paddingBottom: { xs: '100px', md: '40px' } }}>

        {/* Offline Status Banner */}
        {!isOnline && (
          <Box sx={{
            backgroundColor: "#ff9800",
            color: "#fff",
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
            onClick={() => router.push('/shikshoo/admin/pending-purchases')}
            sx={{
              backgroundColor: isOnline ? "#2196f3" : "#ff9800",
              color: "#fff",
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
                  color: "#fff",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: { xs: "4px", md: "6px" },
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.3)",
                  }
                }}
              >
                <SyncIcon sx={{ fontSize: { xs: "16px", md: "20px" } }} />
              </IconButton>
            )}
            {isSyncing && (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            )}
          </Box>
        )}

        {cart.length == 0 && <Card id="register-user" sx={{
          backgroundColor: "#1e2330",
          borderRadius: { xs: "16px", md: "20px" },
          border: "1px solid rgba(120, 181, 104, 0.2)",
          marginBottom: { xs: "2px", md: "4px" },
          transition: "all 0.3s ease",
          "&:hover": {
            border: "1px solid rgba(120, 181, 104, 0.3)",
          }
        }}>
          <CardContent sx={{ padding: { xs: "8px", md: "8px" } }}>
            <Typography sx={{
              color: "#fff",
              fontWeight: "700",
              fontSize: { xs: "14px", md: "16px" },
              marginBottom: { xs: "8px", md: "12px" }
            }}>
              
            </Typography>
            <Box sx={{
              display: "flex",
              gap: { xs: "2px", md: "6px" },
              alignItems: "stretch",
              flexDirection: { xs: "column", md: "row" }
            }}>
              <TextField
                value={registerPhone}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^\d]/g, '').slice(0, 11);
                  setRegisterPhone(numericValue);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isRegisteringUser) {
                    e.preventDefault();
                    handleRegisterUser();
                  }
                }}
                placeholder="شماره تلفن مشتری (مثال: 09123456789)"
                type="tel"
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#1a1d2e",
                    color: "#fff",
                    "& fieldset": {
                      borderColor: "#505669",
                    },
                    "&:hover fieldset": {
                      borderColor: "#78b568",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#78b568",
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: "#fff",
                    fontSize: { xs: "13px", md: "14px" },
                    padding: { xs: "10px 12px", md: "12px 14px" },
                    textAlign: "left",
                    direction: "ltr"
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "rgba(255,255,255,0.4)",
                    opacity: 1
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleRegisterUser}
                disabled={isRegisteringUser || registerPhone.length !== 11}
                variant="contained"
                sx={{
                  minWidth: { xs: "100%", md: "140px" },
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #78b568 0%, #5a9a4a 100%)",
                  fontWeight: "700",
                  "&:disabled": {
                    color: "rgba(255,255,255,0.4)",
                    background: "rgba(120, 181, 104, 0.2)",
                  }
                }}
              >
                {isRegisteringUser ? "در حال ثبت..." : "ثبت "}
              </Button>
            </Box>
          </CardContent>
        </Card>}


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
                          color: "#fff", 
                          fontWeight: "700", 
                          backgroundColor: "#0f1117",
                          fontSize: { xs: "13px", md: "17px" },
                          padding: { xs: "12px 16px", md: "18px 28px" },
                          borderBottom: "2px solid rgba(120, 181, 104, 0.3)"
                        }}>
                          کالا
                        </StyledTableCell>
                        <StyledTableCell align="right" sx={{ 
                          color: "#fff", 
                          fontWeight: "700", 
                          backgroundColor: "#0f1117",
                          fontSize: { xs: "13px", md: "17px" },
                          padding: { xs: "12px 16px", md: "18px 28px" },
                          borderBottom: "2px solid rgba(120, 181, 104, 0.3)"
                        }}>
                          قیمت
                        </StyledTableCell>
                        <StyledTableCell align="right" sx={{ 
                          color: "#fff", 
                          fontWeight: "700", 
                          backgroundColor: "#0f1117",
                          fontSize: { xs: "13px", md: "17px" },
                          padding: { xs: "12px 16px", md: "18px 28px" },
                          borderBottom: "2px solid rgba(120, 181, 104, 0.3)"
                        }}>
                          تعداد
                        </StyledTableCell>
                        <StyledTableCell align="right" sx={{ 
                          color: "#fff", 
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
                        borderBottom: "1px solid rgba(120, 181, 104, 0.1)",
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
                        color: "#fff", 
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
                            <Typography sx={{ color: "#999", fontSize: "11px", textDecoration: "line-through" }}>
                              {formatNumber(Number(item.original_sale_price))} تومان
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Typography sx={{ color: "#78b568", fontSize: { xs: "12px", md: "16px" }, fontWeight: "600" }}>
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
                          <Typography sx={{ color: "#78b568", fontWeight: "600", fontSize: { xs: "14px", md: "19px" } }}>
                            {formatNumber(Number(item.sale_price))} تومان
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="right" sx={{ color: "#fff", padding: { xs: "8px 12px", md: "16px 24px" } }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: "6px", md: "12px" }, justifyContent: "flex-end" }}>
                          <IconButton 
                            onClick={() => updateQuantity(item.id, -1)}
                            sx={{ 
                              color: "#fff", 
                              backgroundColor: "#1a1d2e",
                              width: { xs: "24px", md: "32px" },
                              height: { xs: "24px", md: "32px" },
                              fontSize: { xs: "16px", md: "20px" },
                              "&:hover": { backgroundColor: "#78b568" }
                            }}
                          >
                            -
                          </IconButton>
                          <Typography sx={{ 
                            color: "#fff", 
                            minWidth: { xs: "24px", md: "40px" }, 
                            textAlign: "center", 
                            fontSize: { xs: "12px", md: "16px" } 
                          }}>
                            {item.quantity}
                          </Typography>
                          <IconButton 
                            onClick={() => updateQuantity(item.id, 1)}
                            sx={{ 
                              color: "#fff", 
                              backgroundColor: "#1a1d2e",
                              width: { xs: "24px", md: "32px" },
                              height: { xs: "24px", md: "32px" },
                              fontSize: { xs: "16px", md: "20px" },
                              "&:hover": { backgroundColor: "#78b568" }
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
            ) : (
              <Card sx={{ 
                backgroundColor: "#1e2330", 
                borderRadius: { xs: "16px", md: "20px" },
                border: "1px solid rgba(120, 181, 104, 0.2)",
                marginBottom: { xs: "12px", md: "0" },
                transition: "all 0.3s ease",
                "&:hover": {
                  border: "1px solid rgba(120, 181, 104, 0.3)",
                }
              }}>
                <CardContent sx={{ 
                  textAlign: "center", 
                  padding: { xs: "24px", md: "48px" } 
                }}>
                  <ShoppingCartIcon sx={{ 
                    fontSize: { xs: "48px", md: "80px" }, 
                    color: backPrice ? "rgba(26, 180, 77, 0.6)" : `rgba(255,255,255,0.6)`, 
                    marginBottom: { xs: "12px", md: "20px" } 
                  }} />
                  <Typography sx={{ 
                    color: backPrice ? "rgba(26, 180, 77, 0.6)" : `rgba(255,255,255,0.6)`, 
                    fontSize: { xs: "14px", md: "20px" } 
                  }}>{
                  backPrice ? `  کالا با موفقیت برگشت خورد   `  : "سبد خرید خالی است" 
                  }
                    
                  </Typography>
                  <Typography sx={{ 
                     color: backPrice ? "rgba(26, 180, 77, 0.6)" : `rgba(255,255,255,0.6)`, 
                    fontSize: { xs: "12px", md: "16px" }, 
                    marginTop: { xs: "6px", md: "12px" } 
                  }}>
                    {
                  backPrice ? `  منتظر کالای جدید   `  : "برای افزودن کالا، روی دکمه + کلیک کنید" 
                  }
                    
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Total and Submit - Desktop Sidebar */}
          {cart.length > 0 && (
            <Grid item xs={12} md={4}>
              <Box sx={{ position: { md: "sticky" }, top: { md: "24px" } }}>
                {/* Phone Number Input */}
                <Card sx={{ 
                  backgroundColor: "#1e2330", 
                  borderRadius: { xs: "16px", md: "20px" },
                  marginBottom: { xs: "16px", md: "24px" },
                  border: "1px solid rgba(120, 181, 104, 0.2)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                   border: "1px solid rgba(120, 181, 104, 0.3)",
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
                        color: "rgba(255,255,255,0.6)", 
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
                        backgroundColor: "#1a1d2e", 
                        borderRadius: { xs: "6px", md: "8px" } 
                      }}>
                        <Typography sx={{ 
                          color: "#78b568", 
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
                        color: "#fff", 
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
                          backgroundColor: "#1a1d2e",
                          color: "#fff",
                          "& fieldset": {
                            borderColor: discountError ? "#ff4444" : "#505669",
                          },
                          "&:hover fieldset": {
                            borderColor: discountError ? "#ff4444" : "#78b568",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: discountError ? "#ff4444" : "#78b568",
                          },
                        },
                        "& .MuiInputBase-input": {
                          color: "#fff",
                          fontSize: { xs: "13px", md: "14px" },
                          padding: { xs: "10px 12px", md: "12px 14px" },
                          textAlign: "right",
                          direction: "ltr"
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "rgba(255,255,255,0.4)",
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
                      color: "#fff", 
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
                                color: "#505669",
                                "&.Mui-checked": {
                                  color: "#78b568"
                                }
                              }}
                            />
                          }
                          label={
                            <Typography sx={{ color: "#fff", fontSize: { xs: "12px", md: "14px" } }}>
                              نقدی
                            </Typography>
                          }
                        />
                        <FormControlLabel
                          value="installment"
                          control={
                            <Radio
                              sx={{
                                color: "#505669",
                                "&.Mui-checked": {
                                  color: "#78b568"
                                }
                              }}
                            />
                          }
                          label={
                            <Typography sx={{ color: "#fff", fontSize: { xs: "12px", md: "14px" } }}>
                              اقساطی
                            </Typography>
                          }
                        />
                      </RadioGroup>
                    </FormControl>
                    {paymentType === 'installment' && (
                      <Box sx={{ marginTop: { xs: "12px", md: "16px" } }}>
                        <Typography sx={{ 
                          color: "#fff", 
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
                              backgroundColor: "#1a1d2e",
                              color: "#fff",
                              "& fieldset": {
                                borderColor: "#505669",
                              },
                              "&:hover fieldset": {
                                borderColor: "#78b568",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "#78b568",
                              },
                            },
                            "& .MuiInputBase-input": {
                              color: "#fff",
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
                            backgroundColor: "#1a1d2e",
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
                                <CircularProgress size={16} sx={{ color: "#78b568" }} />
                                <Typography sx={{ 
                                  color: "rgba(255,255,255,0.7)", 
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
                                      color: "rgba(255,255,255,0.7)", 
                                      fontSize: { xs: "10px", md: "12px" },
                                      marginBottom: { xs: "2px", md: "4px" }
                                    }}>
                                      مبلغ مورد نیاز: {formatNumber(Math.floor(installmentCalculation.final_total_amount || 0))} تومان
                                    </Typography>
                                    {installmentCalculation.user_credit !== undefined && (
                                      <Typography sx={{ 
                                        color: "rgba(255,255,255,0.6)", 
                                        fontSize: { xs: "9px", md: "11px" },
                                        marginBottom: { xs: "2px", md: "4px" }
                                      }}>
                                        اعتبار موجود: {formatNumber(Math.floor(installmentCalculation.user_credit || 0))} تومان
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
                                color: "rgba(255,255,255,0.7)", 
                                fontSize: { xs: "10px", md: "12px" }
                              }}>
                                جزئیات اقساط در پایین صفحه نمایش داده می‌شود
                              </Typography>
                            ) : (
                              <>
                                <Typography sx={{ 
                                  color: "#78b568", 
                                  fontSize: { xs: "11px", md: "13px" },
                                  marginBottom: { xs: "4px", md: "6px" }
                                }}>
                                  مبلغ هر قسط: {formatNumber(Math.floor((Math.max(0, total - useCreditAmount - discounttype)) / installmentCount))} تومان
                                </Typography>
                                <Typography sx={{ 
                                  color: "rgba(255,255,255,0.7)", 
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
                  </CardContent>
                </Card>

                <Card sx={{ 
                  background: "linear-gradient(135deg, #78b568 0%, #5a9a4a 50%, #4a7c3a 100%)",
                  borderRadius: { xs: "16px", md: "20px" },
                  marginBottom: { xs: "16px", md: "24px" },
                  border: "1px solid rgba(120, 181, 104, 0.3)",
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
                        color: "rgba(255,255,255,0.9)", 
                        fontSize: { xs: "13px", md: "16px" }
                      }}>
                        مجموع خرید:
                      </Typography>
                      <Typography sx={{ 
                        color: "#fff", 
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
                        color: "rgba(255,255,255,0.9)", 
                        fontSize: { xs: "13px", md: "16px" }
                      }}>
                          مبلغ برگشتی :
                      </Typography>
                      <Typography sx={{ 
                        color: "#fff", 
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
                        color: "rgba(255,255,255,0.9)", 
                        fontSize: { xs: "13px", md: "16px" }
                      }}>
                        مجموع خرید با کسر برگشتی:
                      </Typography>
                      <Typography sx={{ 
                        color: "#fff", 
                        fontSize: { xs: "18px", md: "21px" }, 
                        fontWeight: "700" 
                      }}>
                        {formatNumber(total - backPrice)} تومان
                      </Typography>
                    </Box>}
                    {(useCreditAmount > 0 || discounttype > 0)  &&  (
                      <Box sx={{ marginTop: { xs: "8px", md: "12px" } }}>
                        <Typography sx={{ 
                          color: "#fff", 
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
                        backgroundColor: "rgba(120, 181, 104, 0.1)", 
                        borderRadius: { xs: "12px", md: "16px" },
                        border: "1px solid rgba(120, 181, 104, 0.2)",
                        backdropFilter: "blur(10px)"
                      }}>
                        <Typography sx={{ 
                          color: "#fff", 
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
                            color: "#ff9800", 
                            fontSize: { xs: "12px", md: "14px" },
                            marginBottom: { xs: "4px", md: "6px" },
                            fontWeight: "600"
                          }}>
                            پیش پرداخت: {formatNumber(Math.floor(installmentCalculation.installment_details[0]?.base_payment || 0))} تومان
                          </Typography>
                        )}
                        <Typography sx={{ 
                          color: "rgba(255,255,255,0.9)", 
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
                            color: "rgba(255,255,255,0.7)", 
                            fontSize: { xs: "11px", md: "13px" },
                            marginBottom: { xs: "2px", md: "4px" }
                          }}>
                            مبلغ کل با سود: {formatNumber(Math.floor(installmentCalculation.final_total_amount))} تومان
                          </Typography>
                        )}
                        {installmentCalculation && installmentCalculation.total_amount && (
                          <Typography sx={{ 
                            color: "rgba(255,255,255,0.6)", 
                            fontSize: { xs: "10px", md: "12px" },
                            marginBottom: { xs: "2px", md: "4px" }
                          }}>
                            مبلغ اصلی: {formatNumber(Math.floor(installmentCalculation.total_amount))} تومان
                          </Typography>
                        )}
                        {installmentCalculation && installmentCalculation.total_interest !== undefined && (
                          <Typography sx={{ 
                            color: "#ff9800", 
                            fontSize: { xs: "10px", md: "12px" },
                            marginBottom: { xs: "2px", md: "4px" }
                          }}>
                            سود کل: {formatNumber(Math.floor(installmentCalculation.total_interest || 0))} تومان ({installmentCalculation.monthly_interest_rate || 0}% ماهانه)
                          </Typography>
                        )}
                        {installmentCalculation && installmentCalculation.user_credit !== undefined && (
                          <Typography sx={{ 
                            color: installmentCalculation.has_enough_credit ? "#78b568" : "#ff4444", 
                            fontSize: { xs: "10px", md: "12px" }
                          }}>
                            اعتبار کاربر: {formatNumber(Math.floor(installmentCalculation.user_credit || 0))} تومان
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
                    (paymentType === 'installment' && (
                      !phone || 
                      phone.trim() === '' || 
                      !!installmentCreditError || 
                      (installmentCalculation && installmentCalculation.has_enough_credit === false) ||
                      !installmentCalculation ||
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
                    background: total && !isSubmitting 
                      ? "linear-gradient(135deg, #78b568 0%, #5a9a4a 100%)" 
                      : "rgba(120, 181, 104, 0.2)",
                    fontWeight: "700",
                    fontSize: { xs: "15px", md: "19px" },
                    transition: "all 0.3s ease",
                   
                    "&:hover": {
                      transform: total && !isSubmitting ? "translateY(-3px) scale(1.02)" : "none",
                     
                      background: total && !isSubmitting 
                        ? "linear-gradient(135deg, #5a9a4a 0%, #78b568 100%)" 
                        : "rgba(120, 181, 104, 0.2)",
                    },
                    "&:disabled": {
                      color: "rgba(255,255,255,0.3)",
                      background: "rgba(120, 181, 104, 0.1)",
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
        <QrCodeScannerIcon sx={{ fontSize: { xs: "28px", md: "36px" } }} />
      </Button>


      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: '#2b3143',
            p: 3,
            width: '90%',
            maxWidth: '450px',
            borderRadius: '16px',
            border: "1px solid rgba(55, 84, 165, 0.3)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <Typography sx={{ color: '#fff', fontSize: "16px", fontWeight: "700", textAlign: "center", flex: 1 }}>
              اسکن بارکد
            </Typography>
            <IconButton
              onClick={() => setTorchOn(!torchOn)}
              sx={{
                color: "#fff",
                backgroundColor: torchOn ? "#78b568" : "#1a1d2e",
                padding: "6px",
                "&:hover": {
                  backgroundColor: torchOn ? "#5a9a4a" : "#2b3143",
                }
              }}
            >
              {torchOn ? <FlashlightOnIcon sx={{ fontSize: "20px" }} /> : <FlashlightOffIcon sx={{ fontSize: "20px" }} />}
            </IconButton>
          </Box>
          <Box sx={{ 
            backgroundColor: "#1a1d2e", 
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

          <Typography sx={{ color: '#fff', marginTop: 1, textAlign: "center", fontSize: "12px" }}>
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
                backgroundColor: "#1a1d2e",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "12px",
                "&::placeholder": {
                  color: "rgba(255,255,255,0.5)"
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
                color: '#fff',
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
