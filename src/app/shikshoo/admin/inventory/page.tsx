"use client";
import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Card, CardContent } from '@mui/material';
import { useRouter } from 'next/navigation';
import { apiRequestError } from '@/app/lib/apiRequestError';
import tokenCode from '@/app/coponent/tokenCode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface InventoryData {
  total_purchase_value: number;
  total_sale_value: number;
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('fa-IR').format(num);
};

export default function InventoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryData | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      const token = tokenCode();
      try {
        const res = await apiRequestError("Get", {}, {}, "/api/reports", true, true, "");
        if (res.hasError) {
          const parsedResponse = JSON.parse(res.errorText);
          const readableMessage = parsedResponse.message;
          toast.error(readableMessage || "خطا در دریافت موجودی انبار");
          return;
        }
        
        // Extract inventory data from response
        if (res.products_inventory) {
          setInventory(res.products_inventory);
        } else if (res.inventory) {
          setInventory(res.inventory);
        } else {
          toast.error("اطلاعات موجودی انبار یافت نشد");
        }
      } catch (error) {
        toast.error("خطا در دریافت موجودی انبار");
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const calculateProfit = () => {
    if (!inventory) return 0;
    return inventory.total_sale_value - inventory.total_purchase_value;
  };

  const calculateProfitPercentage = () => {
    if (!inventory || inventory.total_purchase_value === 0) return 0;
    return ((calculateProfit() / inventory.total_purchase_value) * 100).toFixed(1);
  };

  return (
    <Box sx={{ width: "100%", direction: "rtl", padding: "16px", minHeight: "100vh", background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)" }}>
     

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <CircularProgress sx={{ color: "#78b568" }} />
        </Box>
      ) : inventory ? (
        <Grid container spacing={3}>
          {/* قیمت خرید کل */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{
                padding: "24px",
                background: "linear-gradient(135deg, #78b568 0%, #5a9a4a 100%)",
                borderRadius: "16px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
                cursor: "pointer",
                "&:hover": {
                  transform: "translateY(-6px)",
                },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "100px",
                  height: "100px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                  transform: "translate(30px, -30px)",
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "80px",
                  height: "80px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                  transform: "translate(-20px, 20px)",
                },
              }}
            >
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: "700", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
                    قیمت خرید کل
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: "10px",
                      padding: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <AttachMoneyIcon sx={{ color: "#fff", fontSize: "24px" }} />
                  </Box>
                </Box>
                <Typography sx={{ color: "#fff", fontSize: "32px", fontWeight: "700", textShadow: "0 2px 4px rgba(0,0,0,0.2)", marginBottom: "4px" }}>
                  {formatNumber(inventory.total_purchase_value)}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>
                  تومان
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* قیمت فروش کل */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{
                padding: "24px",
                background: "linear-gradient(135deg, #ff9100 0%, #ff6f00 100%)",
                borderRadius: "16px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
                cursor: "pointer",
                "&:hover": {
                  transform: "translateY(-6px)",
                 },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "100px",
                  height: "100px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                  transform: "translate(30px, -30px)",
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "80px",
                  height: "80px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                  transform: "translate(-20px, 20px)",
                },
              }}
            >
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: "700", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
                    قیمت فروش کل
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: "10px",
                      padding: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <TrendingUpIcon sx={{ color: "#fff", fontSize: "24px" }} />
                  </Box>
                </Box>
                <Typography sx={{ color: "#fff", fontSize: "32px", fontWeight: "700", textShadow: "0 2px 4px rgba(0,0,0,0.2)", marginBottom: "4px" }}>
                  {formatNumber(inventory.total_sale_value)}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>
                  تومان
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* سود احتمالی */}
          <Grid item xs={12} sm={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                padding: "24px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "16px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
                cursor: "pointer",
                "&:hover": {
                  transform: "translateY(-6px)",
                },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "100px",
                  height: "100px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                  transform: "translate(30px, -30px)",
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "80px",
                  height: "80px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                  transform: "translate(-20px, 20px)",
                },
              }}
            >
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: "700", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
                    سود احتمالی
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: "10px",
                      padding: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <InventoryIcon sx={{ color: "#fff", fontSize: "24px" }} />
                  </Box>
                </Box>
                <Typography sx={{ color: "#fff", fontSize: "32px", fontWeight: "700", textShadow: "0 2px 4px rgba(0,0,0,0.2)", marginBottom: "4px" }}>
                  {formatNumber(calculateProfit())}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                  <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>
                    تومان
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.25)",
                      borderRadius: "8px",
                      padding: "4px 12px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#fff",
                    }}
                  >
                    {calculateProfitPercentage()}%
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <Typography sx={{ color: "#fff", fontSize: "18px" }}>
            داده‌ای برای نمایش وجود ندارد
          </Typography>
        </Box>
      )}

      <ToastContainer autoClose={3000} style={{ marginBottom: '76px', borderRadius: "15px" }} position={"bottom-right"} />
    </Box>
  );
}

