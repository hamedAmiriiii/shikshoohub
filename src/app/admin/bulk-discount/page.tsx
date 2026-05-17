"use client";
import React, { useState, useEffect } from "react";
import { Box, Grid, Typography, Button, Checkbox, CircularProgress, Card, CardContent } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import TextInput from "@/app/coponent/TextInput/TextInput";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { apiRequestError } from "@/app/lib/apiRequestError";
import tokenCode from "@/app/coponent/tokenCode";
import { useQueryClient } from '@tanstack/react-query';

const formatNumber = (num: number | string) => {
  const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(numValue)) return '0';
  return new Intl.NumberFormat('fa-IR').format(numValue);
};

export default function BulkDiscountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [discountPercent, setDiscountPercent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allSelected, setAllSelected] = useState(false);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const token = tokenCode();
        const res = await apiRequestError("Get", {}, {}, `/api/product-all`, true, true, token);
        
        if (res.hasError) {
          toast.error("خطا در دریافت لیست محصولات");
          return;
        }
        
        // /api/product-all مستقیماً یک آرایه برمی‌گرداند
        if (Array.isArray(res) && res.length > 0) {
          setProducts(res);
        } else if (Array.isArray(res)) {
          setProducts([]);
        } else {
          toast.error("خطا در دریافت لیست محصولات");
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("خطا در دریافت لیست محصولات");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle select all
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedProducts(products.map(p => p.id));
      setAllSelected(true);
    } else {
      setSelectedProducts([]);
      setAllSelected(false);
    }
  };

  // Handle individual product selection
  const handleProductSelect = (productId: number) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        const newSelection = prev.filter(id => id !== productId);
        setAllSelected(newSelection.length === products.length);
        return newSelection;
      } else {
        const newSelection = [...prev, productId];
        setAllSelected(newSelection.length === products.length);
        return newSelection;
      }
    });
  };

  // Handle apply discount
  const handleApplyDiscount = async () => {
    if (selectedProducts.length === 0) {
      toast.error("لطفاً حداقل یک محصول را انتخاب کنید");
      return;
    }

    // if (!discountPercent || parseFloat(discountPercent) <= 0) {
    //   toast.error("لطفاً درصد تخفیف معتبری وارد کنید");
    //   return;
    // }

    const discountValue = parseFloat(discountPercent);
    if (discountValue < 0 || discountValue >100) {
      toast.error("درصد تخفیف باید بین 0 تا 100 باشد");
      return;
    }

    setIsSubmitting(true);
    const token = tokenCode();

    try {
      const data = {
        product_ids: selectedProducts,
        discount_percent: discountValue
      };

      const res = await apiRequestError("Post", {}, data, `/api/products/apply-discount`, true, true, token);
      
      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        const readableMessage = parsedResponse.message || "خطا در اعمال تخفیف";
        toast.error(readableMessage);
        return;
      }

      toast.success(`تخفیف ${discountValue}% با موفقیت برای ${selectedProducts.length} محصول اعمال شد`);
      
      // Reset form
      setSelectedProducts([]);
      setDiscountPercent("");
      setAllSelected(false);
      
      // Invalidate query cache برای refresh لیست محصولات در صفحه product
      // Invalidate همه query keys مربوط به product
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          // بررسی query keys مربوط به product
          if (queryKey[0] === "datas-infinite" || queryKey[0] === "datas-desktop") {
            // بررسی اینکه url مربوط به /api/product است
            // url در index 2 برای infinite و desktop قرار دارد
            const url = queryKey[2];
            if (url && typeof url === 'string' && url.includes("/api/product")) {
              return true;
            }
          }
          return false;
        }
      });
      
      // Dispatch custom event برای refresh لیست محصولات
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refresh-product-list'));
      }
      
      // Refresh products list
      const updatedRes = await apiRequestError("Get", {}, {}, `/api/product-all`, true, true, token);
      if (!updatedRes.hasError && Array.isArray(updatedRes)) {
        setProducts(updatedRes);
      }
    } catch (error) {
      console.error("Error applying discount:", error);
      toast.error("خطا در اعمال تخفیف");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", padding: "16px", direction: "rtl", background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)" }}>
    

      {/* Discount Input */}
      <Card sx={{ backgroundColor: "#1a1d2e", marginBottom: "20px", border: "1px solid #505669" }}>
        <CardContent>
          <TextInput
            value={discountPercent}
            label="درصد تخفیف"
            onChange={(value) => setDiscountPercent(value)}
            name="discountPercent"
            type="number"
          />
          <Button
            variant="contained"
            onClick={handleApplyDiscount}
            disabled={isSubmitting || selectedProducts.length === 0 || !discountPercent}
            fullWidth
            sx={{
              backgroundColor: "#78b568",
              color: "#fff",
              padding: "12px",
              fontSize: "16px",
              fontWeight: "600",
              marginTop: "16px",
              "&:hover": {
                backgroundColor: "#5a9a4a"
              },
              "&:disabled": {
                backgroundColor: "#505669",
                color: "#999"
              }
            }}
          >
            {isSubmitting ? "در حال اعمال..." : `اعمال تخفیف برای ${selectedProducts.length} محصول`}
          </Button>
        </CardContent>
      </Card>

      {/* Products List */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <CircularProgress sx={{ color: "#ff9100" }} />
        </Box>
      ) : products.length === 0 ? (
        <Box sx={{ textAlign: "center", padding: "40px" }}>
          <Typography sx={{ color: "#999", fontSize: "18px" }}>
            محصولی یافت نشد
          </Typography>
        </Box>
      ) : (
        <>
          {/* Select All */}
          <Card sx={{ backgroundColor: "#1a1d2e", marginBottom: "12px", border: "1px solid #505669" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Checkbox
                  checked={allSelected}
                  onChange={handleSelectAll}
                  sx={{
                    color: "#ff9100",
                    "&.Mui-checked": {
                      color: "#ff9100"
                    }
                  }}
                />
                <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: "600" }}>
                  انتخاب همه ({products.length} محصول)
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Products */}
          <Grid container spacing={2}>
            {products.map((product) => (
              <Grid item xs={12} key={product.id}>
                <Card
                  sx={{
                    backgroundColor: "#1a1d2e",
                    border: selectedProducts.includes(product.id) ? "2px solid #ff9100" : "1px solid #505669",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      borderColor: "#ff9100",
                      transform: "translateY(-2px)"
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleProductSelect(product.id)}
                        sx={{
                          color: "#ff9100",
                          "&.Mui-checked": {
                            color: "#ff9100"
                          }
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
                          {product.name || "بدون نام"}
                        </Typography>
                        <Box sx={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                          {product.barcode && (
                            <Typography sx={{ color: "#999", fontSize: "14px" }}>
                              بارکد: {product.barcode}
                            </Typography>
                          )}
                          {product.has_discount ? (
                            <Box sx={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                              <Typography sx={{ color: "#999", fontSize: "14px", textDecoration: "line-through" }}>
                                قیمت اصلی: {formatNumber(product.original_sale_price)} تومان
                              </Typography>
                              <Typography sx={{ color: "#78b568", fontSize: "14px", fontWeight: "600" }}>
                                قیمت با تخفیف: {formatNumber(product.sale_price)} تومان
                              </Typography>
                              <Typography sx={{ 
                                color: "#ff9100", 
                                fontSize: "14px", 
                                fontWeight: "600",
                                backgroundColor: "rgba(255, 145, 0, 0.1)",
                                padding: "2px 8px",
                                borderRadius: "4px"
                              }}>
                                تخفیف: {formatNumber(product.discount_percent)}%
                              </Typography>
                            </Box>
                          ) : (
                            product.sale_price && (
                              <Typography sx={{ color: "#999", fontSize: "14px" }}>
                                قیمت فروش: {formatNumber(product.sale_price)} تومان
                              </Typography>
                            )
                          )}
                          {product.quantity !== undefined && (
                            <Typography sx={{ color: "#999", fontSize: "14px" }}>
                              موجودی: {formatNumber(product.quantity)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <ToastContainer autoClose={3000} style={{ marginBottom: '76px', borderRadius: "15px" }} position={"bottom-right"} />
    </Box>
  );
}

