
"use client";
import { Box, Grid, IconButton, TextField, Typography, Button, Card, CardMedia, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Paper, Autocomplete, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import PrintIcon from '@mui/icons-material/Print';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PaletteIcon from '@mui/icons-material/Palette';
import FactoryIcon from '@mui/icons-material/Factory';
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import tokenCode from "@/app/coponent/tokenCode";
import { apiRequestError } from "@/app/lib/apiRequestError";
import { toast } from "react-toastify";
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { mainColors, searchColors } from "../../lib/colors";

const formatNumber = (num: number | string) => {
  const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(numValue)) return '';
  return new Intl.NumberFormat('fa-IR').format(numValue);
};

export default function CardUser(props: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [load] = useState(true);
  const productId = props.props.data?.id;
  const onEdit = props.props.onEdit; // تابع ویرایش از parent component
  const manufacturersFromParent = props.manufacturers || []; // لیست تولیدکنندگان از parent
  
  // State for editable values
  const [name, setName] = useState(props.props.data?.name || "");
  const [barcode, setBarcode] = useState(props.props.data?.barcode || "");
  const [purchasePrice, setPurchasePrice] = useState(props.props.data?.purchase_price?.toString() || "");
  const [salePrice, setSalePrice] = useState(props.props.data?.sale_price?.toString() || "");
  const [quantity, setQuantity] = useState(props.props.data?.quantity?.toString() || "");
  const [discountPercent, setDiscountPercent] = useState(props.props.data?.discount_percent?.toString() || "");
  const [images, setImages] = useState<string[]>([]); // آرایه عکس‌های base64 یا URL
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>([]); // عکس‌های اصلی (URL) که از API آمده‌اند
  const [imageData, setImageData] = useState<Array<{id?: number, url: string}>>([]); // نگهداری id و url عکس‌ها
  
  // Focus states for formatting
  const [purchasePriceFocused, setPurchasePriceFocused] = useState(false);
  const [salePriceFocused, setSalePriceFocused] = useState(false);
  
  // Size and Color Modal states
  const [sizeColorModalOpen, setSizeColorModalOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [newColorInput, setNewColorInput] = useState("");
  
  // Manufacturer Modal states
  const [manufacturerModalOpen, setManufacturerModalOpen] = useState(false);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<number | "">(props.props.data?.manufacturer_id || "");
  
  // Generate default sizes from 30 to 105 (step 5)
  const defaultSizes = Array.from({ length: 16 }, (_, i) => (30 + i * 5).toString());
  
  // Original values to compare
  const [originalValues, setOriginalValues] = useState({
    name: props.props.data?.name || "",
    barcode: props.props.data?.barcode || "",
    purchase_price: props.props.data?.purchase_price?.toString() || "",
    sale_price: props.props.data?.sale_price?.toString() || "",
    quantity: props.props.data?.quantity?.toString() || "",
    discount_percent: props.props.data?.discount_percent?.toString() || ""
  });

  // Update state when props change
  useEffect(() => {
    const data = props.props.data;
    setName(data?.name || "");
    setBarcode(data?.barcode || "");
    setPurchasePrice(data?.purchase_price?.toString() || "");
    setSalePrice(data?.sale_price?.toString() || "");
    setQuantity(data?.quantity?.toString() || "");
    setDiscountPercent(data?.discount_percent?.toString() || "");
    
    // Load existing sizes and colors
    if (data?.sizes && Array.isArray(data.sizes)) {
      setSelectedSizes(data.sizes);
    } else {
      setSelectedSizes([]);
    }
    if (data?.colors && Array.isArray(data.colors)) {
      setColors(data.colors);
    } else {
      setColors([]);
    }
    
    // بارگذاری عکس‌های موجود محصول
    if (data?.images && Array.isArray(data.images)) {
      const imageDataArray: Array<{id?: number, url: string}> = [];
      const imageUrls = data.images.map((img: any) => {
        let imageUrl = '';
        let imageId: number | undefined = undefined;
        
        if (typeof img === 'string') {
          if (img.startsWith('data:image/')) {
            imageUrl = img;
          } else if (img.startsWith('/storage/')) {
            imageUrl = `https://webinoplus.ir${img}`;
          } else {
            imageUrl = img;
          }
        } else if (img.image_url) {
          imageId = img.id;
          if (img.image_url.startsWith('/storage/')) {
            imageUrl = `https://webinoplus.ir${img.image_url}`;
          } else if (img.image_url.startsWith('http')) {
            imageUrl = img.image_url;
          } else {
            imageUrl = img.image_url;
          }
        } else if (img.url) {
          imageId = img.id;
          if (img.url.startsWith('/storage/')) {
            imageUrl = `https://webinoplus.ir${img.url}`;
          } else if (img.url.startsWith('http')) {
            imageUrl = img.url;
          } else {
            imageUrl = img.url;
          }
        } else {
          imageUrl = img;
        }
        
        imageDataArray.push({ id: imageId, url: imageUrl });
        return imageUrl;
      });
      setImages(imageUrls);
      setImageData(imageDataArray);
      // ذخیره عکس‌های اصلی (URL) برای ارسال مجدد
      const urlsOnly = imageUrls.filter(img => !img.startsWith('data:image/'));
      setOriginalImageUrls(urlsOnly);
    } else {
      setImages([]);
      setOriginalImageUrls([]);
      setImageData([]);
    }
    
    setOriginalValues({
      name: data?.name || "",
      barcode: data?.barcode || "",
      purchase_price: data?.purchase_price?.toString() || "",
      sale_price: data?.sale_price?.toString() || "",
      quantity: data?.quantity?.toString() || "",
      discount_percent: data?.discount_percent?.toString() || ""
    });
    
    // بارگذاری تولیدکننده فعلی
    if (data?.manufacturer_id) {
      setSelectedManufacturerId(data.manufacturer_id);
    } else {
      setSelectedManufacturerId("");
    }
  }, [props.props.data]);


  // تبدیل فایل به base64
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('فقط فایل‌های تصویری مجاز هستند');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم فایل باید کمتر از 5 مگابایت باشد');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        if (base64String) {
          setImages((prev) => [...prev, base64String]);
          // اضافه کردن به imageData بدون id (چون هنوز آپلود نشده)
          setImageData((prev) => [...prev, { url: base64String }]);
        }
      };
      reader.onerror = () => {
        toast.error('خطا در خواندن فایل');
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  // حذف عکس از API
  const handleDeleteImage = async (index: number) => {
    const imageItem = imageData[index];
    
    // اگر عکس base64 است (عکس جدید که هنوز آپلود نشده)، فقط از state حذف کن
    if (!imageItem.id) {
      setImages((prev) => prev.filter((_, i) => i !== index));
      setImageData((prev) => prev.filter((_, i) => i !== index));
      const imageToRemove = images[index];
      if (!imageToRemove.startsWith('data:image/')) {
        setOriginalImageUrls((prev) => prev.filter(img => img !== imageToRemove));
      }
      return;
    }
    
    // اگر عکس از API است، از طریق API حذف کن
    if (!productId || !imageItem.id) return;
    
    const token = tokenCode();
    try {
      const res = await apiRequestError("Delete", {}, {}, `/api/product/${productId}/image/${imageItem.id}`, true, true, token);
      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        const readableMessage = parsedResponse.message;
        toast.error(readableMessage || "خطا در حذف عکس");
      } else {
        toast.success("عکس با موفقیت حذف شد");
        // حذف از state
        setImages((prev) => prev.filter((_, i) => i !== index));
        setImageData((prev) => prev.filter((_, i) => i !== index));
        setOriginalImageUrls((prev) => prev.filter(img => img !== imageItem.url));
      }
    } catch (error) {
      toast.error("خطا در حذف عکس");
    }
  };

  // ذخیره عکس‌ها
  const saveImages = async () => {
    if (!productId) return;
    
    // جدا کردن عکس‌های base64 (جدید)
    const base64Images = images.filter(img => img.startsWith('data:image/'));
    
    // اگر عکس base64 نداریم، چیزی ارسال نکن
    if (base64Images.length === 0) {
      toast.error("هیچ عکس جدیدی برای بارگذاری وجود ندارد");
      return;
    }
    
    // ترکیب عکس‌های موجود (URL) با عکس‌های جدید (base64)
    // استفاده از originalImageUrls برای عکس‌های موجود
    // اول URL ها (عکس‌های موجود)، بعد base64 ها (عکس‌های جدید)
    const allImages = [...originalImageUrls, ...base64Images];
    
    const data: any = {
      images: allImages
    };

    const token = tokenCode();
    try {
      const res = await apiRequestError("Put", {}, data, `/api/product/${productId}`, true, true, token);
      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        const readableMessage = parsedResponse.message;
        toast.error(readableMessage || "خطا در ذخیره عکس‌ها");
      } else {
        toast.success("عکس‌ها با موفقیت ذخیره شدند");
        // بعد از ذخیره موفق، عکس‌های base64 را از state حذف می‌کنیم
        // و فقط URL ها را نگه می‌داریم
        const currentUrlImages = images.filter(img => !img.startsWith('data:image/'));
        const currentUrlImageData = imageData.filter(img => !img.url.startsWith('data:image/'));
        setImages(currentUrlImages);
        setImageData(currentUrlImageData);
        setOriginalImageUrls(currentUrlImages);
      }
    } catch (error) {
      toast.error("خطا در ذخیره عکس‌ها");
    }
  };

  const handlePrint = () => {
    // Save product ID to localStorage for scroll back
    if (productId) {
      localStorage.setItem('lastPrintedProductId', productId.toString());
    }
    // Save current page to localStorage
    const currentPage = searchParams.get("page") || "1";
    localStorage.setItem('productListPage', currentPage);
    const params = new URLSearchParams({
      name: name || "",
      barcode: barcode || "",
      price: salePrice || "",
      quantity: quantity || "1"
    });
    router.push(`/shikshoo/admin/print?${params.toString()}`);
  };

  const handleUpdate = async () => {
    if (!productId) return;
    
    // اعتبارسنجی درصد تخفیف
    if (discountPercent) {
      const discountValue = parseFloat(discountPercent);
      if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
        toast.error("درصد تخفیف باید بین 0 تا 100 باشد");
        setDiscountPercent(originalValues.discount_percent);
        return;
      }
    }
    
    // Check if any value has changed
    const hasChanged = 
      name !== originalValues.name ||
      barcode !== originalValues.barcode ||
      purchasePrice !== originalValues.purchase_price ||
      salePrice !== originalValues.sale_price ||
      quantity !== originalValues.quantity ||
      discountPercent !== originalValues.discount_percent;

    if (!hasChanged) return;

    // محاسبه discount_percent (همیشه ارسال می‌شود)
    const discountValue = discountPercent ? parseFloat(discountPercent) : 0;
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      toast.error("درصد تخفیف باید بین 0 تا 100 باشد");
      setDiscountPercent(originalValues.discount_percent);
      return;
    }

    const data: any = {
      name: name,
      barcode: barcode,
      purchase_price: purchasePrice || "0",
      sale_price: salePrice || "0",
      quantity: quantity || "0",
      // discount_percent: discountValue
    };

    // در handleUpdate عکس‌ها را ارسال نمی‌کنیم
    // عکس‌ها فقط از طریق دکمه "بارگذاری" ارسال می‌شوند

    let token = tokenCode();
    try {
      const res = await apiRequestError("Put", {}, data, `/api/product/${productId}`, true, true, token);
      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        const readableMessage = parsedResponse.message;
        toast.error(readableMessage);
        // Revert to original values on error
        setName(originalValues.name);
        setBarcode(originalValues.barcode);
        setPurchasePrice(originalValues.purchase_price);
        setSalePrice(originalValues.sale_price);
        setQuantity(originalValues.quantity);
        setDiscountPercent(originalValues.discount_percent);
      } else {
        toast.success("کالا با موفقیت ویرایش شد");
        // Update original values
        setOriginalValues({
          name: name,
          barcode: barcode,
          purchase_price: purchasePrice,
          sale_price: salePrice,
          quantity: quantity,
          discount_percent: discountPercent
        });
      }
    } catch (error) {
      toast.error("خطا در ویرایش کالا");
      // Revert to original values on error
      setName(originalValues.name);
      setBarcode(originalValues.barcode);
      setPurchasePrice(originalValues.purchase_price);
      setSalePrice(originalValues.sale_price);
      setQuantity(originalValues.quantity);
      setDiscountPercent(originalValues.discount_percent);
    }
  };

  return load ? (
    <Box 
      data-product-id={productId}
      sx={{
        backgroundColor: "#2b3143",
        borderRadius: "15px",
        border: "1px solid #505669",
        margin: 1,
        padding: 2,
        transition: 'all 0.3s ease',
        '&.highlight-card': {
          border: '2px solid #78b568',
          boxShadow: '0 0 20px rgba(120, 181, 104, 0.5)',
        }
      }}
    >
      <Grid container spacing={1}>
        {/* نام کالا - full width */}
        <Grid xs={12} sx={{ paddingBottom: 0 }}>
          <Box sx={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Typography sx={{ color: "#fff", fontSize: "14px", minWidth: "80px" }}>کالا:</Typography>
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleUpdate}
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
                  fontSize: "14px",
                  padding: "8px 12px"
                }
              }}
            />
          </Box>
        </Grid>

        {/* بارکد و قیمت خرید - دو ستون */}
        <Grid xs={6} sx={{ paddingBottom: 0 }}>
          <Box sx={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <Typography sx={{ color: "#fff", fontSize: "12px" }}>بارکد:</Typography>
            <TextField
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onBlur={handleUpdate}
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
                  fontSize: "14px",
                  padding: "8px 12px"
                }
              }}
            />
          </Box>
        </Grid>

        <Grid xs={6} sx={{ paddingBottom: 0 }}>
          <Box sx={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <Typography sx={{ color: "#fff", fontSize: "12px" }}>قیمت خرید:</Typography>
            <TextField
              value={purchasePriceFocused ? purchasePrice : (purchasePrice ? formatNumber(purchasePrice) : '')}
              onChange={(e) => {
                const value = e.target.value.replace(/,/g, '');
                if (/^\d*$/.test(value) || value === '') {
                  setPurchasePrice(value);
                }
              }}
              onFocus={() => setPurchasePriceFocused(true)}
              onBlur={() => {
                setPurchasePriceFocused(false);
                handleUpdate();
              }}
              size="small"
              fullWidth
              type="text"
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
                  fontSize: "14px",
                  padding: "8px 12px"
                }
              }}
            />
          </Box>
        </Grid>

        {/* قیمت فروش و درصد تخفیف - دو ستون */}
        <Grid xs={6} sx={{ paddingBottom: 0 }}>
          <Box sx={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <Typography sx={{ color: "#fff", fontSize: "12px" }}>قیمت فروش:</Typography>
            <TextField
              value={salePriceFocused ? salePrice : (salePrice ? formatNumber(salePrice) : '')}
              onChange={(e) => {
                const value = e.target.value.replace(/,/g, '');
                if (/^\d*$/.test(value) || value === '') {
                  setSalePrice(value);
                }
              }}
              onFocus={() => setSalePriceFocused(true)}
              onBlur={() => {
                setSalePriceFocused(false);
                handleUpdate();
              }}
              size="small"
              fullWidth
              type="text"
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
                  fontSize: "14px",
                  padding: "8px 12px"
                }
              }}
            />
          </Box>
        </Grid>

        <Grid xs={6} sx={{ paddingBottom: 0 }}>
          <Box sx={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <Typography sx={{ color: "#fff", fontSize: "12px" }}>درصد تخفیف:</Typography>
            <TextField
              value={discountPercent}
              onChange={(e) => {
                const value = e.target.value.replace(/,/g, '');
                if (/^\d*\.?\d*$/.test(value) || value === '') {
                  setDiscountPercent(value);
                }
              }}
              onBlur={handleUpdate}
              size="small"
              fullWidth
              type="text"
              placeholder="0"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#1a1d2e",
                  color: "#fff",
                  "& fieldset": {
                    borderColor: "#505669",
                  },
                  "&:hover fieldset": {
                    borderColor: "#ff9100",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#ff9100",
                  },
                },
                "& .MuiInputBase-input": {
                  color: "#fff",
                  fontSize: "14px",
                  padding: "8px 12px"
                }
              }}
            />
          </Box>
        </Grid>

        {/* موجودی و سود - دو ستون */}
        <Grid xs={6} sx={{ paddingBottom: 0 }}>
          <Box sx={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <Typography sx={{ color: "#fff", fontSize: "12px" }}>موجودی:</Typography>
            <TextField
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onBlur={handleUpdate}
              size="small"
              fullWidth
              type="number"
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
                  fontSize: "14px",
                  padding: "8px 12px"
                }
              }}
            />
          </Box>
        </Grid>

        {/* درصد سود */}
        <Grid xs={6} sx={{ paddingBottom: 0 }}>
          <Box sx={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <Typography sx={{ color: "#fff", fontSize: "12px" }}>سود:</Typography>
            <Box sx={{
              backgroundColor: (() => {
                const purchase = parseFloat(purchasePrice) || 0;
                const sale = parseFloat(salePrice) || 0;
                if (purchase <= 0 || sale <= 0) return "#1a1d2e";
                const profitPercent = ((sale - purchase) / purchase) * 100;
                if (profitPercent < 30) return "rgba(255, 68, 68, 0.2)";
                if (profitPercent < 40) return "rgba(255, 145, 0, 0.2)";
                return "rgba(120, 181, 104, 0.2)";
              })(),
              border: (() => {
                const purchase = parseFloat(purchasePrice) || 0;
                const sale = parseFloat(salePrice) || 0;
                if (purchase <= 0 || sale <= 0) return "1px solid #505669";
                const profitPercent = ((sale - purchase) / purchase) * 100;
                if (profitPercent < 30) return "1px solid #ff4444";
                if (profitPercent < 40) return "1px solid #ff9100";
                return "1px solid #78b568";
              })(),
              borderRadius: "4px",
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Typography sx={{
                color: (() => {
                  const purchase = parseFloat(purchasePrice) || 0;
                  const sale = parseFloat(salePrice) || 0;
                  if (purchase <= 0 || sale <= 0) return "#999";
                  const profitPercent = ((sale - purchase) / purchase) * 100;
                  if (profitPercent < 30) return "#ff4444";
                  if (profitPercent < 40) return "#ff9100";
                  return "#78b568";
                })(),
                fontSize: "14px",
                fontWeight: "600",
              }}>
                {(() => {
                  const purchase = parseFloat(purchasePrice) || 0;
                  const sale = parseFloat(salePrice) || 0;
                  if (purchase <= 0 || sale <= 0) return "-";
                  const profitPercent = ((sale - purchase) / purchase) * 100;
                  return `${profitPercent.toFixed(1)}%`;
                })()}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* نمایش اطلاعات تخفیف (اگر تخفیف دارد) - full width */}
        {props.props.data?.has_discount && (
          <Grid xs={12} sx={{ paddingBottom: 0 }}>
            <Box sx={{ marginTop: "10px", padding: "8px", backgroundColor: "rgba(255, 145, 0, 0.1)", borderRadius: "8px" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Typography sx={{ color: "#999", fontSize: "12px", textDecoration: "line-through" }}>
                  قیمت اصلی: {formatNumber(props.props.data.original_sale_price)} تومان
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
                <Typography sx={{ color: "#78b568", fontSize: "14px", fontWeight: "600" }}>
                  قیمت با تخفیف: {formatNumber(props.props.data.sale_price)} تومان
                </Typography>
              </Box>
            </Box>
          </Grid>
        )}

        {/* Image Display Section */}
        {images.length > 0 && (
          <Grid xs={12} sx={{ paddingBottom: 0, marginTop: "10px" }}>
            <Box>
              <Typography sx={{ color: "#fff", fontSize: "12px", marginBottom: "8px" }}>
                تصاویر محصول:
              </Typography>
              <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {images.map((image, index) => (
                  <Card
                    key={index}
                    sx={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      width: '80px',
                      height: '80px',
                      flexShrink: 0,
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={image}
                      alt={`تصویر ${index + 1}`}
                      sx={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                      }}
                    />
                  </Card>
                ))}
              </Box>
            </Box>
          </Grid>
        )}

        {/* دکمه‌های عملیات */}
        <Grid xs={12} sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "16px" }}>
          {onEdit && (
            <IconButton 
              onClick={() => onEdit(props.props.data)}
              sx={{ 
                backgroundColor: "#ff9100", 
                color: "#fff",
                "&:hover": { backgroundColor: "#e68000" }
              }}
            >
              <EditIcon />
            </IconButton>
          )}
          <IconButton 
            onClick={() => {
              // Load current sizes and colors when opening modal
              const data = props.props.data;
              if (data?.sizes && Array.isArray(data.sizes)) {
                setSelectedSizes(data.sizes);
              } else {
                setSelectedSizes([]);
              }
              if (data?.colors && Array.isArray(data.colors)) {
                setColors(data.colors);
              } else {
                setColors([]);
              }
              setSizeColorModalOpen(true);
            }}
            sx={{ 
              backgroundColor: "#9c27b0", 
              color: "#fff",
              "&:hover": { backgroundColor: "#7b1fa2" }
            }}
          >
            <PaletteIcon />
          </IconButton>
          <IconButton 
            onClick={handlePrint}
            sx={{ 
              backgroundColor: "#78b568", 
              color: "#fff",
              "&:hover": { backgroundColor: "#5a9a4a" }
            }}
          >
            <PrintIcon />
          </IconButton>
          <IconButton 
            onClick={() => {
              // بارگذاری تولیدکننده فعلی هنگام باز کردن مودال
              const data = props.props.data;
              if (data?.manufacturer_id) {
                setSelectedManufacturerId(data.manufacturer_id);
              } else {
                setSelectedManufacturerId("");
              }
              setManufacturerModalOpen(true);
            }}
            sx={{ 
              backgroundColor: "#2196f3", 
              color: "#fff",
              "&:hover": { backgroundColor: "#1976d2" }
            }}
          >
            <FactoryIcon />
          </IconButton>
        </Grid>
      </Grid>

      {/* Size and Color Modal */}
      <Dialog
        open={sizeColorModalOpen}
        onClose={() => setSizeColorModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#2b3143",
            borderRadius: "20px",
            border: "1px solid #505669",
          }
        }}
      >
        <DialogTitle sx={{ 
          color: "#fff", 
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
            sx={{ color: "#fff" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ padding: "24px", direction: "rtl" }}>
          {/* Size Selection */}
          <Box sx={{ marginBottom: "32px" }}>
            <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>
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
                      color: isSelected ? "#fff" : "#9ca3af",
                      borderColor: isSelected ? "#ff9100" : "#4b5563",
                      "&:hover": {
                        backgroundColor: isSelected ? "#e68000" : "#1f2937",
                        borderColor: isSelected ? "#e68000" : "#6b7280",
                        color: "#fff",
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
            <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>
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
                              border: color.hex === '#Fddddd' ? "1px solid #ddd" : "none",
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
                        backgroundColor: "#1a1d2e",
                        color: "#fff",
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
                        color: "#fff",
                        fontSize: "14px",
                      }
                    }}
                  />
                )}
                sx={{
                  flex: 1,
                  "& .MuiAutocomplete-popper": {
                    backgroundColor: "#2b3143",
                  },
                  "& .MuiAutocomplete-listbox": {
                    backgroundColor: "#2b3143",
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
                  color: "#fff",
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
                      color: "#fff",
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
              if (!productId) return;
              
              // Get current product data
              const product = props.props.data;
              
              // Prepare data with all product information
              const data: any = {
                name: product?.name || "",
                barcode: product?.barcode || "",
                purchase_price: product?.purchase_price?.toString() || "0",
                sale_price: product?.sale_price?.toString() || "0",
                quantity: product?.quantity?.toString() || "0",
                discount_percent: product?.discount_percent || 0,
              };
              
              // Add sizes and colors
              if (selectedSizes.length > 0) {
                data.sizes = selectedSizes;
              }
              if (colors.length > 0) {
                data.colors = colors;
              }
              
              // Add category_ids if exists
              if (product?.categories && Array.isArray(product.categories)) {
                data.category_ids = product.categories.map((cat: any) => cat.id || cat);
              } else if (product?.category_ids && Array.isArray(product.category_ids)) {
                data.category_ids = product.category_ids;
              }

              const token = tokenCode();
              try {
                const res = await apiRequestError("Put", {}, data, `/api/product/${productId}`, true, true, token);
                if (res.hasError) {
                  const parsedResponse = JSON.parse(res.errorText);
                  const readableMessage = parsedResponse.message;
                  toast.error(readableMessage || "خطا در ذخیره سایز و رنگ");
                } else {
                  toast.success("سایز و رنگ با موفقیت ذخیره شد");
                  setSizeColorModalOpen(false);
                }
              } catch (error) {
                toast.error("خطا در ذخیره سایز و رنگ");
              }
            }}
            variant="contained"
            sx={{
              backgroundColor: "#9c27b0",
              color: "#fff",
              "&:hover": { backgroundColor: "#7b1fa2" }
            }}
          >
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manufacturer Selection Modal */}
      <Dialog
        open={manufacturerModalOpen}
        onClose={() => setManufacturerModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#2b3143",
            borderRadius: "20px",
            border: "1px solid #505669",
          }
        }}
      >
        <DialogTitle sx={{ 
          color: "#fff", 
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
            sx={{ color: "#fff" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ padding: "24px", direction: "rtl" }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>تولیدکننده</InputLabel>
            <Select
              value={selectedManufacturerId}
              onChange={(e) => setSelectedManufacturerId(e.target.value as number | "")}
              label="تولیدکننده"
              sx={{
                color: '#fff',
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
                  color: '#fff',
                },
              }}
            >
              <MenuItem value="">
                <em>هیچکدام</em>
              </MenuItem>
              {manufacturersFromParent.map((manufacturer) => (
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
            onClick={async () => {
              if (!productId) return;
              
              try {
                const token = tokenCode();
                const product = props.props.data;
                const data: any = {
                  name: product?.name || "",
                  purchase_price: product?.purchase_price?.toString() || "0",
                  sale_price: product?.sale_price?.toString() || "0",
                  quantity: product?.quantity?.toString() || "0",
                  barcode: product?.barcode || "",
                };
                
                // اضافه کردن تولیدکننده در صورت وجود
                if (selectedManufacturerId && typeof selectedManufacturerId === 'number') {
                  data.manufacturer_id = selectedManufacturerId;
                }
                
                const res = await apiRequestError("Put", {}, data, `/api/product/${productId}`, true, true, token);
                console.log("ddddddddddddd2222" , res);
                if (res.hasError) {
                  toast.error(res.errorText || "خطا در بروزرسانی تولیدکننده");
                } else {
                  toast.success("تولیدکننده با موفقیت بروزرسانی شد");
                  setManufacturerModalOpen(false);
                  // بروزرسانی state محلی - props به صورت خودکار بروزرسانی می‌شود
                  // اگر manufacturer object در response آمده باشد، آن را هم ذخیره می‌کنیم
                  if (res.manufacturer && props.props.data) {
                    props.props.data.manufacturer = res.manufacturer;
                  }
                  // بروزرسانی manufacturer_id در props
                  if (props.props.data) {
                    props.props.data.manufacturer_id = selectedManufacturerId && typeof selectedManufacturerId === 'number' ? selectedManufacturerId : null;
                  }
                }
              } catch (error) {
                console.error("Error updating manufacturer:", error);
                toast.error("خطا در بروزرسانی تولیدکننده");
              }
            }}
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
    </Box>
  ) : (<></>)
}
