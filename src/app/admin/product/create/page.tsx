

"use client";
import tokenCode from "@/app/coponent/tokenCode";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast, ToastContainer } from "react-toastify";

import "react-multi-date-picker/styles/layouts/mobile.css"
import {
  Box,
  Button,
  Typography,
  IconButton,
  Grid,
  Card,
  CardMedia,
  Chip,
  Checkbox,
  Collapse,
  Paper,
  Modal,
  TextField,
  Input,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import FlashlightOnIcon from '@mui/icons-material/FlashlightOn';
import FlashlightOffIcon from '@mui/icons-material/FlashlightOff';
import SearchIcon from '@mui/icons-material/Search';
import SafeBarcodeScanner from "@/app/coponent/SafeBarcodeScanner";
import TextInput from "@/app/coponent/TextInput/TextInput";
import { useRouter } from "next/navigation";
import 'react-toastify/dist/ReactToastify.css';
import { appendProductLabelPrintParams } from "@/app/lib/productLabelPrint";
import { readAdminPosSettings } from "@/app/lib/adminPosSettings";
import type { ProductUnitType } from "@/app/lib/productUnits";
import { ToggleButton, ToggleButtonGroup, FormControl, FormLabel } from "@mui/material";

const PROFIT_STORAGE_KEY = "admin_product_profit_percent";
const DEFAULT_PROFIT_PERCENT = 45;

function readStoredProfitPercent(): number {
  if (typeof window === "undefined") return DEFAULT_PROFIT_PERCENT;
  try {
    const raw = window.localStorage.getItem(PROFIT_STORAGE_KEY);
    const n = parseFloat(raw || "");
    if (!Number.isNaN(n) && n >= 0) return n;
  } catch {
    /* ignore */
  }
  return DEFAULT_PROFIT_PERCENT;
}

function saveStoredProfitPercent(value: number) {
  try {
    window.localStorage.setItem(PROFIT_STORAGE_KEY, String(value));
  } catch {
    /* ignore */
  }
}

/** استخراج آرایه از پاسخ‌های مختلف API */
function extractApiList(res: unknown, listKeys: string[] = []): any[] {
  if (!res || typeof res !== "object") return [];
  const r = res as Record<string, unknown>;
  if (r.hasError) return [];

  if (Array.isArray(res)) return res as any[];

  if (Array.isArray(r.data)) return r.data as any[];

  const nested = r.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const d = nested as Record<string, unknown>;
    if (Array.isArray(d.data)) return d.data as any[];
    for (const key of listKeys) {
      if (Array.isArray(d[key])) return d[key] as any[];
    }
  }

  for (const key of listKeys) {
    if (Array.isArray(r[key])) return r[key] as any[];
  }

  return [];
}

