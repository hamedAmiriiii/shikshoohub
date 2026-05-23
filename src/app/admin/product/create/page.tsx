

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
  Container,
  Divider,
  Modal,
  TextField,
  Input,
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
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import TextInput from "@/app/coponent/TextInput/TextInput";
import { useRouter } from "next/navigation";
import 'react-toastify/dist/ReactToastify.css';
import { appendProductLabelPrintParams } from "@/app/lib/productLabelPrint";

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
  const [profitPercentage, setProfitPercentage] = useState(45); // درصد سود پیش‌فرض (45%)
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
            sx={{
              color: 'var(--admin-accent)',
              p: { md: 0.25 },
              '&.Mui-checked': {
                color: 'var(--admin-accent)',
              },
            }}
          />
          <Typography sx={{ color: 'var(--admin-text)', fontSize: { xs: '14px', md: '10px' }, flex: 1 }}>
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

  // وقتی قیمت خرید تغییر می‌کند
  const handlePurchasePriceChange = (value: string) => {
    setPurchase_price(value);
    if (value) {
      const calculatedSalePrice = calculateSalePrice(value, profitPercentage);
      setPale_price(calculatedSalePrice);
    } else {
      setPale_price("");
    }
  }

  // وقتی درصد سود تغییر می‌کند
  const handleProfitPercentageChange = (value: string) => {
    const percentValue = parseFloat(value);
    if (!isNaN(percentValue) && percentValue >= 0) {
      setProfitPercentage(percentValue);
      // اگر قیمت خرید وجود داشت، دوباره محاسبه کن
      if (purchase_price) {
        const calculatedSalePrice = calculateSalePrice(purchase_price, percentValue);
        setPale_price(calculatedSalePrice);
      }
    } else if (value === "") {
      setProfitPercentage(45); // اگر خالی شد، به مقدار پیش‌فرض برگرد
    }
  }

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
    setProfitPercentage(45);
    setDiscountPercent("");
    setImages([]);
    setCategoryIds([]);
    setManufacturerId("");
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

      let data: any = {
        "name": full_name,
        "purchase_price": purchase_price,
        "sale_price": sale_price,
        "quantity": quantity,
        "discount_percent": isNaN(discountValue) ? 0 : discountValue,
      };

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



  /** دسکتاپ: حدود ۳۰٪ کوچک‌تر از موبایل */
  const desktopFormCompactSx = {
    md: {
      "& .MuiOutlinedInput-root": { borderRadius: "8px" },
      "& .MuiInputBase-input": {
        py: 0.75,
        px: 1.25,
        fontSize: "0.8rem",
      },
      "& .MuiInputLabel-root": { fontSize: "0.75rem" },
      "& .MuiSelect-select": { py: 0.75, fontSize: "0.8rem" },
      "& .MuiButton-root": {
        fontSize: "0.78rem",
        py: 0.65,
        minHeight: 34,
        borderRadius: "10px",
      },
      "& .MuiIconButton-root": { p: 0.5 },
      "& .MuiCheckbox-root": { p: 0.35 },
      "& .MuiChip-root": { height: 22, fontSize: "0.65rem" },
      "& .MuiDivider-root": { my: "1.25rem !important" },
    },
  } as const;

  const fieldWrapSx = {
    width: "100%",
    "& > div": { marginTop: 0, width: "100%" },
    "& > div > div:last-of-type": { width: "100%" },
    "& > div > div:last-of-type > div": { width: "100% !important", maxWidth: "100%" },
    "& .MuiTypography-root": { color: "var(--admin-text)", fontSize: { xs: "14px", md: "10px" } },
    md: {
      "& > div": { marginTop: "4px" },
      "& .MuiOutlinedInput-root": { borderRadius: "8px" },
      "& .MuiInputBase-input": { py: 0.75, fontSize: "0.8rem" },
    },
  } as const;

  const sectionTitleSx = {
    color: "var(--admin-text)",
    fontSize: { xs: "15px", md: "11px" },
    fontWeight: 700,
    mb: { xs: 1.5, md: 1 },
  } as const;

  const optionalPanelSx = {
    backgroundColor: "var(--admin-surface-alt)",
    border: "1px solid var(--admin-divider)",
    borderRadius: { xs: "12px", md: "8px" },
    maxHeight: { xs: 220, md: 160 },
    minHeight: { md: 160 },
    overflow: "auto",
    py: 0.5,
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
    mb: { xs: 1, md: 0.75 },
    "& .MuiOutlinedInput-root": {
      backgroundColor: "var(--admin-surface-alt)",
      color: "var(--admin-text)",
      borderRadius: { xs: "12px", md: "8px" },
      fontSize: { xs: "13px", md: "10px" },
      "& fieldset": { borderColor: "#505669" },
      "&:hover fieldset": { borderColor: "var(--admin-accent)" },
      "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
    },
    "& .MuiInputBase-input": {
      color: "var(--admin-text)",
      py: { md: 0.75 },
    },
    "& .MuiInputBase-input::placeholder": {
      color: "var(--admin-text-secondary)",
      opacity: 1,
    },
    "& .MuiSvgIcon-root": { color: "var(--admin-text-secondary)" },
  } as const;

  const barcodeFieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "var(--admin-surface-alt)",
      color: "var(--admin-text)",
      borderRadius: { xs: "12px", md: "8px" },
      "& fieldset": { borderColor: "#505669" },
      "&:hover fieldset": { borderColor: "var(--admin-accent)" },
      "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
    },
    "& .MuiInputBase-input": {
      color: "var(--admin-text)",
      fontSize: { xs: "13px", md: "10px" },
      direction: "ltr",
      textAlign: "left",
      py: { md: 0.75 },
    },
    "& .MuiInputBase-input::placeholder": {
      color: "var(--admin-text-secondary)",
      opacity: 1,
    },
  } as const;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        direction: "rtl",
        background: "var(--admin-bg-gradient)",
        px: { xs: 1, sm: 2, md: 2 },
        py: { xs: 1.5, md: 1.25 },
        pb: { xs: "calc(100px + env(safe-area-inset-bottom, 0px))", md: "60px" },
        boxSizing: "border-box",
      }}
    >
      <Container maxWidth="md" disableGutters sx={{ px: { xs: 0, sm: 1 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5, md: 1.75 },
            borderRadius: { xs: "14px", md: "12px" },
            backgroundColor: "var(--admin-surface)",
            border: "1px solid rgba(55, 84, 165, 0.35)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            ...desktopFormCompactSx,
          }}
        >
          <Typography
            sx={{
              color: "var(--admin-text)",
              fontWeight: 700,
              fontSize: { xs: "18px", md: "15px" },
              mb: { xs: 1, md: 1 },
              textAlign: "center",
            }}
          >
            ثبت کالای جدید
          </Typography>
          

          <Grid container spacing={{ xs: 1.5, md: 1 }}>
            <Grid item xs={12} md={6}>
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

            <Grid item xs={12} md={2}>  </Grid>
            <Grid item xs={12} md={4}>
              <Typography
                textAlign="right"
                sx={{ color: "var(--admin-text)", fontSize: { xs: "14px", md: "10px" }, mt: { xs: 0, md: "4px" }, mb: { xs: 0.5, md: 0.25 } }}
              >
                بارکد (اختیاری) :
              </Typography>
              <Typography
                sx={{
                  color: "var(--admin-text-secondary)",
                  fontSize: "12px",
                  mb: 1,
                  display: { xs: "block", md: "none" },
                }}
              >
               در فروشگاه یکتا باشد              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "stretch",
                  p: { xs: 1.25, md: 0 },
                  mt: { md: 0 },
                  borderRadius: "12px",
                  border: { xs: "1px solid rgba(120, 181, 104, 0.25)", md: "none" },
                  backgroundColor: { xs: "var(--admin-surface-alt)", md: "transparent" },
                }}
              >
                <TextField
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value.slice(0, 255))}
                  placeholder="ورود دستی بارکد"
                  size="small"
                  fullWidth
                  inputProps={{ maxLength: 255 }}
                  sx={barcodeFieldSx}
                />
                <IconButton
                  type="button"
                  onClick={() => {
                    setScanManualCode(barcode);
                    setBarcodeScannerOpen(true);
                    setTimeout(() => barcodeScanInputRef.current?.focus(), 150);
                  }}
                  title="اسکن بارکد"
                  sx={{
                    flexShrink: 0,
                    width: { xs: 48, md: 34 },
                    height: { xs: 40, md: 28 },
                    alignSelf: "center",
                    borderRadius: { xs: "10px", md: "7px" },
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "var(--admin-text)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                    },
                  }}
                >
                  <QrCodeScannerIcon sx={{ fontSize: { xs: 22, md: 16 } }} />
                </IconButton>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Box sx={fieldWrapSx}>
                <TextInput
                  value={profitPercentage.toString()}
                  label="درصد سود"
                  onChange={(e) => handleProfitPercentageChange(e)}
                  name="profitPercentage"
                  type="number"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
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
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={fieldWrapSx}>
                <TextInput
                  value={sale_price}
                  label="قیمت فروش"
                  onChange={(e) => setPale_price(e)}
                  name="sale_price"
                  type="number"
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
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
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={fieldWrapSx}>
                <TextInput
                  value={quantity}
                  label="موجودی"
                  onChange={(e) => setQuantity(e)}
                  name="quantity"
                  type="number"
                />
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: { xs: 2.5, md: 1.25 }, borderColor: "var(--admin-divider)" }} />

          <Grid container spacing={{ xs: 1.5, md: 1 }} sx={{ alignItems: "stretch" }}>
            <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography sx={sectionTitleSx}>دسته‌بندی‌ها (اختیاری)</Typography>
              {categoryIds.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 0.75, md: 0.5 }, mb: { xs: 1.5, md: 0.75 } }}>
                  {categoryIds.map((value) => {
                    const flatCats = flattenCategories(categories);
                    const category = flatCats.find((cat) => cat.id === value);
                    return (
                      <Chip
                        key={value}
                        label={category?.name || value}
                        onDelete={() => setCategoryIds(categoryIds.filter((id) => id !== value))}
                        size="small"
                        sx={{
                          backgroundColor: "var(--admin-accent)",
                          color: "var(--admin-text)",
                          "& .MuiChip-deleteIcon": {
                            color: "var(--admin-text)",
                            "&:hover": { color: "#ff4444" },
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              )}
              <TextField
                size="small"
                fullWidth
                placeholder="جستجو در دسته‌بندی‌ها..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                sx={panelSearchSx}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ fontSize: { xs: 18, md: 14 }, ml: 0.5 }} />,
                }}
              />
              <Paper sx={optionalPanelSx}>
                {categoriesLoading ? (
                  <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: { xs: "13px", md: "10px" }, p: 1.5, textAlign: "center" }}>
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
                  <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: { xs: "13px", md: "10px" }, p: 1.5, textAlign: "center" }}>
                    {categorySearch.trim() ? "موردی یافت نشد" : "دسته‌بندی‌ای یافت نشد"}
                  </Typography>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography sx={sectionTitleSx}>تولیدکننده (اختیاری)</Typography>
              {manufacturerId !== "" && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 0.75, md: 0.5 }, mb: { xs: 1.5, md: 0.75 } }}>
                  <Chip
                    label={manufacturers.find((m) => m.id === manufacturerId)?.name || manufacturerId}
                    onDelete={() => setManufacturerId("")}
                    size="small"
                    sx={{
                      backgroundColor: "var(--admin-accent)",
                      color: "var(--admin-text)",
                      "& .MuiChip-deleteIcon": {
                        color: "var(--admin-text)",
                        "&:hover": { color: "#ff4444" },
                      },
                    }}
                  />
                </Box>
              )}
              <TextField
                size="small"
                fullWidth
                placeholder="جستجو در تولیدکنندگان..."
                value={manufacturerSearch}
                onChange={(e) => setManufacturerSearch(e.target.value)}
                sx={panelSearchSx}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ fontSize: { xs: 18, md: 14 }, ml: 0.5 }} />,
                }}
              />
              <Paper sx={optionalPanelSx}>
                {manufacturersLoading ? (
                  <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: { xs: "13px", md: "10px" }, p: 1.5, textAlign: "center" }}>
                    در حال بارگذاری...
                  </Typography>
                ) : (
                  <>
                <Box
                  sx={{
                    ...panelListRowSx,
                    backgroundColor: manufacturerId === "" ? "var(--admin-menu-hover)" : "transparent",
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
                    sx={{
                      color: "var(--admin-accent)",
                      p: { md: 0.25 },
                      "&.Mui-checked": { color: "var(--admin-accent)" },
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => setManufacturerId("")}
                  />
                  <Typography sx={{ color: "var(--admin-text)", fontSize: { xs: "14px", md: "10px" }, flex: 1 }}>
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
                          backgroundColor: isSelected ? "var(--admin-menu-hover)" : "transparent",
                        }}
                        onClick={() => setManufacturerId(manufacturer.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          size="small"
                          sx={{
                            color: "var(--admin-accent)",
                            p: { md: 0.25 },
                            "&.Mui-checked": { color: "var(--admin-accent)" },
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => setManufacturerId(isSelected ? "" : manufacturer.id)}
                        />
                        <Typography sx={{ color: "var(--admin-text)", fontSize: { xs: "14px", md: "10px" }, flex: 1 }}>
                          {manufacturer.name}
                        </Typography>
                      </Box>
                    );
                  })
                ) : !manufacturerSearch.trim() ? (
                  <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: { xs: "13px", md: "10px" }, p: 1.5, textAlign: "center" }}>
                    تولیدکننده‌ای یافت نشد
                  </Typography>
                ) : (
                  <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: { xs: "13px", md: "10px" }, p: 1.5, textAlign: "center" }}>
                    موردی یافت نشد
                  </Typography>
                )}
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: { xs: 2.5, md: 1.25 }, borderColor: "var(--admin-divider)" }} />

          <Typography sx={sectionTitleSx}>تصاویر محصول (اختیاری)</Typography>
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="image-upload"
            multiple
            type="file"
            onChange={handleImageUpload}
          />
          <label htmlFor="image-upload">
            <Button
              component="span"
              variant="outlined"
              fullWidth
              startIcon={<AddPhotoAlternateIcon />}
              sx={{
                borderColor: "var(--admin-accent)",
                color: "var(--admin-accent)",
                borderRadius: { xs: "12px", md: "8px" },
                py: { xs: 1.25, md: 0.65 },
                mb: { xs: 2, md: 1 },
                fontSize: { md: "0.78rem" },
                "&:hover": {
                  borderColor: "var(--admin-accent-hover)",
                  backgroundColor: "var(--admin-menu-hover)",
                },
              }}
            >
              افزودن تصویر
            </Button>
          </label>

          {images.length > 0 && (
            <Grid container spacing={{ xs: 1.5, md: 1 }}>
              {images.map((image, index) => (
                <Grid item xs={6} sm={4} md={2} key={index}>
                  <Card
                    sx={{
                      position: "relative",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid var(--admin-border)",
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={image}
                      alt={`تصویر ${index + 1}`}
                      sx={{ height: { xs: 120, md: 88 }, objectFit: "cover" }}
                    />
                    <IconButton
                      onClick={() => handleRemoveImage(index)}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        backgroundColor: "rgba(0,0,0,0.55)",
                        color: "var(--admin-text)",
                        "&:hover": { backgroundColor: "rgba(244,67,54,0.9)" },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <Box
            sx={{
              mt: { xs: 3, md: 1.5 },
              mb: { xs: 2, md: 0.5 },
              pt: { xs: 1, md: 0.5 },
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 1.5, md: 1 },
            }}
          >
            <Button
              onClick={() => confirm()}
              variant="contained"
              fullWidth
              disabled={isSubmitting}
              sx={{
                flex: { sm: 2 },
                borderRadius: { xs: "14px", md: "10px" },
                py: { xs: 1.5, md: 0.75 },
                bgcolor: "var(--admin-accent)",
                fontWeight: 700,
                fontSize: { xs: "16px", md: "11px" },
                boxShadow: "none",
                "&:hover": { bgcolor: "var(--admin-accent-hover)" },
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
                borderRadius: { xs: "14px", md: "10px" },
                py: { xs: 1.5, md: 0.75 },
                borderColor: "#ff9100",
                color: "#ff9100",
                fontWeight: 600,
                fontSize: { md: "11px" },
                "&:hover": {
                  borderColor: "#e68100",
                  backgroundColor: "rgba(255, 145, 0, 0.08)",
                },
              }}
            >
              انصراف
            </Button>
          </Box>
        </Paper>
      </Container>

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
            <BarcodeScannerComponent
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
