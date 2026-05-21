

"use client";
import tokenCode from "@/app/coponent/tokenCode";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Checkbox,
  Collapse,
  Paper,
  Container,
  Divider,
  Modal,
  TextField,
  Input,
} from "@mui/material";
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import FlashlightOnIcon from '@mui/icons-material/FlashlightOn';
import FlashlightOffIcon from '@mui/icons-material/FlashlightOff';
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import TextInput from "@/app/coponent/TextInput/TextInput";
import { useRouter } from "next/navigation";
import 'react-toastify/dist/ReactToastify.css';


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
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scanManualCode, setScanManualCode] = useState("");
  const barcodeScanInputRef = useRef<HTMLInputElement>(null);

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

  // دریافت لیست تولیدکنندگان
  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        const token = tokenCode();
        const res = await apiRequestError("Get", {}, {}, `/api/manufacturers`, true, true, token);
        
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
              backgroundColor: 'rgba(120, 181, 104, 0.1)',
            },
          }}
          onClick={handleToggle}
        >
          {hasChildren ? (
            expanded ? (
              <ExpandMoreIcon sx={{ color: '#78b568', fontSize: '20px', marginLeft: '8px' }} />
            ) : (
              <ChevronRightIcon sx={{ color: '#78b568', fontSize: '20px', marginLeft: '8px' }} />
            )
          ) : (
            <Box sx={{ width: '20px', marginLeft: '8px' }} />
          )}
          <Checkbox
            checked={isSelected}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
            sx={{
              color: '#78b568',
              '&.Mui-checked': {
                color: '#78b568',
              },
            }}
          />
          <Typography sx={{ color: '#fff', fontSize: '14px', flex: 1 }}>
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

  const confirm = () => {

    if (sale_price && purchase_price && quantity && full_name) {
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
      let token = tokenCode()
      apiRequestError("Post", {}, data, "/api/product", true, true, token).then((res) => {
        if (res.hasError) {

          const parsedResponse = JSON.parse(res.errorText);
          const readableMessage = parsedResponse.message;
          toast.error(readableMessage)
          return
        }

        toast.success("کالا با موفقیت ثبت شد")
        setTimeout(() => {
          setBarcode("")
          setPale_price("")
          setPurchase_price("")
          setQuantity("")
          setfull_name("")
          setProfitPercentage(45) // بازگشت به مقدار پیش‌فرض
          setDiscountPercent("") // پاک کردن درصد تخفیف
          setImages([]) // پاک کردن عکس‌ها
          setCategoryIds([]) // پاک کردن دسته‌بندی‌ها
          setManufacturerId("") // پاک کردن تولیدکننده
        }, 1000);

      })



    } else {
      toast.error("تمامی موارد را تکمیل کنید")
    }
  }



  const fieldWrapSx = {
    width: "100%",
    "& > div": { marginTop: 0, width: "100%" },
    "& > div > div:last-of-type": { width: "100%" },
    "& > div > div:last-of-type > div": { width: "100% !important", maxWidth: "100%" },
    "& .MuiTypography-root": { color: "#fff" },
  } as const;

  const selectSx = {
    color: "#fff",
    borderRadius: "12px",
    backgroundColor: "#1a1d2e",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#505669" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#78b568" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#78b568" },
    "& .MuiSvgIcon-root": { color: "#fff" },
  } as const;

  const sectionTitleSx = {
    color: "#fff",
    fontSize: { xs: "15px", md: "16px" },
    fontWeight: 700,
    mb: 1.5,
  } as const;

  const barcodeFieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#1a1d2e",
      color: "#fff",
      borderRadius: "12px",
      "& fieldset": { borderColor: "#505669" },
      "&:hover fieldset": { borderColor: "#78b568" },
      "&.Mui-focused fieldset": { borderColor: "#78b568" },
    },
    "& .MuiInputBase-input": {
      color: "#fff",
      fontSize: { xs: "13px", md: "14px" },
      direction: "ltr",
      textAlign: "left",
    },
    "& .MuiInputBase-input::placeholder": {
      color: "rgba(255,255,255,0.4)",
      opacity: 1,
    },
  } as const;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        direction: "rtl",
        background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)",
        px: { xs: 1, sm: 2, md: 3 },
        py: { xs: 1.5, md: 2.5 },
        pb: { xs: "calc(100px + env(safe-area-inset-bottom, 0px))", md: 10 },
        boxSizing: "border-box",
      }}
    >
      <Container maxWidth="lg" disableGutters sx={{ px: { xs: 0, sm: 1 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            borderRadius: { xs: "14px", md: "18px" },
            backgroundColor: "#2b3143",
            border: "1px solid rgba(55, 84, 165, 0.35)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 700,
              fontSize: { xs: "18px", md: "22px" },
              mb: 0.5,
              textAlign: "center",
            }}
          >
            ثبت کالای جدید
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "13px",
              textAlign: "center",
              mb: 2.5,
            }}
          >
            فیلدهای ستاره‌دار را پر کنید
          </Typography>

          <Grid container spacing={{ xs: 1.5, md: 2 }}>
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

            <Grid item xs={12} md={6}>
              <Typography
                textAlign="right"
                sx={{ color: "#fff", fontSize: { xs: "14px", md: "15px" }, mt: { xs: 0, md: "10px" }, mb: 0.5 }}
              >
                بارکد (اختیاری) :
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "12px",
                  mb: 1,
                  display: { xs: "block", md: "none" },
                }}
              >
                اگر خالی بماند، بعد از ثبت بارکد خودکار برابر شناسه محصول است. در فروشگاه یکتا باشد.
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "stretch",
                  p: { xs: 1.25, md: 0 },
                  mt: { md: 0 },
                  borderRadius: "12px",
                  border: { xs: "1px solid rgba(120, 181, 104, 0.25)", md: "none" },
                  backgroundColor: { xs: "#1a1d2e", md: "transparent" },
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
                    width: 48,
                    height: 40,
                    alignSelf: "center",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "#fff",
                    "&:hover": {
                      background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                    },
                  }}
                >
                  <QrCodeScannerIcon sx={{ fontSize: 22 }} />
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
            <Grid item xs={12} sm={6} md={4}>
              <FormControl
                fullWidth
                sx={{
                  mt: { xs: 0.5, md: 2 },
                  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.85)" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#78b568" },
                }}
              >
                <InputLabel>تولیدکننده (اختیاری)</InputLabel>
                <Select
                  value={manufacturerId}
                  onChange={(e) => setManufacturerId(e.target.value as number | "")}
                  label="تولیدکننده (اختیاری)"
                  sx={selectSx}
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
            </Grid>
          </Grid>

          <Divider sx={{ my: 2.5, borderColor: "rgba(255,255,255,0.1)" }} />

          <Typography sx={sectionTitleSx}>دسته‌بندی‌ها (اختیاری)</Typography>
          {categoryIds.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
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
                      backgroundColor: "#78b568",
                      color: "#fff",
                      "& .MuiChip-deleteIcon": {
                        color: "#fff",
                        "&:hover": { color: "#ff4444" },
                      },
                    }}
                  />
                );
              })}
            </Box>
          )}
          <Paper
            sx={{
              backgroundColor: "#1a1d2e",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              maxHeight: { xs: 220, md: 280 },
              overflow: "auto",
              py: 0.5,
            }}
          >
            {categories.map((category) => (
              <CategoryTreeItem key={category.id} category={category} />
            ))}
          </Paper>

          <Divider sx={{ my: 2.5, borderColor: "rgba(255,255,255,0.1)" }} />

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
                borderColor: "#78b568",
                color: "#78b568",
                borderRadius: "12px",
                py: 1.25,
                mb: 2,
                "&:hover": {
                  borderColor: "#5a9a4a",
                  backgroundColor: "rgba(120, 181, 104, 0.1)",
                },
              }}
            >
              افزودن تصویر
            </Button>
          </label>

          {images.length > 0 && (
            <Grid container spacing={1.5}>
              {images.map((image, index) => (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <Card
                    sx={{
                      position: "relative",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={image}
                      alt={`تصویر ${index + 1}`}
                      sx={{ height: { xs: 120, md: 140 }, objectFit: "cover" }}
                    />
                    <IconButton
                      onClick={() => handleRemoveImage(index)}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        backgroundColor: "rgba(0,0,0,0.55)",
                        color: "#fff",
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
              mt: 3,
              mb: { xs: 2, md: 1 },
              pt: 1,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1.5,
            }}
          >
            <Button
              onClick={() => confirm()}
              variant="contained"
              fullWidth
              sx={{
                flex: { sm: 2 },
                borderRadius: "14px",
                py: 1.5,
                bgcolor: "#78b568",
                fontWeight: 700,
                fontSize: "16px",
                boxShadow: "none",
                "&:hover": { bgcolor: "#5a9a4a" },
              }}
            >
              ثبت کالا
            </Button>
            <Button
              onClick={() => router.push("/admin/product")}
              variant="outlined"
              fullWidth
              sx={{
                flex: { sm: 1 },
                borderRadius: "14px",
                py: 1.5,
                borderColor: "#ff9100",
                color: "#ff9100",
                fontWeight: 600,
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
            bgcolor: "#2b3143",
            p: 3,
            width: "90%",
            maxWidth: "450px",
            borderRadius: "16px",
            border: "1px solid rgba(55, 84, 165, 0.3)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: 700, flex: 1, textAlign: "center" }}>
              اسکن بارکد کالا
            </Typography>
            <IconButton
              onClick={() => setTorchOn(!torchOn)}
              sx={{
                color: "#fff",
                backgroundColor: torchOn ? "#78b568" : "#1a1d2e",
                p: 0.75,
                "&:hover": { backgroundColor: torchOn ? "#5a9a4a" : "#2b3143" },
              }}
            >
              {torchOn ? <FlashlightOnIcon /> : <FlashlightOffIcon />}
            </IconButton>
          </Box>
          <Box
            sx={{
              backgroundColor: "#1a1d2e",
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
              backgroundColor: "#1a1d2e",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "13px",
              p: 1.25,
              mb: 1,
              direction: "ltr",
              textAlign: "left",
              "&::placeholder": { color: "rgba(255,255,255,0.45)", opacity: 1 },
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