export default function Page() {
  const router = useRouter();
  const [phon, setPhon] = useState("");
  const [full_name, setfull_name] = useState("");
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchase_price, setPurchase_price] = useState("");
  const [sale_price, setPale_price] = useState("");
  const [profitPercentage, setProfitPercentage] = useState(String(DEFAULT_PROFIT_PERCENT));
  const [discountPercent, setDiscountPercent] = useState(""); // درصد تخفیف
  const [images, setImages] = useState<string[]>([]); // آرایه عکس‌های base64
  const [categoryIds, setCategoryIds] = useState<number[]>([]); // آرایه ID دسته‌بندی‌ها
  const [categories, setCategories] = useState<any[]>([]); // لیست دسته‌بندی‌ها
  const [manufacturerId, setManufacturerId] = useState<number | "">(""); // ID تولیدکننده
  const [manufacturers, setManufacturers] = useState<any[]>([]); // لیست تولیدکنندگان
  const [categorySearch, setCategorySearch] = useState("");
  const [manufacturerSearch, setManufacturerSearch] = useState("");
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [manufacturersLoading, setManufacturersLoading] = useState(true);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scanManualCode, setScanManualCode] = useState("");
  const barcodeScanInputRef = useRef<HTMLInputElement>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<{
    id?: number;
    name: string;
    barcode: string;
    sale_price: string | number;
    quantity: string | number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kgSalesEnabled, setKgSalesEnabled] = useState(false);
  const [unitType, setUnitType] = useState<ProductUnitType>("piece");

  useEffect(() => {
    setKgSalesEnabled(readAdminPosSettings().kgSalesEnabled);
    setProfitPercentage(String(readStoredProfitPercent()));
  }, []);

  const applyScannedBarcode = useCallback((code: string) => {
    const trimmed = code.trim().slice(0, 255);
    if (!trimmed) return;
    setBarcode(trimmed);
    setBarcodeScannerOpen(false);
    setScanManualCode("");
    setTorchOn(false);
    toast.success("بارکد ثبت شد");
  }, []);

  const handleBarcodeScanResult = useCallback(
    (result: { text?: string } | null, manual?: string) => {
      const code = result?.text ?? manual ?? "";
      if (code.trim()) {
        applyScannedBarcode(code);
      }
    },
    [applyScannedBarcode],
  );

  const onChangePhone = (e) => {
    setPhon(!e.startsWith("0") ? "0" + e : e)
  }

  // دریافت لیست دسته‌بندی‌ها
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const token = tokenCode();
        if (!token) {
          setCategories([]);
          return;
        }
        const res = await FetchWithJwtClient("GET", "/api/category?tree=true", token);

        if (res?.hasError) {
          const msg = res.message || "خطا در دریافت دسته‌بندی‌ها";
          toast.error(typeof msg === "string" ? msg : "خطا در دریافت دسته‌بندی‌ها");
          setCategories([]);
          return;
        }

        const list = extractApiList(res, ["categories", "tree", "items"]);
        setCategories(list);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("خطا در دریافت دسته‌بندی‌ها");
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // دریافت لیست تولیدکنندگان
  useEffect(() => {
    const fetchManufacturers = async () => {
      setManufacturersLoading(true);
      try {
        const token = tokenCode();
        if (!token) {
          setManufacturers([]);
          return;
        }
        const res = await FetchWithJwtClient("GET", "/api/manufacturers", token);

        if (res?.hasError) {
          const msg = res.message || "خطا در دریافت تولیدکنندگان";
          toast.error(typeof msg === "string" ? msg : "خطا در دریافت تولیدکنندگان");
          setManufacturers([]);
          return;
        }

        const list = extractApiList(res, ["manufacturers", "items"]);
        setManufacturers(list);
      } catch (error) {
        console.error("Error fetching manufacturers:", error);
        toast.error("خطا در دریافت تولیدکنندگان");
        setManufacturers([]);
      } finally {
        setManufacturersLoading(false);
      }
    };

    fetchManufacturers();
  }, []);

  // تبدیل درخت به لیست مسطح برای پیدا کردن نام دسته‌بندی
  const flattenCategories = (cats: any[]): any[] => {
    let result: any[] = [];
    cats.forEach(cat => {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children));
      }
    });
    return result;
  };

  const filterCategoryTree = useCallback((cats: any[], query: string): any[] => {
    const q = query.trim().toLowerCase();
    if (!q) return cats;

    return cats.reduce<any[]>((acc, cat) => {
      const nameMatch = String(cat.name || "").toLowerCase().includes(q);
      const filteredChildren = cat.children?.length ? filterCategoryTree(cat.children, query) : [];
      if (nameMatch || filteredChildren.length > 0) {
        acc.push({
          ...cat,
          children: filteredChildren.length > 0 ? filteredChildren : cat.children,
        });
      }
      return acc;
    }, []);
  }, []);

  const filteredCategories = useMemo(
    () => filterCategoryTree(categories, categorySearch),
    [categories, categorySearch, filterCategoryTree],
  );

  const filteredManufacturers = useMemo(() => {
    const q = manufacturerSearch.trim().toLowerCase();
    if (!q) return manufacturers;
    return manufacturers.filter((m) => String(m.name || "").toLowerCase().includes(q));
  }, [manufacturers, manufacturerSearch]);

  // کامپوننت درختی برای نمایش دسته‌بندی‌ها
  const CategoryTreeItem = ({
    category,
    level = 0,
    forceExpanded = false,
  }: {
    category: any;
    level?: number;
    forceExpanded?: boolean;
  }) => {
    const [expanded, setExpanded] = useState(forceExpanded);
    const hasChildren = category.children && category.children.length > 0;
    const isSelected = categoryIds.includes(category.id);

    useEffect(() => {
      if (forceExpanded) setExpanded(true);
    }, [forceExpanded]);

    const handleToggle = () => {
      if (hasChildren) {
        setExpanded(!expanded);
      }
    };

    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      event.stopPropagation();
      if (event.target.checked) {
        setCategoryIds([...categoryIds, category.id]);
      } else {
        setCategoryIds(categoryIds.filter(id => id !== category.id));
      }
    };

    return (
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: { xs: '8px 12px', md: '4px 8px' },
            paddingRight: { xs: `${12 + level * 24}px`, md: `${8 + level * 16}px` },
            cursor: hasChildren ? 'pointer' : 'default',
            '&:hover': {
              backgroundColor: 'var(--admin-menu-hover)',
            },
          }}
          onClick={handleToggle}
        >
          {hasChildren ? (
            expanded ? (
              <ExpandMoreIcon sx={{ color: 'var(--admin-accent)', fontSize: { xs: 20, md: 14 }, marginLeft: { xs: '8px', md: '4px' } }} />
            ) : (
              <ChevronRightIcon sx={{ color: 'var(--admin-accent)', fontSize: { xs: 20, md: 14 }, marginLeft: { xs: '8px', md: '4px' } }} />
            )
          ) : (
            <Box sx={{ width: { xs: 20, md: 14 }, marginLeft: { xs: '8px', md: '4px' }, flexShrink: 0 }} />
          )}
          <Checkbox
            checked={isSelected}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
            size="small"
            sx={listCheckSx}
          />
          <Typography sx={listTextSx}>
            {category.name}
          </Typography>
        </Box>
        {hasChildren && (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ paddingRight: { xs: '24px', md: '16px' } }}>
              {category.children.map((child: any) => (
                <CategoryTreeItem
                  key={child.id}
                  category={child}
                  level={level + 1}
                  forceExpanded={forceExpanded}
                />
              ))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  // تابع محاسبه قیمت فروش بر اساس قیمت خرید و درصد سود
  const calculateSalePrice = (purchasePrice: string, profitPercent: number) => {
    const value = parseFloat(purchasePrice);
    if (!isNaN(value) && value > 0) {
      // تبدیل درصد به اعشار (45 -> 0.45)
      const profitDecimal = profitPercent / 100;
      let calculatedPrice = value + value * profitDecimal;
      let roundedPrice = Math.round(calculatedPrice / 1000) * 1000;
      let thousandsDigit = Math.floor(roundedPrice / 1000) % 10;
      if (thousandsDigit % 2 === 0) {
        roundedPrice += 1000;
      }
      return roundedPrice.toString();
    }
    return "";
  }

  const parsedProfitPercent = () => {
    const n = parseFloat(profitPercentage);
    return !Number.isNaN(n) && n >= 0 ? n : readStoredProfitPercent();
  };

  // وقتی قیمت خرید تغییر می‌کند
  const handlePurchasePriceChange = (value: string) => {
    setPurchase_price(value);
    if (value) {
      const calculatedSalePrice = calculateSalePrice(value, parsedProfitPercent());
      setPale_price(calculatedSalePrice);
    } else {
      setPale_price("");
    }
  }

  // وقتی درصد سود تغییر می‌کند — خالی ماندن موقع تایپ مجاز است
  const handleProfitPercentageChange = (value: string) => {
    setProfitPercentage(value);
    const percentValue = parseFloat(value);
    if (value.trim() !== "" && !Number.isNaN(percentValue) && percentValue >= 0 && purchase_price) {
      setPale_price(calculateSalePrice(purchase_price, percentValue));
    }
  };

  const commitProfitPercentage = () => {
    const percentValue = parseFloat(profitPercentage);
    if (profitPercentage.trim() === "" || Number.isNaN(percentValue) || percentValue < 0) {
      const fallback = readStoredProfitPercent();
      setProfitPercentage(String(fallback));
      if (purchase_price) {
        setPale_price(calculateSalePrice(purchase_price, fallback));
      }
      return;
    }
    setProfitPercentage(String(percentValue));
    saveStoredProfitPercent(percentValue);
    if (purchase_price) {
      setPale_price(calculateSalePrice(purchase_price, percentValue));
    }
  };

  // تبدیل فایل به base64
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // بررسی نوع فایل
      if (!file.type.startsWith('image/')) {
        toast.error('فقط فایل‌های تصویری مجاز هستند');
        return;
      }

      // بررسی حجم فایل (حداکثر 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم فایل باید کمتر از 5 مگابایت باشد');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        if (base64String) {
          setImages((prev) => [...prev, base64String]);
        }
      };
      reader.onerror = () => {
        toast.error('خطا در خواندن فایل');
      };
      reader.readAsDataURL(file);
    });

    // پاک کردن مقدار input برای امکان انتخاب دوباره همان فایل
    event.target.value = '';
  };

  // حذف عکس
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setBarcode("");
    setPale_price("");
    setPurchase_price("");
    setQuantity("");
    setfull_name("");
    setProfitPercentage(String(readStoredProfitPercent()));
    setDiscountPercent("");
    setImages([]);
    setCategoryIds([]);
    setManufacturerId("");
    setUnitType("piece");
  };

  const handlePrintBarcode = () => {
    if (!createdProduct) return;
    const params = new URLSearchParams({
      name: createdProduct.name,
      barcode: createdProduct.barcode,
      price: String(createdProduct.sale_price),
      quantity: String(createdProduct.quantity || 1),
      from: "create",
    });
    appendProductLabelPrintParams(params, createdProduct);
    setSuccessDialogOpen(false);
    router.push(`/admin/printCustom?${params.toString()}`);
  };

  const handleContinueRegister = () => {
    resetForm();
    setCreatedProduct(null);
    setSuccessDialogOpen(false);
  };

  const confirm = () => {

    if (sale_price && purchase_price && quantity && full_name) {
      if (isSubmitting) return;
      // اعتبارسنجی درصد تخفیف
      if (discountPercent) {
        const discountValue = parseFloat(discountPercent);
        if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
          toast.error("درصد تخفیف باید بین 0 تا 100 باشد");
          return;
        }
      }
      
      // محاسبه discount_percent (همیشه ارسال می‌شود)
      const discountValue = discountPercent ? parseFloat(discountPercent) : 0;
      
      const trimmedBarcode = barcode.trim();
      if (trimmedBarcode.length > 255) {
        toast.error("بارکد حداکثر ۲۵۵ کاراکتر باشد");
        return;
      }

      const qtyNum =
        unitType === "kg" && kgSalesEnabled
          ? parseFloat(String(quantity).replace(/,/g, ""))
          : parseInt(String(quantity).replace(/,/g, ""), 10);

      if (Number.isNaN(qtyNum) || qtyNum < 0) {
        toast.error(unitType === "kg" && kgSalesEnabled ? "موجودی باید عدد معتبر باشد" : "موجودی باید عدد صحیح باشد");
        return;
      }

      let data: any = {
        "name": full_name,
        "purchase_price": purchase_price,
        "sale_price": sale_price,
        "quantity": qtyNum,
        "discount_percent": isNaN(discountValue) ? 0 : discountValue,
      };

      if (kgSalesEnabled) {
        data.unit_type = unitType;
      }

      if (trimmedBarcode.length > 0) {
        data.barcode = trimmedBarcode;
      }

      // اضافه کردن عکس‌ها در صورت وجود
      if (images.length > 0) {
        data.images = images;
      }

      // اضافه کردن دسته‌بندی‌ها در صورت وجود
      if (categoryIds.length > 0) {
        data.category_ids = categoryIds;
      }

      // اضافه کردن تولیدکننده در صورت وجود
      if (manufacturerId && manufacturerId !== "") {
        data.manufacturer_id = manufacturerId;
      }
      const token = tokenCode();
      setIsSubmitting(true);
      apiRequestError("Post", {}, data, "/api/product", true, true, token).then((res) => {
        setIsSubmitting(false);
        if (res.hasError) {
          const parsedResponse = JSON.parse(res.errorText);
          const readableMessage = parsedResponse.message;
          toast.error(readableMessage);
          return;
        }

        const payload = res?.data && typeof res.data === "object" ? res.data : res;
        const productId = payload?.id ?? payload?.product?.id;
        const productBarcode =
          (payload?.barcode && String(payload.barcode).trim()) ||
          trimmedBarcode ||
          (productId != null ? String(productId) : "");
        const productName = payload?.name ?? full_name;

        setCreatedProduct({
          id: productId,
          name: productName,
          barcode: productBarcode,
          sale_price: payload?.sale_price ?? sale_price,
          quantity: payload?.quantity ?? quantity,
        });
        setSuccessDialogOpen(true);
      }).catch(() => {
        setIsSubmitting(false);
        toast.error("خطا در ثبت کالا");
      });



    } else {
      toast.error("تمامی موارد را تکمیل کنید")
    }
  }



  const fieldWrapSx = {
    width: "100%",
    "& > div": { marginTop: 0, width: "100%" },
    "& > div > div:last-of-type > div": { width: "100% !important", maxWidth: "100%" },
    "& .MuiTypography-root": {
      color: "rgba(255,255,255,0.72)",
      fontSize: "11px",
      mb: 0.25,
    },
    "& .MuiOutlinedInput-input": { py: "7px" },
    "& .MuiOutlinedInput-root": { borderRadius: "10px" },
  } as const;

  const optionalColSx = {
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    height: { xs: 210, md: 220 },
  } as const;

  const optionalPanelSx = {
    flex: 1,
    minHeight: 0,
    backgroundColor: "rgba(0,0,0,0.22)",
    border: "1px dashed rgba(244,208,63,0.28)",
    borderRadius: "10px",
    overflow: "auto",
    py: 0.25,
  } as const;

  const chipRowSx = {
    display: "flex",
    flexWrap: "nowrap",
    gap: 0.4,
    overflowX: "auto",
    mb: 0.5,
    minHeight: 22,
    maxHeight: 22,
    "&::-webkit-scrollbar": { display: "none" },
  } as const;

  const chipSx = {
    height: 22,
    backgroundColor: "#e67e22",
    color: "#fff",
    "& .MuiChip-label": { px: 0.75, fontSize: "11px" },
    "& .MuiChip-deleteIcon": { color: "#fff", fontSize: 14 },
  } as const;

  const listCheckSx = {
    color: "var(--admin-accent)",
    p: { md: 0.25 },
    "&.Mui-checked": {
      color: "var(--admin-accent)",
    },
  } as const;

  const listTextSx = {
    color: "var(--admin-text)",
    fontSize: { xs: "14px", md: "10px" },
    flex: 1,
  } as const;

  const panelListRowSx = {
    display: "flex",
    alignItems: "center",
    padding: { xs: "8px 12px", md: "4px 8px" },
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "var(--admin-menu-hover)",
    },
  } as const;

  const panelSearchSx = {
    mb: 0.5,
    "&& .MuiOutlinedInput-root": {
      backgroundColor: "rgba(0,0,0,0.25)",
      color: "var(--admin-text)",
      borderRadius: "10px",
      minHeight: 32,
      "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
      "&:hover fieldset": { borderColor: "#e67e22" },
      "&.Mui-focused fieldset": { borderColor: "#f4d03f" },
    },
    "&& .MuiInputBase-input": { color: "var(--admin-text)", py: 0.55, fontSize: "12px" },
  } as const;

  const barcodeFieldSx = {
    width: "100%",
    "& .MuiOutlinedInput-root": {
      backgroundColor: "rgba(0,0,0,0.28)",
      color: "var(--admin-text)",
      borderRadius: "10px",
      pl: "4px",
      "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
      "&:hover fieldset": { borderColor: "#e67e22" },
      "&.Mui-focused fieldset": { borderColor: "#f4d03f" },
    },
    "& .MuiInputBase-input": {
      color: "var(--admin-text)",
      direction: "ltr",
      textAlign: "left",
      py: "7px",
      fontSize: "13px",
      pl: "40px",
    },
    "& .MuiInputAdornment-root": {
      position: "absolute",
      left: 6,
      right: "auto",
    },
  } as const;

  const colLabelSx = {
    color: "rgba(255,255,255,0.72)",
    fontSize: "11px",
    mb: 0.5,
    flexShrink: 0,
  } as const;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        direction: "rtl",
        background: "var(--admin-bg-gradient)",
        color: "var(--admin-text)",
        px: { xs: 1, md: 2 },
        py: { xs: 1, md: 1.25 },
        pb: { xs: "calc(96px + env(safe-area-inset-bottom, 0px))", md: "16px" },
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          maxWidth: 1180,
          mx: "auto",
        }}
      >
            <Grid container spacing={1} alignItems="flex-end">
              <Grid item xs={12} sm={6}>
                <Box sx={fieldWrapSx}>
                  <TextInput
                    value={full_name}
                    label="نام کالا"
                    onChange={(e) => setfull_name(e)}
                    name="fulname"
                    type="text"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={colLabelSx}>
                  بارکد (اختیاری)
                </Typography>
                <TextField
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value.slice(0, 255))}
                  placeholder="ورود دستی — یکتا در فروشگاه"
                  fullWidth
                  size="small"
                  inputProps={{ maxLength: 255 }}
                  sx={barcodeFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconButton
                          type="button"
                          onClick={() => {
                            setScanManualCode(barcode);
                            setBarcodeScannerOpen(true);
                            setTimeout(() => barcodeScanInputRef.current?.focus(), 150);
                          }}
                          title="اسکن بارکد"
                          size="small"
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "8px",
                            backgroundColor: "var(--admin-accent)",
                            color: "#fff",
                            "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
                          }}
                        >
                          <QrCodeScannerIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <Box sx={fieldWrapSx}>
                  <TextInput
                    value={profitPercentage}
                    label="درصد سود"
                    onChange={(e) => handleProfitPercentageChange(e)}
                    onBlur={commitProfitPercentage}
                    name="profitPercentage"
                    type="number"
                  />
                </Box>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Box sx={fieldWrapSx}>
                  <TextInput
                    value={purchase_price}
                    label="قیمت خرید"
                    onChange={(e) => handlePurchasePriceChange(e)}
                    name="purchase_price"
                    type="number"
                  />
                </Box>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Box sx={fieldWrapSx}>
                  <TextInput
                    value={sale_price}
                    label={kgSalesEnabled && unitType === "kg" ? "قیمت فروش (هر کیلو)" : "قیمت فروش"}
                    onChange={(e) => setPale_price(e)}
                    name="sale_price"
                    type="number"
                  />
                </Box>
              </Grid>
              <Grid item xs={6} sm={kgSalesEnabled ? 2 : 3}>
                <Box sx={fieldWrapSx}>
                  <TextInput
                    value={discountPercent}
                    label="درصد تخفیف (اختیاری)"
                    onChange={(e) => setDiscountPercent(e)}
                    name="discountPercent"
                    type="number"
                  />
                </Box>
              </Grid>
              <Grid item xs={kgSalesEnabled ? 6 : 12} sm={kgSalesEnabled ? 2 : 3}>
                <Box sx={fieldWrapSx}>
                  <TextInput
                    value={quantity}
                    label={
                      kgSalesEnabled && unitType === "kg"
                        ? "موجودی (کیلو)"
                        : "موجودی (عدد)"
                    }
                    onChange={(e) => setQuantity(e)}
                    name="quantity"
                    type="number"
                  />
                </Box>
              </Grid>
              {kgSalesEnabled && (
                <Grid item xs={6} sm={2}>
                  <FormControl component="fieldset" sx={{ width: "100%" }}>
                    <FormLabel sx={colLabelSx}>
                      واحد
                    </FormLabel>
                    <ToggleButtonGroup
                      exclusive
                      value={unitType}
                      onChange={(_, val: ProductUnitType | null) => {
                        if (val) setUnitType(val);
                      }}
                      size="small"
                      fullWidth
                      sx={{
                        "& .MuiToggleButton-root": {
                          color: "#f7efe3",
                          borderColor: "rgba(255,255,255,0.16)",
                          py: 0.4,
                          fontSize: "11px",
                          "&.Mui-selected": {
                            bgcolor: "#e67e22",
                            color: "#fff",
                            "&:hover": { bgcolor: "#d35400" },
                          },
                        },
                      }}
                    >
                      <ToggleButton value="piece">عدد</ToggleButton>
                      <ToggleButton value="kg">کیلو</ToggleButton>
                    </ToggleButtonGroup>
                  </FormControl>
                </Grid>
              )}
            </Grid>

            <Grid container spacing={1} sx={{ mt: 1 }} alignItems="stretch">
              <Grid item xs={12} md={4}>
                <Box sx={optionalColSx}>
                  <Typography sx={colLabelSx}>
                    دسته‌بندی‌ها (اختیاری)
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="جستجو در دسته‌بندی‌ها..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    sx={panelSearchSx}
                    slotProps={{
                      input: {
                        startAdornment: <SearchIcon sx={{ mr: 0.5, fontSize: 16, color: "rgba(255,255,255,0.4)" }} />,
                      },
                    }}
                  />
                  <Paper sx={optionalPanelSx}>
                    {categoryIds.length > 0 && (
                      <Box sx={{ ...chipRowSx, px: 0.75, pt: 0.5 }}>
                        {categoryIds.map((value) => {
                          const flatCats = flattenCategories(categories);
                          const category = flatCats.find((cat) => cat.id === value);
                          return (
                            <Chip
                              key={value}
                              label={category?.name || value}
                              onDelete={() => setCategoryIds(categoryIds.filter((id) => id !== value))}
                              size="small"
                              sx={chipSx}
                            />
                          );
                        })}
                      </Box>
                    )}
                    {categoriesLoading ? (
                      <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", p: 1, textAlign: "center" }}>
                        در حال بارگذاری...
                      </Typography>
                    ) : filteredCategories.length > 0 ? (
                      filteredCategories.map((category) => (
                        <CategoryTreeItem
                          key={category.id}
                          category={category}
                          forceExpanded={!!categorySearch.trim()}
                        />
                      ))
                    ) : (
                      <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", p: 1, textAlign: "center" }}>
                        {categorySearch.trim() ? "موردی یافت نشد" : "دسته‌بندی‌ای یافت نشد"}
                      </Typography>
                    )}
                  </Paper>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={optionalColSx}>
                  <Typography sx={colLabelSx}>
                    تولیدکننده (اختیاری)
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="جستجو در تولیدکنندگان..."
                    value={manufacturerSearch}
                    onChange={(e) => setManufacturerSearch(e.target.value)}
                    sx={panelSearchSx}
                    slotProps={{
                      input: {
                        startAdornment: <SearchIcon sx={{ mr: 0.5, fontSize: 16, color: "rgba(255,255,255,0.4)" }} />,
                      },
                    }}
                  />
                  <Paper sx={optionalPanelSx}>
                    {manufacturerId !== "" && (
                      <Box sx={{ ...chipRowSx, px: 0.75, pt: 0.5 }}>
                        <Chip
                          label={manufacturers.find((m) => m.id === manufacturerId)?.name || manufacturerId}
                          onDelete={() => setManufacturerId("")}
                          size="small"
                          sx={chipSx}
                        />
                      </Box>
                    )}
                    {manufacturersLoading ? (
                      <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", p: 1, textAlign: "center" }}>
                        در حال بارگذاری...
                      </Typography>
                    ) : (
                      <>
                        <Box
                          sx={{
                            ...panelListRowSx,
                            backgroundColor: manufacturerId === "" ? "rgba(244,208,63,0.1)" : "transparent",
                            display:
                              manufacturerSearch.trim() &&
                              !"هیچکدام".toLowerCase().includes(manufacturerSearch.trim().toLowerCase())
                                ? "none"
                                : undefined,
                          }}
                          onClick={() => setManufacturerId("")}
                        >
                          <Checkbox
                            checked={manufacturerId === ""}
                            size="small"
                            sx={listCheckSx}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => setManufacturerId("")}
                          />
                          <Typography sx={listTextSx}>
                            هیچکدام
                          </Typography>
                        </Box>
                        {filteredManufacturers.length > 0 ? (
                          filteredManufacturers.map((manufacturer) => {
                            const isSelected = manufacturerId === manufacturer.id;
                            return (
                              <Box
                                key={manufacturer.id}
                                sx={{
                                  ...panelListRowSx,
                                  backgroundColor: isSelected ? "rgba(244,208,63,0.1)" : "transparent",
                                }}
                                onClick={() => setManufacturerId(manufacturer.id)}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  size="small"
                                  sx={listCheckSx}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => setManufacturerId(isSelected ? "" : manufacturer.id)}
                                />
                                <Typography sx={listTextSx}>
                                  {manufacturer.name}
                                </Typography>
                              </Box>
                            );
                          })
                        ) : !manufacturerSearch.trim() ? (
                          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", p: 1, textAlign: "center" }}>
                            تولیدکننده‌ای یافت نشد
                          </Typography>
                        ) : (
                          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", p: 1, textAlign: "center" }}>
                            موردی یافت نشد
                          </Typography>
                        )}
                      </>
                    )}
                  </Paper>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={optionalColSx}>
                  <Typography sx={colLabelSx}>
                    تصاویر (اختیاری)
                  </Typography>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="image-upload"
                    multiple
                    type="file"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="image-upload" style={{ flexShrink: 0 }}>
                    <Button
                      component="span"
                      variant="outlined"
                      fullWidth
                      size="small"
                      startIcon={<AddPhotoAlternateIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        borderColor: "rgba(244,208,63,0.45)",
                        color: "#f4d03f",
                        borderRadius: "10px",
                        py: 0.45,
                        mb: 0.5,
                        borderStyle: "dashed",
                        fontSize: "12px",
                        minHeight: 32,
                        "&:hover": { borderColor: "#f4d03f", backgroundColor: "rgba(244,208,63,0.08)" },
                      }}
                    >
                      افزودن تصویر
                    </Button>
                  </label>
                  <Paper
                    sx={{
                      ...optionalPanelSx,
                      display: "flex",
                      flexDirection: "column",
                      p: 0.75,
                    }}
                  >
                    {images.length > 0 ? (
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: 0.5,
                          overflow: "auto",
                          minHeight: 0,
                          flex: 1,
                          alignContent: "start",
                        }}
                      >
                        {images.map((image, index) => (
                          <Card key={index} sx={{ position: "relative", borderRadius: "8px", overflow: "hidden" }}>
                            <CardMedia
                              component="img"
                              image={image}
                              alt={`تصویر ${index + 1}`}
                              sx={{ height: 64, objectFit: "cover" }}
                            />
                            <IconButton
                              onClick={() => handleRemoveImage(index)}
                              size="small"
                              sx={{
                                position: "absolute",
                                top: 2,
                                right: 2,
                                p: 0.25,
                                backgroundColor: "rgba(0,0,0,0.55)",
                                color: "#fff",
                                "&:hover": { backgroundColor: "rgba(244,67,54,0.9)" },
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Card>
                        ))}
                      </Box>
                    ) : (
                      <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", textAlign: "center", py: 2 }}>
                        تصویری انتخاب نشده
                      </Typography>
                    )}
                  </Paper>
                </Box>
              </Grid>
            </Grid>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 0.75,
              mt: 1,
            }}
          >
            <Button
              onClick={() => confirm()}
              variant="contained"
              fullWidth
              disabled={isSubmitting}
              sx={{
                flex: { sm: 2 },
                borderRadius: "12px",
                py: 0.85,
                backgroundColor: "var(--admin-accent)",
                color: "#fff",
                fontWeight: 800,
                fontSize: "14px",
                boxShadow: "none",
                "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
              }}
            >
              {isSubmitting ? "در حال ثبت..." : "ثبت کالا"}
            </Button>
            <Button
              onClick={() => router.push("/admin/product")}
              variant="outlined"
              fullWidth
              sx={{
                flex: { sm: 1 },
                borderRadius: "12px",
                py: 0.85,
                borderColor: "var(--admin-border)",
                color: "var(--admin-text)",
                fontWeight: 600,
                fontSize: "13px",
                "&:hover": { borderColor: "var(--admin-accent)", backgroundColor: "var(--admin-menu-hover)" },
              }}
            >
              انصراف
            </Button>
          </Box>
      </Box>

      <Dialog
        open={successDialogOpen}
        onClose={(_, reason) => {
          if (reason === "backdropClick") return;
        }}
        PaperProps={{
          sx: {
            backgroundColor: "var(--admin-surface)",
            borderRadius: "16px",
            border: "1px solid var(--admin-border)",
            minWidth: { xs: "90%", sm: 400 },
          },
        }}
      >
        <DialogTitle sx={{ color: "var(--admin-text)", fontWeight: 700, textAlign: "center", pb: 1 }}>
          ثبت با موفقیت انجام شد
        </DialogTitle>
        <DialogContent>
          {createdProduct && (
            <Box sx={{ textAlign: "center", color: "var(--admin-text-muted)", fontSize: "14px" }}>
              <Typography sx={{ color: "var(--admin-text)", fontWeight: 600, mb: 0.5 }}>
                {createdProduct.name}
              </Typography>
              <Typography sx={{ fontSize: "13px" }}>
                بارکد: {createdProduct.barcode}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: { xs: "column", sm: "row" },
            gap: 1,
            px: 2,
            pb: 2,
            "& > button": { m: 0, width: { xs: "100%", sm: "auto" }, flex: { sm: 1 } },
          }}
        >
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrintBarcode}
            sx={{
              borderRadius: "12px",
              bgcolor: "#1f9ad1",
              fontWeight: 600,
              "&:hover": { bgcolor: "#178bb8" },
            }}
          >
            پرینت بارکد محصول
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleContinueRegister}
            sx={{
              borderRadius: "12px",
              bgcolor: "var(--admin-accent)",
              fontWeight: 600,
              "&:hover": { bgcolor: "var(--admin-accent-hover)" },
            }}
          >
            ادامه ثبت
          </Button>
        </DialogActions>
      </Dialog>

      <Modal
        open={barcodeScannerOpen}
        onClose={() => {
          setBarcodeScannerOpen(false);
          setScanManualCode("");
          setTorchOn(false);
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "var(--admin-surface)",
            p: 3,
            width: "90%",
            maxWidth: "450px",
            borderRadius: "16px",
            border: "1px solid rgba(55, 84, 165, 0.3)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography sx={{ color: "var(--admin-text)", fontSize: "16px", fontWeight: 700, flex: 1, textAlign: "center" }}>
              اسکن بارکد کالا
            </Typography>
            <IconButton
              onClick={() => setTorchOn(!torchOn)}
              sx={{
                color: "var(--admin-text)",
                backgroundColor: torchOn ? "var(--admin-accent)" : "var(--admin-surface-alt)",
                p: 0.75,
                "&:hover": { backgroundColor: torchOn ? "var(--admin-accent-hover)" : "var(--admin-surface)" },
              }}
            >
              {torchOn ? <FlashlightOnIcon /> : <FlashlightOffIcon />}
            </IconButton>
          </Box>
          <Box
            sx={{
              backgroundColor: "var(--admin-surface-alt)",
              borderRadius: "10px",
              p: 1.5,
              mb: 1.5,
              display: "flex",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <SafeBarcodeScanner
              width={250}
              height={250}
              torch={torchOn}
              onUpdate={(err, result) => {
                if (err) return;
                if (result?.text) {
                  handleBarcodeScanResult(result);
                }
              }}
            />
          </Box>
          <Input
            inputRef={barcodeScanInputRef}
            value={scanManualCode}
            onChange={(e) => setScanManualCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleBarcodeScanResult(null, scanManualCode);
              }
            }}
            placeholder="یا بارکد را اینجا وارد کنید"
            fullWidth
            sx={{
              backgroundColor: "var(--admin-surface-alt)",
              borderRadius: "10px",
              color: "var(--admin-text)",
              fontSize: "13px",
              p: 1.25,
              mb: 1,
              direction: "ltr",
              textAlign: "left",
              "&::placeholder": { color: "var(--admin-text-secondary)", opacity: 1 },
            }}
          />
          <Button
            onClick={() => handleBarcodeScanResult(null, scanManualCode)}
            variant="contained"
            fullWidth
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              fontWeight: 600,
              borderRadius: "10px",
            }}
          >
            تایید بارکد
          </Button>
        </Box>
      </Modal>

      <ToastContainer
        autoClose={3000}
        style={{ marginBottom: "56px", borderRadius: "15px" }}
        position="bottom-right"
        rtl
      />
    </Box>
  );
}
