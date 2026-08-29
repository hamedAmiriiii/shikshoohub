"use client";
import List from "@/app/coponent/grid/Grid";
import React, { useState, Suspense, useEffect, useMemo, useRef, useCallback } from "react";

import { Box, Grid, Button, TextField, Typography, IconButton, Card, CardMedia, Select, MenuItem, FormControl, InputLabel, Chip, OutlinedInput, Checkbox, Collapse, Paper, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Autocomplete, CircularProgress, Modal, Input } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import FlashlightOnIcon from '@mui/icons-material/FlashlightOn';
import FlashlightOffIcon from '@mui/icons-material/FlashlightOff';
import SafeBarcodeScanner from "@/app/coponent/SafeBarcodeScanner";
import { useRouter } from "next/navigation";
import CardUser from "./cardUser";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import BottomSheet from "@/app/coponent/BottomSheet";
import TextInput from "@/app/coponent/TextInput/TextInput";
import tokenCode from "@/app/coponent/tokenCode";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import { useQueryClient } from '@tanstack/react-query';
import { mainColors, searchColors } from "../../liberari/colors";
import { PRODUCTS_CACHE_KEY } from "@/app/lib/productsCache";
import { catalogItemKey, isProducedGoodItem } from "@/app/lib/catalogItems";

const PRODUCT_SORT_OPTIONS = [
    { value: "", label: "پیش‌فرض" },
    { value: "quantity_desc", label: "بیشترین موجودی" },
    { value: "quantity_asc", label: "کمترین موجودی" },
    { value: "most_profit_percent", label: "بیشترین سود" },
    { value: "profit_percent_asc", label: "کمترین سود" },
    { value: "discount_desc", label: "بیشترین تخفیف" },
    { value: "discount_asc", label: "کمترین تخفیف" },
] as const;

