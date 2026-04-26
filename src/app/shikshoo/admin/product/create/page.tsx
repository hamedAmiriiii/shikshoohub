

"use client";
import tokenCode from "@/app/coponent/tokenCode";
import { apiRequestError } from "@/app/lib/apiRequestError";
import React, { useState, Suspense, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";

import "react-multi-date-picker/styles/layouts/mobile.css"
import { Box, Button, Typography, IconButton, Grid, Card, CardMedia, Select, MenuItem, FormControl, InputLabel, Chip, OutlinedInput, Checkbox, Collapse, Paper } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PhoneNumberInput from "@/app/coponent/PhoneNumberInput/PhoneNumberInput";
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
      
      let data: any = {
        "name": full_name,
        "purchase_price": purchase_price,
        "sale_price": sale_price,
        "quantity": quantity,
        "discount_percent": isNaN(discountValue) ? 0 : discountValue
        // "barcode": barcode
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



  return (
    <Box sx={{ minHeight: "100vh", padding: "16px", paddingBottom: "100px", direction: "rtl", background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)" }}>
      
     
      <Box sx={{ width: "100%", direction: "rtl" }} className="flex mt-8 items-center justify-center">
        <Box sx={{ textAlign: "center" }}>
          <Box mt={4} sx={{ width: "100%", color: "#fff", marginTop: "20px", marginRight: "20px" }}>
            <TextInput value={full_name} label="نام کالا" onChange={(e) => setfull_name(e)} name="fulname" type="text" />
            <TextInput 
              value={profitPercentage.toString()} 
              label="درصد سود" 
              onChange={(e) => handleProfitPercentageChange(e)} 
              name="profitPercentage"
              type="number"
            />
            <TextInput
              value={purchase_price} 
              label="قیمت خرید" 
              onChange={(e) => handlePurchasePriceChange(e)} 
              name="purchase_price"
              type="number"
            />
            <TextInput value={sale_price} label="قیمت فروش" onChange={(e) => setPale_price(e)} name="sale_price" type="number" />
            <TextInput 
              value={discountPercent} 
              label="درصد تخفیف (اختیاری)" 
              onChange={(e) => setDiscountPercent(e)} 
              name="discountPercent" 
              type="number" 
            />
            <TextInput value={quantity} label="موجودی" onChange={(e) => setQuantity(e)} name="quantity" type="number" />
            
            {/* Manufacturer Selection */}
            <Box sx={{ marginTop: "20px", marginBottom: "20px" }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>تولیدکننده (اختیاری)</InputLabel>
                <Select
                  value={manufacturerId}
                  onChange={(e) => setManufacturerId(e.target.value as number | "")}
                  label="تولیدکننده (اختیاری)"
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#505669',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#78b568',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#78b568',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#fff',
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
            </Box>
            
            {/* Category Selection */}
            <Box sx={{ marginTop: "20px", marginBottom: "20px" }}>
              <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
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
                          backgroundColor: '#78b568',
                          color: '#fff',
                          fontSize: '12px',
                          '& .MuiChip-deleteIcon': {
                            color: '#fff',
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
                  backgroundColor: '#2b3143',
                  border: '1px solid rgba(255,255,255,0.1)',
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
            
            {/* Image Upload Section */}
            <Box sx={{ marginTop: "20px", marginBottom: "20px" }}>
              <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
                تصاویر محصول (اختیاری)
              </Typography>
              
              {/* Upload Button */}
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                multiple
                type="file"
                onChange={handleImageUpload}
              />
              <label htmlFor="image-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<AddPhotoAlternateIcon />}
                  sx={{
                    borderColor: "#78b568",
                    color: "#78b568",
                    "&:hover": {
                      borderColor: "#5a9a4a",
                      backgroundColor: "rgba(120, 181, 104, 0.1)",
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
                            color: '#fff',
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
          </Box>
          <Box sx={{ marginTop: "20px", height: "20vh" }}>
            <Button 
              onClick={() => confirm()} 
              sx={{ marginLeft: "5px", marginTop: "15px", borderRadius: "25px", bgcolor: "#78b568", color: "#fff", width: "60%", height: "60px", fontWeight: "600" }}
              variant="contained"
            >
              ثبت
            </Button>
            <Button 
              onClick={() => router.push("/shikshoo/admin")} 
              sx={{ marginTop: "15px", borderRadius: "25px", bgcolor: "#ff9100", color: "#fff", width: "30%", height: "60px", fontWeight: "600" }}
              variant="contained"
            >
              انصراف
            </Button>
          </Box>
        </Box>
      </Box>

      <ToastContainer autoClose={3000} style={{ marginBottom: '56px', borderRadius: "15px" }} position={"bottom-right"} />
    </Box>
  );
}