export default function ListData() {
    const queryClient = useQueryClient();
    const [dataFilter, setDataFilter] = useState([]);
    const router = useRouter();
    const [editBottomSheet, setEditBottomSheet] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [sizeColorModalOpen, setSizeColorModalOpen] = useState(false);
    const [sizeColorProduct, setSizeColorProduct] = useState<any>(null);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [colors, setColors] = useState<string[]>([]);
    const [newColorInput, setNewColorInput] = useState("");
    
    // Generate default sizes from 30 to 105 (step 5)
    const defaultSizes = Array.from({ length: 16 }, (_, i) => (30 + i * 5).toString());
    
    // Form states for editing
    const [name, setName] = useState("");
    const [barcode, setBarcode] = useState("");
    const [editBarcodeScannerOpen, setEditBarcodeScannerOpen] = useState(false);
    const [editTorchOn, setEditTorchOn] = useState(false);
    const [editScanManualCode, setEditScanManualCode] = useState("");
    const editBarcodeScanInputRef = useRef<HTMLInputElement>(null);
    const [purchase_price, setPurchase_price] = useState("");
    const [sale_price, setSale_price] = useState("");
    const [quantity, setQuantity] = useState("");
    const [profitPercentage, setProfitPercentage] = useState(45);
    const [discountPercent, setDiscountPercent] = useState(""); // درصد تخفیف
    const [images, setImages] = useState<string[]>([]); // آرایه عکس‌های base64
    const [categoryIds, setCategoryIds] = useState<number[]>([]); // آرایه ID دسته‌بندی‌ها
    const [categories, setCategories] = useState<any[]>([]); // لیست دسته‌بندی‌ها
    const [manufacturers, setManufacturers] = useState<any[]>([]); // لیست تولیدکنندگان
    const [manufacturerModalOpen, setManufacturerModalOpen] = useState(false);
    const [manufacturerProduct, setManufacturerProduct] = useState<any>(null);
    const [selectedManufacturerId, setSelectedManufacturerId] = useState<number | "">("");
    const [productSort, setProductSort] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<any>(null);
    const [deletingProduct, setDeletingProduct] = useState(false);

    const applyEditScannedBarcode = useCallback((code: string) => {
        const trimmed = code.trim().slice(0, 255);
        if (!trimmed) return;
        setBarcode(trimmed);
        setEditBarcodeScannerOpen(false);
        setEditScanManualCode("");
        setEditTorchOn(false);
        toast.success("بارکد ثبت شد");
    }, []);

    const handleEditBarcodeScanResult = useCallback(
        (result: { text?: string } | null, manual?: string) => {
            const code = result?.text ?? manual ?? "";
            if (code.trim()) {
                applyEditScannedBarcode(code);
            }
        },
        [applyEditScannedBarcode],
    );

    const productListUrl = useMemo(() => {
        if (!productSort) return "/api/product";
        return `/api/product?sort=${productSort}`;
    }, [productSort]);

    const invalidateProductListQueries = () => {
        queryClient.invalidateQueries({
            predicate: (query) => {
                const queryKey = query.queryKey;
                if (queryKey[0] === "datas-infinite" || queryKey[0] === "datas-desktop") {
                    const url = queryKey[2];
                    if (url && typeof url === "string" && url.includes("/api/product")) {
                        return true;
                    }
                }
                return false;
            },
        });
    };

    const handleProductSortChange = (value: string) => {
        setProductSort(value);
        router.push("/admin/product");
        invalidateProductListQueries();
    };

    const handleDeleteProduct = (product: any) => {
        if (!product?.id) return;
        setProductToDelete(product);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        if (deletingProduct) return;
        setDeleteDialogOpen(false);
        setProductToDelete(null);
    };

    const confirmDeleteProduct = async () => {
        const id = productToDelete?.id;
        if (!id) return;

        setDeletingProduct(true);
        try {
            const token = tokenCode();
            const res = await apiRequestError(
                "Delete",
                {},
                {},
                isProducedGoodItem(productToDelete)
                  ? `/api/produced-goods/${id}`
                  : `/api/product/${id}`,
                true,
                true,
                token,
            );

            if (res.hasError) {
                let msg = "خطا در حذف محصول";
                try {
                    const parsed = JSON.parse(res.errorText);
                    if (parsed.message) msg = parsed.message;
                } catch {
                    /* ignore */
                }
                toast.error(msg);
                return;
            }

            toast.success("محصول حذف شد");
            invalidateProductListQueries();

            try {
                const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
                if (cached) {
                    const arr = JSON.parse(cached);
                    if (Array.isArray(arr)) {
                        localStorage.setItem(
                            PRODUCTS_CACHE_KEY,
                            JSON.stringify(arr.filter((p: { id?: number; item_type?: string; produced_good_id?: number }) => catalogItemKey(p) !== catalogItemKey(productToDelete))),
                        );
                    }
                }
            } catch {
                /* ignore cache update */
            }

            setDeleteDialogOpen(false);
            setProductToDelete(null);
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("خطا در حذف محصول");
        } finally {
            setDeletingProduct(false);
        }
    };

    // Scroll to last printed product when page loads
    useEffect(() => {
        const lastPrintedProductId = localStorage.getItem('lastPrintedProductId');
        if (lastPrintedProductId) {
            // Try to find and scroll to the card with retries
            let attempts = 0;
            const maxAttempts = 10;
            
            const tryScroll = () => {
                attempts++;
                const productCard = document.querySelector(`[data-product-id="${lastPrintedProductId}"]`);
                if (productCard) {
                    productCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Highlight the card briefly
                    productCard.classList.add('highlight-card');
                    setTimeout(() => {
                        productCard.classList.remove('highlight-card');
                    }, 2000);
                    // Clear the stored ID
                    localStorage.removeItem('lastPrintedProductId');
                } else if (attempts < maxAttempts) {
                    // Retry after 500ms if card not found yet
                    setTimeout(tryScroll, 500);
                } else {
                    // Clear the stored ID if max attempts reached
                    localStorage.removeItem('lastPrintedProductId');
                }
            };
            
            // Start trying after initial delay
            setTimeout(tryScroll, 500);
        }
    }, []);

    // Listen for refresh event from bulk-discount page
    useEffect(() => {
        const handleRefresh = () => {
            // Invalidate query cache برای refresh لیست محصولات
            queryClient.invalidateQueries({ 
                predicate: (query) => {
                    const queryKey = query.queryKey;
                    if (queryKey[0] === "datas-infinite" || queryKey[0] === "datas-desktop") {
                        const url = queryKey[2];
                        if (url && typeof url === 'string' && url.includes("/api/product")) {
                            return true;
                        }
                    }
                    return false;
                }
            });
        };

        window.addEventListener('refresh-product-list', handleRefresh);
        return () => {
            window.removeEventListener('refresh-product-list', handleRefresh);
        };
    }, [queryClient]);

    // دریافت لیست دسته‌بندی‌ها
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = tokenCode();
                const res = await apiRequestError("Get", {}, {}, `/api/category?tree=true`, true, true, token);
                
                if (!res.hasError && Array.isArray(res)) {
                    setCategories(res);
                } else if (!res.hasError && res.data && Array.isArray(res.data)) {
                    setCategories(res.data);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        
        fetchCategories();
    }, []);

    // دریافت لیست تولیدکنندگان (یک بار)
    useEffect(() => {
        const fetchManufacturers = async () => {
            try {
                const token = tokenCode();
                const res = await apiRequestError("Get", {}, {}, "/api/manufacturers", true, true, token);
                
                if (!res.hasError && Array.isArray(res)) {
                    setManufacturers(res);
                } else if (!res.hasError && res.data && Array.isArray(res.data)) {
                    setManufacturers(res.data);
                }
            } catch (error) {
                console.error('Error fetching manufacturers:', error);
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

    // کامپوننت درختی برای نمایش دسته‌بندی‌ها
    const CategoryTreeItem = ({ category, level = 0 }: { category: any; level?: number }) => {
        const [expanded, setExpanded] = useState(false);
        const hasChildren = category.children && category.children.length > 0;
        const isSelected = categoryIds.includes(category.id);

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
                        padding: '8px 12px',
                        paddingRight: `${12 + level * 24}px`,
                        cursor: hasChildren ? 'pointer' : 'default',
                        '&:hover': {
                            backgroundColor: 'var(--admin-menu-hover)',
                        },
                    }}
                    onClick={handleToggle}
                >
                    {hasChildren ? (
                        expanded ? (
                            <ExpandMoreIcon sx={{ color: 'var(--admin-accent)', fontSize: '20px', marginLeft: '8px' }} />
                        ) : (
                            <ChevronRightIcon sx={{ color: 'var(--admin-accent)', fontSize: '20px', marginLeft: '8px' }} />
                        )
                    ) : (
                        <Box sx={{ width: '20px', marginLeft: '8px' }} />
                    )}
                    <Checkbox
                        checked={isSelected}
                        onChange={handleCheckboxChange}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                            color: 'var(--admin-accent)',
                            '&.Mui-checked': {
                                color: 'var(--admin-accent)',
                            },
                        }}
                    />
                    <Typography sx={{ color: 'var(--admin-text)', fontSize: '14px', flex: 1 }}>
                        {category.name}
                    </Typography>
                </Box>
                {hasChildren && (
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                        <Box sx={{ paddingRight: '24px' }}>
                            {category.children.map((child: any) => (
                                <CategoryTreeItem key={child.id} category={child} level={level + 1} />
                            ))}
                        </Box>
                    </Collapse>
                )}
            </Box>
        );
    };

    let searchBoxList: any = [
      { fieldName: "name", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
      { fieldName: "barcode", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    ];
  
    const formatNumber = (num: number | string) => {
      const numValue = typeof num === 'string' ? parseFloat(num) : num;
      if (isNaN(numValue)) return '0';
      return new Intl.NumberFormat('fa-IR').format(numValue);
    };

    const desktopColumns = [
      {
        label: "کالا",
        field: (item: any) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span>{item?.name || "—"}</span>
            {isProducedGoodItem(item) ? (
              <Chip label="تولیدی" size="small" sx={{ height: 20, fontSize: "11px", backgroundColor: "rgba(120, 181, 104, 0.18)", color: "var(--admin-accent)" }} />
            ) : null}
          </Box>
        ),
      },
      { label: "بارکد", field: "barcode" },
      { label: "قیمت خرید", field: (item: any) => item?.purchase_price ? formatNumber(item.purchase_price) + " تومان" : '-' },
      { 
        label: "قیمت فروش", 
        field: (item: any) => {
          if (!item?.sale_price) return '-';
          if (item?.has_discount) {
            return (
              <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "12px", textDecoration: "line-through" }}>
                  {formatNumber(item.original_sale_price)} تومان
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Typography sx={{ color: "var(--admin-accent)", fontSize: "14px", fontWeight: "600" }}>
                    {formatNumber(item.sale_price)} تومان
                  </Typography>
                  <Typography sx={{ 
                    color: "#ff9100", 
                    fontSize: "11px", 
                    fontWeight: "600",
                    backgroundColor: "rgba(255, 145, 0, 0.1)",
                    padding: "2px 6px",
                    borderRadius: "4px"
                  }}>
                    {formatNumber(item.discount_percent)}%
                  </Typography>
                </Box>
              </Box>
            );
          }
          return formatNumber(item.sale_price) + " تومان";
        }
      },
      { 
        label: "سود", 
        field: (item: any) => {
          const purchase = parseFloat(item?.purchase_price) || 0;
          const sale = parseFloat(item?.sale_price) || 0;
          if (purchase <= 0 || sale <= 0) return '-';
          const profitPercent = ((sale - purchase) / purchase) * 100;
          const color = profitPercent < 30 ? "#ff4444" : profitPercent < 40 ? "#ff9100" : "var(--admin-accent)";
          const bgColor = profitPercent < 30 ? "rgba(255, 68, 68, 0.1)" : profitPercent < 40 ? "rgba(255, 145, 0, 0.1)" : "var(--admin-menu-hover)";
          return (
            <Typography sx={{ 
              color: color, 
              fontSize: "13px", 
              fontWeight: "600",
              backgroundColor: bgColor,
              padding: "4px 8px",
              borderRadius: "4px",
              display: "inline-block"
            }}>
              {profitPercent.toFixed(1)}%
            </Typography>
          );
        }
      },
      { label: "موجودی", field: (item: any) => item?.quantity ? formatNumber(item.quantity) : '-' },
    ];

    // تابع محاسبه قیمت فروش بر اساس قیمت خرید و درصد سود
    const calculateSalePrice = (purchasePrice: string, profitPercent: number) => {
      const value = parseFloat(purchasePrice.replace(/,/g, ''));
      if (!isNaN(value) && value > 0) {
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
    };

    // وقتی قیمت خرید تغییر می‌کند
    const handlePurchasePriceChange = (value: string) => {
      setPurchase_price(value);
      if (value) {
        const calculatedSalePrice = calculateSalePrice(value, profitPercentage);
        setSale_price(calculatedSalePrice);
      } else {
        setSale_price("");
      }
    };

    // وقتی درصد سود تغییر می‌کند
    const handleProfitPercentageChange = (value: string) => {
      const percentValue = parseFloat(value);
      if (!isNaN(percentValue) && percentValue >= 0) {
        setProfitPercentage(percentValue);
        if (purchase_price) {
          const calculatedSalePrice = calculateSalePrice(purchase_price, percentValue);
          setSale_price(calculatedSalePrice);
        }
      } else if (value === "") {
        setProfitPercentage(45);
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

    const handleSizeColorProduct = (product: any) => {
      if (isProducedGoodItem(product)) {
        toast.info("سایز و رنگ برای کالای تولیدی تعریف نشده است");
        return;
      }
      setSizeColorProduct(product);
      // Load existing sizes and colors
      if (product?.sizes && Array.isArray(product.sizes)) {
        setSelectedSizes(product.sizes);
      } else {
        setSelectedSizes([]);
      }
      if (product?.colors && Array.isArray(product.colors)) {
        setColors(product.colors);
      } else {
        setColors([]);
      }
      setSizeColorModalOpen(true);
    };

    const handleManufacturerProduct = (product: any) => {
        if (isProducedGoodItem(product)) {
          toast.info("تولیدکننده برای کالای تولیدی تعریف نشده است");
          return;
        }
        setManufacturerProduct(product);
        if (product?.manufacturer_id) {
            setSelectedManufacturerId(product.manufacturer_id);
        } else {
            setSelectedManufacturerId("");
        }
        setManufacturerModalOpen(true);
    };

    const handleSaveManufacturer = async () => {
        if (!manufacturerProduct?.id) return;
        
        try {
            const token = tokenCode();
            const data: any = {
                name: manufacturerProduct?.name || "",
                purchase_price: manufacturerProduct?.purchase_price?.toString() || "0",
                sale_price: manufacturerProduct?.sale_price?.toString() || "0",
                quantity: manufacturerProduct?.quantity?.toString() || "0",
                barcode: manufacturerProduct?.barcode || "",
            };
            
            if (selectedManufacturerId && typeof selectedManufacturerId === 'number') {
                data.manufacturer_id = selectedManufacturerId;
            }
            
            const res = await apiRequestError("Put", {}, data, `/api/product/${manufacturerProduct.id}`, true, true, token);
            
            if (res.hasError) {
                toast.error(res.errorText || "خطا در بروزرسانی تولیدکننده");
            } else {
                toast.success("تولیدکننده با موفقیت بروزرسانی شد");
                setManufacturerModalOpen(false);
                // Refresh the list
                queryClient.invalidateQueries({ 
                    predicate: (query) => {
                        const queryKey = query.queryKey;
                        if (queryKey[0] === "datas-infinite" || queryKey[0] === "datas-desktop") {
                            const url = queryKey[2];
                            if (url && typeof url === 'string' && url.includes("/api/product")) {
                                return true;
                            }
                        }
                        return false;
                    }
                });
            }
        } catch (error) {
            console.error("Error updating manufacturer:", error);
            toast.error("خطا در بروزرسانی تولیدکننده");
        }
    };

    const handleEditProduct = (product: any) => {
      if (isProducedGoodItem(product)) {
        router.push("/admin/production");
        toast.info("ویرایش کالای تولیدی از صفحه تولید انجام می‌شود");
        return;
      }
      setEditingProduct(product);
      // بارگذاری عکس‌های موجود محصول
      if (product.images && Array.isArray(product.images)) {
        // تبدیل image_url به URL کامل
        const imageUrls = product.images.map((img: any) => {
          if (typeof img === 'string') {
            // اگر base64 string است، مستقیماً استفاده کن
            if (img.startsWith('data:image/')) {
              return img;
            }
            // اگر URL نسبی است
            if (img.startsWith('/storage/')) {
              return `https://api.webinoplus.ir${img}`;
            }
            return img;
          } else if (img.image_url) {
            // اگر object است و image_url دارد
            if (img.image_url.startsWith('/storage/')) {
              return `https://api.webinoplus.ir${img.image_url}`;
            }
            if (img.image_url.startsWith('http')) {
              return img.image_url;
            }
            return img.image_url;
          } else if (img.url) {
            // اگر url property دارد
            if (img.url.startsWith('/storage/')) {
              return `https://api.webinoplus.ir${img.url}`;
            }
            if (img.url.startsWith('http')) {
              return img.url;
            }
            return img.url;
          }
          return img;
        });
        setImages(imageUrls);
      } else {
        setImages([]);
      }
      setName(product.name || "");
      setBarcode(product.barcode || "");
      setPurchase_price(product.purchase_price?.toString() || "");
      setSale_price(product.sale_price?.toString() || "");
      setQuantity(product.quantity?.toString() || "");
      setProfitPercentage(45);
      setDiscountPercent(product.discount_percent?.toString() || "");
      // بارگذاری دسته‌بندی‌های موجود محصول
      if (product.categories && Array.isArray(product.categories)) {
        setCategoryIds(product.categories.map((cat: any) => cat.id || cat));
      } else if (product.category_ids && Array.isArray(product.category_ids)) {
        setCategoryIds(product.category_ids);
      } else {
        setCategoryIds([]);
      }
      setEditBottomSheet(true);
    };

    const handleCloseEditBottomSheet = () => {
      setEditBottomSheet(false);
      setEditingProduct(null);
      setImages([]); // پاک کردن عکس‌ها هنگام بستن
      setName("");
      setBarcode("");
      setPurchase_price("");
      setSale_price("");
      setQuantity("");
      setProfitPercentage(45);
      setDiscountPercent("");
      setEditBarcodeScannerOpen(false);
      setEditScanManualCode("");
      setEditTorchOn(false);
      setCategoryIds([]); // پاک کردن دسته‌بندی‌ها
    };

    const handleUpdateProduct = async () => {
      if (!editingProduct) return;

      const trimmedBarcode = barcode.trim();
      if (!name.trim() || !purchase_price || !sale_price || !quantity) {
        toast.error("لطفاً تمام فیلدها را پر کنید");
        return;
      }
      if (!trimmedBarcode || trimmedBarcode.length > 255) {
        toast.error("بارکد الزامی است (۱ تا ۲۵۵ کاراکتر)");
        return;
      }

      // Clean amounts: remove separators
      const cleanPurchasePrice = purchase_price.replace(/,/g, '').replace(/٬/g, '').replace(/\s/g, '');
      const cleanSalePrice = sale_price.replace(/,/g, '').replace(/٬/g, '').replace(/\s/g, '');
      const cleanQuantity = quantity.replace(/,/g, '').replace(/٬/g, '').replace(/\s/g, '');

      const purchasePriceNum = parseFloat(cleanPurchasePrice);
      const salePriceNum = parseFloat(cleanSalePrice);
      const quantityNum = parseFloat(cleanQuantity);

      if (isNaN(purchasePriceNum) || purchasePriceNum < 0) {
        toast.error("قیمت خرید معتبر نیست");
        return;
      }
      if (isNaN(salePriceNum) || salePriceNum < 0) {
        toast.error("قیمت فروش معتبر نیست");
        return;
      }
      if (isNaN(quantityNum) || quantityNum < 0) {
        toast.error("موجودی معتبر نیست");
        return;
      }

      // اعتبارسنجی درصد تخفیف
      const discountValue = discountPercent ? parseFloat(discountPercent) : 0;
      if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
        toast.error("درصد تخفیف باید بین 0 تا 100 باشد");
        return;
      }

      const data: any = {
        name: name.trim(),
        barcode: trimmedBarcode,
        purchase_price: purchasePriceNum.toString(),
        sale_price: salePriceNum.toString(),
        quantity: quantityNum.toString(),
        discount_percent: discountValue
      };

      // اضافه کردن فقط عکس‌های جدید (base64) در صورت وجود
      // عکس‌های موجود (URL) نباید ارسال شوند، چون از قبل در API هستند
      const newBase64Images = images.filter(img => img.startsWith('data:image/'));
      if (newBase64Images.length > 0) {
        data.images = newBase64Images;
      }

      // اضافه کردن دسته‌بندی‌ها در صورت وجود
      if (categoryIds.length > 0) {
        data.category_ids = categoryIds;
      }

      const token = tokenCode();
      try {
        const res = await apiRequestError("Put", {}, data, `/api/product/${editingProduct.id}`, true, true, token);
        if (res.hasError) {
          const parsedResponse = JSON.parse(res.errorText);
          const readableMessage = parsedResponse.message;
          toast.error(readableMessage || "خطا در ویرایش کالا");
          return;
        }

        // Invalidate queries to refetch fresh data from API
        // این کار باعث می‌شود که عکس‌ها به درستی از API گرفته شوند
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey[0] === "datas-infinite" || queryKey[0] === "datas-desktop";
          }
        });

        // Update React Query cache (temporary update until refetch)
        const updatedProduct = {
          ...editingProduct,
          ...data,
          purchase_price: purchasePriceNum,
          sale_price: salePriceNum,
          quantity: quantityNum,
          // نگه داشتن عکس‌های موجود از editingProduct
          images: editingProduct.images || []
        };

        // Update infinite query cache (for mobile)
        queryClient.setQueriesData(
          { 
            predicate: (query) => {
              return query.queryKey[0] === "datas-infinite";
            }
          },
          (oldData: any) => {
            if (!oldData || !oldData.pages) return oldData;
            
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data.map((item: any) =>
                  item.id === editingProduct.id ? updatedProduct : item
                ),
              })),
            };
          }
        );

        // Update regular query cache (for desktop)
        queryClient.setQueriesData(
          { 
            predicate: (query) => {
              return query.queryKey[0] === "datas-desktop";
            }
          },
          (oldData: any) => {
            if (!oldData || !oldData.data) return oldData;
            
            return {
              ...oldData,
              data: oldData.data.map((item: any) =>
                item.id === editingProduct.id ? updatedProduct : item
              ),
            };
          }
        );

        toast.success("کالا با موفقیت ویرایش شد");
        handleCloseEditBottomSheet();
      } catch (error) {
        toast.error("خطا در ویرایش کالا");
      }
    };
  
    return (
      <Suspense fallback={<div>در حال بارگذاری...</div>}>
        <Box sx={{ minHeight: "100vh", width: "100%", maxWidth: "100%", boxSizing: "border-box", overflowX: "hidden", padding: { xs: "16px", md: "24px" }, paddingBottom: "100px", direction: "rtl", background: "var(--admin-bg-gradient)" }}>
          {/* Header with Back Button and Action Buttons */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "-30px", padding: "4px" }}>
         
          
          
          {/* <Box sx={{ display: "flex", gap: "2px", alignItems: "center" }}>
           
            <Box
              onClick={() => router.push("/admin/printAll")}
              sx={{
                backgroundColor: "#ff9100",
                borderRadius: "12px",
                border: "1px solid var(--admin-border)",
                width: "120px",
                height: "48px",
                padding: "8px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                }
              }}
            >
              <PrintIcon sx={{ fontSize: "20px", color: "var(--admin-text)" }} />
              <span style={{ color: "var(--admin-text)", fontSize: "12px", textAlign: "center" }}>
                چاپ همه
              </span>
            </Box>

            <Box
              onClick={() => router.push("/admin/product/create")}
              sx={{
                backgroundColor: "var(--admin-accent)",
                borderRadius: "12px",
                border: "1px solid var(--admin-border)",
                width: "120px",
                height: "48px",
                padding: "8px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                }
              }}
            >
              <AddIcon sx={{ fontSize: "20px", color: "var(--admin-text)" }} />
              <span style={{ color: "var(--admin-text)", fontSize: "12px", textAlign: "center" }}>
                ثبت کالا
              </span>
            </Box>
          </Box> */}
        </Box>
  
  
        <div style={{ width: "100%", direction: "rtl" }} className="flex-col items-center justify-center">
          <List
            disableFilter={true}
            searchBoxList={searchBoxList}
            filterBoxList={dataFilter}
            CartComponent={(props: any) => (
              <CardUser props={props} manufacturers={manufacturers} onDelete={handleDeleteProduct} />
            )}
            url={productListUrl}
            filterComponent={<></>}
            showTotal={false}
            desktopColumns={desktopColumns}
            onEditItem={handleEditProduct}
            onSizeColorItem={handleSizeColorProduct}
            onManufacturerItem={handleManufacturerProduct}
            onDeleteItem={handleDeleteProduct}
            customActions={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<FileUploadIcon />}
                  onClick={() => router.push("/admin/product/import")}
                  sx={{
                    height: "40px",
                    borderRadius: "12px",
                    color: "var(--admin-text)",
                    border: "1px solid var(--admin-border)",
                    backgroundColor: "var(--admin-surface)",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                    "&:hover": { backgroundColor: "var(--admin-menu-hover)" },
                  }}
                >
                  ایمپورت اکسل
                </Button>
              <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 180 } }}>
                <Select
                  value={productSort}
                  displayEmpty
                  onChange={(e) => handleProductSortChange(e.target.value as string)}
                  sx={{
                    backgroundColor: "var(--admin-surface)",
                    color: "var(--admin-text)",
                    borderRadius: "12px",
                    fontSize: "13px",
                    height: "40px",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#505669" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--admin-accent)" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--admin-accent)" },
                    "& .MuiSvgIcon-root": { color: "var(--admin-text)" },
                  }}
                  renderValue={(selected) => {
                    if (!selected) return "مرتب‌سازی";
                    const opt = PRODUCT_SORT_OPTIONS.find((o) => o.value === selected);
                    return opt?.label ?? "مرتب‌سازی";
                  }}
                >
                  {PRODUCT_SORT_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value || "default"} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              </Box>
            }
          />
        </div>

        {/* BottomSheet for editing product */}
        <BottomSheet
          open={editBottomSheet}
          onClose={handleCloseEditBottomSheet}
          title="ویرایش کالا"
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: "20px", padding: "16px", direction: "rtl" }}>
            {/* ID - Read Only */}
            {/* <Box>
              <Typography sx={{ color: "var(--admin-text)", marginBottom: "8px", fontSize: "14px" }}>
                شناسه کالا:
              </Typography>
              <TextField
                value={editingProduct?.id || ""}
                disabled
                fullWidth
                sx={{
                  direction: "rtl",
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "var(--admin-surface-alt)",
                    color: "var(--admin-text-secondary)",
                    direction: "rtl",
                    "& fieldset": {
                      borderColor: "#505669",
                    },
                  },
                  "& .MuiInputBase-input": {
                    textAlign: "right",
                    direction: "rtl",
                  },
                }}
              />
            </Box> */}

            <Box>
              <Typography sx={{ color: "var(--admin-text)", marginBottom: "8px", fontSize: "14px", fontWeight: 600 }}>
                بارکد *
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "stretch",
                  p: 1,
                  borderRadius: "12px",
                  border: "1px solid rgba(120, 181, 104, 0.25)",
                  backgroundColor: "var(--admin-surface-alt)",
                }}
              >
                <TextField
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value.slice(0, 255))}
                  placeholder="بارکد کالا"
                  size="small"
                  fullWidth
                  inputProps={{ maxLength: 255 }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "var(--admin-surface-alt)",
                      color: "var(--admin-text)",
                      borderRadius: "10px",
                      "& fieldset": { borderColor: "#505669" },
                      "&:hover fieldset": { borderColor: "var(--admin-accent)" },
                      "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
                    },
                    "& .MuiInputBase-input": {
                      direction: "ltr",
                      textAlign: "left",
                      color: "var(--admin-text)",
                    },
                  }}
                />
                <IconButton
                  type="button"
                  onClick={() => {
                    setEditScanManualCode(barcode);
                    setEditBarcodeScannerOpen(true);
                    setTimeout(() => editBarcodeScanInputRef.current?.focus(), 150);
                  }}
                  title="اسکن بارکد"
                  sx={{
                    flexShrink: 0,
                    alignSelf: "center",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "var(--admin-text)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                    },
                  }}
                >
                  <QrCodeScannerIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Name */}
            <TextInput
              value={name}
              label="نام کالا"
              onChange={(e) => setName(e)}
              name="name"
              type="text"
            />

            {/* Profit Percentage */}
            <TextInput
              value={profitPercentage.toString()}
              label="درصد سود"
              onChange={(e) => handleProfitPercentageChange(e)}
              name="profitPercentage"
              type="number"
            />

            {/* Purchase Price */}
            <TextInput
              value={purchase_price}
              label="قیمت خرید"
              onChange={(e) => handlePurchasePriceChange(e)}
              name="purchase_price"
              type="number"
            />

            {/* Sale Price */}
            <TextInput
              value={sale_price}
              label="قیمت فروش"
              onChange={(e) => setSale_price(e)}
              name="sale_price"
              type="number"
            />

            {/* Quantity */}
            <TextInput
              value={quantity}
              label="موجودی"
              onChange={(e) => setQuantity(e)}
              name="quantity"
              type="number"
            />

            {/* Discount Percent */}
            <TextInput
              value={discountPercent}
              label="درصد تخفیف (اختیاری)"
              onChange={(e) => setDiscountPercent(e)}
              name="discountPercent"
              type="number"
            />

            {/* Image Upload Section */}
            <Box sx={{ marginTop: "20px", marginBottom: "20px" }}>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
                تصاویر محصول (اختیاری)
              </Typography>
              
              {/* Upload Button */}
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload-edit"
                multiple
                type="file"
                onChange={handleImageUpload}
              />
              <label htmlFor="image-upload-edit">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<AddPhotoAlternateIcon />}
                  sx={{
                    borderColor: "var(--admin-accent)",
                    color: "var(--admin-accent)",
                    "&:hover": {
                      borderColor: "var(--admin-accent-hover)",
                      backgroundColor: "var(--admin-menu-hover)",
                    },
                    width: "100%",
                    marginBottom: "16px",
                  }}
                >
                  افزودن تصویر
                </Button>
              </label>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <Grid container spacing={2}>
                  {images.map((image, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Card
                        sx={{
                          position: 'relative',
                          borderRadius: '12px',
                          overflow: 'hidden',
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={image}
                          alt={`تصویر ${index + 1}`}
                          sx={{
                            height: '150px',
                            objectFit: 'cover',
                          }}
                        />
                        <IconButton
                          onClick={() => handleRemoveImage(index)}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            color: 'var(--admin-text)',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>

            {/* Category Selection */}
            <Box>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
                دسته‌بندی‌ها (اختیاری)
              </Typography>
              
              {/* Selected Categories Chips */}
              {categoryIds.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, marginBottom: '12px' }}>
                  {categoryIds.map((value) => {
                    const flatCats = flattenCategories(categories);
                    const category = flatCats.find(cat => cat.id === value);
                    return (
                      <Chip
                        key={value}
                        label={category?.name || value}
                        onDelete={() => setCategoryIds(categoryIds.filter(id => id !== value))}
                        sx={{
                          backgroundColor: 'var(--admin-accent)',
                          color: 'var(--admin-text)',
                          fontSize: '12px',
                          '& .MuiChip-deleteIcon': {
                            color: 'var(--admin-text)',
                            '&:hover': {
                              color: '#ff4444',
                            },
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              )}

              {/* Category Tree */}
              <Paper
                sx={{
                  backgroundColor: 'var(--admin-surface-alt)',
                  border: '1px solid var(--admin-divider)',
                  borderRadius: '8px',
                  maxHeight: '300px',
                  overflow: 'auto',
                  padding: '8px 0',
                }}
              >
                {categories.map((category) => (
                  <CategoryTreeItem key={category.id} category={category} />
                ))}
              </Paper>
            </Box>

            {/* Submit Button */}
            <Button
              variant="contained"
              onClick={handleUpdateProduct}
              fullWidth
              sx={{
                backgroundColor: "var(--admin-accent)",
                color: "var(--admin-text)",
                padding: "12px",
                fontSize: "16px",
                fontWeight: "600",
                direction: "rtl",
                "&:hover": {
                  backgroundColor: "var(--admin-accent-hover)"
                },
                marginTop: "8px"
              }}
            >
              ثبت تغییرات
            </Button>
          </Box>
        </BottomSheet>

        <Modal
          open={editBarcodeScannerOpen}
          onClose={() => {
            setEditBarcodeScannerOpen(false);
            setEditScanManualCode("");
            setEditTorchOn(false);
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
                onClick={() => setEditTorchOn(!editTorchOn)}
                sx={{
                  color: "var(--admin-text)",
                  backgroundColor: editTorchOn ? "var(--admin-accent)" : "var(--admin-surface-alt)",
                  p: 0.75,
                  "&:hover": { backgroundColor: editTorchOn ? "var(--admin-accent-hover)" : "var(--admin-surface)" },
                }}
              >
                {editTorchOn ? <FlashlightOnIcon /> : <FlashlightOffIcon />}
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
                torch={editTorchOn}
                onUpdate={(err, result) => {
                  if (err) return;
                  if (result?.text) {
                    handleEditBarcodeScanResult(result);
                  }
                }}
              />
            </Box>
            <Input
              inputRef={editBarcodeScanInputRef}
              value={editScanManualCode}
              onChange={(e) => setEditScanManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleEditBarcodeScanResult(null, editScanManualCode);
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
              onClick={() => handleEditBarcodeScanResult(null, editScanManualCode)}
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

          <ToastContainer autoClose={3000} style={{ marginBottom: '76px', borderRadius: "15px" }} position={"bottom-right"} />

        {/* Size and Color Modal for Desktop */}
        <Dialog
          open={sizeColorModalOpen}
          onClose={() => setSizeColorModalOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: "var(--admin-surface)",
              borderRadius: "20px",
              border: "1px solid var(--admin-border)",
            }
          }}
        >
          <DialogTitle sx={{ 
            color: "var(--admin-text)", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            borderBottom: "1px solid #505669",
            paddingBottom: "16px"
          }}>
            <Typography sx={{ fontSize: "18px", fontWeight: "600" }}>
              افزودن سایز و رنگ
            </Typography>
            <IconButton 
              onClick={() => setSizeColorModalOpen(false)}
              sx={{ color: "var(--admin-text)" }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ padding: "24px", direction: "rtl" }}>
            {/* Size Selection */}
            <Box sx={{ marginBottom: "32px" }}>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>
                انتخاب سایز:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {defaultSizes.map((size) => {
                  const isSelected = selectedSizes.includes(size);
                  return (
                    <Button
                      key={size}
                      variant={isSelected ? "contained" : "outlined"}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedSizes(selectedSizes.filter(s => s !== size));
                        } else {
                          setSelectedSizes([...selectedSizes, size]);
                        }
                      }}
                      sx={{
                        minWidth: "56px",
                        height: "44px",
                        borderRadius: "12px",
                        fontWeight: "600",
                        fontSize: "15px",
                        backgroundColor: isSelected ? "#ff9100" : "transparent",
                        color: isSelected ? "#fff" : "var(--admin-text-secondary)",
                        borderColor: isSelected ? "#ff9100" : "#4b5563",
                        "&:hover": {
                          backgroundColor: isSelected ? "#e68000" : "#1f2937",
                          borderColor: isSelected ? "#e68000" : "#6b7280",
                          color: "var(--admin-text)",
                        },
                      }}
                    >
                      {size}
                    </Button>
                  );
                })}
              </Box>
            </Box>

            {/* Color Selection */}
            <Box>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>
                انتخاب رنگ:
              </Typography>
              
              {/* Add Color Input with Autocomplete */}
              <Box sx={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                <Autocomplete
                  freeSolo
                  options={searchColors(newColorInput)}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.persianName}
                  value={newColorInput}
                  onInputChange={(event, newInputValue) => {
                    setNewColorInput(newInputValue);
                  }}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      const colorName = typeof newValue === 'string' ? newValue : newValue.persianName;
                      if (colorName.trim() && !colors.includes(colorName.trim())) {
                        setColors([...colors, colorName.trim()]);
                        setNewColorInput("");
                      }
                    }
                  }}
                  renderOption={(props, option) => {
                    const color = typeof option === 'string' ? null : option;
                    return (
                      <Box
                        component="li"
                        {...props}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 12px",
                        }}
                      >
                        {color && (
                          <Box
                            sx={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "4px",
                              backgroundColor: color.hex,
                              border: color.hex === '#FFbbbb' ? "1px solid #ddd" : "none",
                            }}
                          />
                        )}
                        <Typography sx={{ color: "#000" }}>
                          {typeof option === 'string' ? option : option.persianName}
                        </Typography>
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="نام رنگ را وارد کنید"
                      size="small"
                      fullWidth
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newColorInput.trim()) {
                          if (!colors.includes(newColorInput.trim())) {
                            setColors([...colors, newColorInput.trim()]);
                            setNewColorInput("");
                          }
                        }
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "var(--admin-surface-alt)",
                          color: "var(--admin-text)",
                          "& fieldset": {
                            borderColor: "#505669",
                          },
                          "&:hover fieldset": {
                            borderColor: "#9c27b0",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#9c27b0",
                          },
                        },
                        "& .MuiInputBase-input": {
                          color: "var(--admin-text)",
                          fontSize: "14px",
                        }
                      }}
                    />
                  )}
                  sx={{
                    flex: 1,
                    "& .MuiAutocomplete-popper": {
                      backgroundColor: "var(--admin-surface)",
                    },
                    "& .MuiAutocomplete-listbox": {
                      backgroundColor: "var(--admin-surface)",
                    },
                  }}
                />
                <IconButton
                  onClick={() => {
                    if (newColorInput.trim() && !colors.includes(newColorInput.trim())) {
                      setColors([...colors, newColorInput.trim()]);
                      setNewColorInput("");
                    }
                  }}
                  disabled={!newColorInput.trim() || colors.includes(newColorInput.trim())}
                  sx={{
                    backgroundColor: "#9c27b0",
                    color: "var(--admin-text)",
                    "&:hover": { backgroundColor: "#7b1fa2" },
                    "&:disabled": { backgroundColor: "#4b5563", color: "#6b7280" }
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Box>

              {/* Selected Colors */}
              {colors.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {colors.map((color, index) => (
                    <Chip
                      key={index}
                      label={color}
                      onDelete={() => setColors(colors.filter((_, i) => i !== index))}
                      sx={{
                        backgroundColor: "#1f2937",
                        color: "var(--admin-text)",
                        border: "1px solid #4b5563",
                        fontSize: "14px",
                        fontWeight: "500",
                        "& .MuiChip-deleteIcon": {
                          color: "#9ca3af",
                          "&:hover": {
                            color: "#ef4444",
                          },
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ padding: "16px 24px", borderTop: "1px solid #505669", gap: "8px" }}>
            <Button
              onClick={() => setSizeColorModalOpen(false)}
              sx={{
                color: "#9ca3af",
                "&:hover": { backgroundColor: "rgba(156, 163, 175, 0.1)" }
              }}
            >
              انصراف
            </Button>
            <Button
              onClick={async () => {
                if (!sizeColorProduct?.id) return;
                
                // Prepare data with all product information
                const data: any = {
                  name: sizeColorProduct?.name || "",
                  barcode: sizeColorProduct?.barcode || "",
                  purchase_price: sizeColorProduct?.purchase_price?.toString() || "0",
                  sale_price: sizeColorProduct?.sale_price?.toString() || "0",
                  quantity: sizeColorProduct?.quantity?.toString() || "0",
                  discount_percent: sizeColorProduct?.discount_percent || 0,
                };
                
                // Add sizes and colors
                if (selectedSizes.length > 0) {
                  data.sizes = selectedSizes;
                }
                if (colors.length > 0) {
                  data.colors = colors;
                }
                
                // Add category_ids if exists
                if (sizeColorProduct?.categories && Array.isArray(sizeColorProduct.categories)) {
                  data.category_ids = sizeColorProduct.categories.map((cat: any) => cat.id || cat);
                } else if (sizeColorProduct?.category_ids && Array.isArray(sizeColorProduct.category_ids)) {
                  data.category_ids = sizeColorProduct.category_ids;
                }

                const token = tokenCode();
                try {
                  const res = await apiRequestError("Put", {}, data, `/api/product/${sizeColorProduct.id}`, true, true, token);
                  if (res.hasError) {
                    const parsedResponse = JSON.parse(res.errorText);
                    const readableMessage = parsedResponse.message;
                    toast.error(readableMessage || "خطا در ذخیره سایز و رنگ");
                  } else {
                    toast.success("سایز و رنگ با موفقیت ذخیره شد");
                    setSizeColorModalOpen(false);
                    // Invalidate queries to refresh data
                    queryClient.invalidateQueries({ 
                      predicate: (query) => {
                        const queryKey = query.queryKey;
                        return queryKey[0] === "datas-infinite" || queryKey[0] === "datas-desktop";
                      }
                    });
                  }
                } catch (error) {
                  toast.error("خطا در ذخیره سایز و رنگ");
                }
              }}
              variant="contained"
              sx={{
                backgroundColor: "#9c27b0",
                color: "var(--admin-text)",
                "&:hover": { backgroundColor: "#7b1fa2" }
              }}
            >
              ذخیره
            </Button>
          </DialogActions>
        </Dialog>

        {/* Manufacturer Dialog */}
        <Dialog
          open={manufacturerModalOpen}
          onClose={() => setManufacturerModalOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: "var(--admin-surface)",
              borderRadius: "20px",
              border: "1px solid var(--admin-border)",
            }
          }}
        >
          <DialogTitle sx={{ 
            color: "var(--admin-text)", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            borderBottom: "1px solid #505669",
            paddingBottom: "16px"
          }}>
            <Typography sx={{ fontSize: "18px", fontWeight: "600" }}>
              انتخاب تولیدکننده
            </Typography>
            <IconButton 
              onClick={() => setManufacturerModalOpen(false)}
              sx={{ color: "var(--admin-text)" }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ padding: "24px", direction: "rtl" }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'var(--admin-text-muted)' }}>تولیدکننده</InputLabel>
              <Select
                value={selectedManufacturerId}
                onChange={(e) => setSelectedManufacturerId(e.target.value as number | "")}
                label="تولیدکننده"
                sx={{
                  color: 'var(--admin-text)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#505669',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2196f3',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2196f3',
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'var(--admin-text)',
                  },
                }}
              >
                <MenuItem value="">
                  <em>هیچکدام</em>
                </MenuItem>
                {manufacturers.map((manufacturer) => (
                  <MenuItem key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>

          <DialogActions sx={{ padding: "16px 24px", borderTop: "1px solid #505669", gap: "8px" }}>
            <Button
              onClick={() => setManufacturerModalOpen(false)}
              sx={{
                color: "#9ca3af",
                "&:hover": { backgroundColor: "rgba(156, 163, 175, 0.1)" }
              }}
            >
              انصراف
            </Button>
            <Button
              onClick={handleSaveManufacturer}
              variant="contained"
              sx={{
                backgroundColor: "#2196f3",
                "&:hover": { backgroundColor: "#1976d2" }
              }}
            >
              ذخیره
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          PaperProps={{
            sx: {
              backgroundColor: "var(--admin-surface)",
              borderRadius: "16px",
              direction: "rtl",
              minWidth: { xs: "280px", sm: "360px" },
              border: "1px solid var(--admin-border)",
            },
          }}
        >
          <DialogTitle sx={{ color: "var(--admin-text)", textAlign: "center", fontSize: "18px", fontWeight: 700 }}>
            تایید حذف محصول
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: "var(--admin-text-muted)", textAlign: "center" }}>
              آیا از حذف این محصول مطمئن هستید؟
              {productToDelete && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.25,
                    backgroundColor: "var(--admin-surface-alt)",
                    borderRadius: "8px",
                    color: "var(--admin-text)",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {productToDelete.name || productToDelete.barcode || `شناسه ${productToDelete.id}`}
                  </Typography>
                  {productToDelete.barcode && productToDelete.name && (
                    <Typography variant="caption" sx={{ color: "var(--admin-text-secondary)" }}>
                      بارکد: {productToDelete.barcode}
                    </Typography>
                  )}
                </Box>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", px: 2, pb: 2, gap: 1.5 }}>
            <Button
              onClick={handleCloseDeleteDialog}
              variant="outlined"
              disabled={deletingProduct}
              sx={{
                color: "var(--admin-text)",
                borderColor: "#666",
                minWidth: 100,
                "&:hover": {
                  borderColor: "#888",
                  backgroundColor: "var(--admin-surface-alt)",
                },
              }}
            >
              انصراف
            </Button>
            <Button
              onClick={confirmDeleteProduct}
              variant="contained"
              disabled={deletingProduct}
              startIcon={deletingProduct ? <CircularProgress size={18} color="inherit" /> : undefined}
              sx={{
                backgroundColor: "#ff4444",
                minWidth: 100,
                "&:hover": { backgroundColor: "#cc0000" },
              }}
            >
              {deletingProduct ? "در حال حذف..." : "حذف"}
            </Button>
          </DialogActions>
        </Dialog>
        </Box>
      </Suspense>
    );
  }
