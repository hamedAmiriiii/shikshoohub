"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  IconButton, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiRequestError } from '@/app/lib/apiRequestError';

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('fa-IR').format(num);
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export default function PendingPurchasesPage() {
  const router = useRouter();
  const [pendingPurchases, setPendingPurchases] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

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

  // بارگذاری خریدهای pending از localStorage
  useEffect(() => {
    const loadPendingPurchases = () => {
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
    };

    loadPendingPurchases();

    // بروزرسانی هر 2 ثانیه
    const interval = setInterval(loadPendingPurchases, 2000);
    return () => clearInterval(interval);
  }, []);

  // تابع sync برای خریدهای pending
  const syncPendingPurchases = async () => {
    if (pendingPurchases.length === 0 || isSyncing) return;
    
    setIsSyncing(true);
    const purchasesToSync = [...pendingPurchases];
    const successful: string[] = [];
    const failed: any[] = [];

    for (let i = 0; i < purchasesToSync.length; i++) {
      const purchase = purchasesToSync[i];
      
      try {
        const res = await apiRequestError("Post", {}, purchase.data, `/api/purchased-products`, true, true, "");
        
        if (res.hasError) {
          failed.push(purchase);
        } else {
          successful.push(purchase.id);
        }
      } catch (error) {
        console.error(`خطا در sync خرید ${purchase.id}:`, error);
        failed.push(purchase);
      }
      
      if (i < purchasesToSync.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    const remaining = failed;
    setPendingPurchases(remaining);
    localStorage.setItem('pending_purchases', JSON.stringify(remaining));

    if (successful.length > 0 && failed.length === 0) {
      toast.success(`${successful.length} خرید با موفقیت ثبت شد`);
    } else if (successful.length > 0 && failed.length > 0) {
      toast.success(`${successful.length} خرید با موفقیت ثبت شد`);
      toast.warn(`${failed.length} خرید هنوز ثبت نشده است`);
    } else if (successful.length === 0 && failed.length > 0) {
      toast.error(`${failed.length} خرید ثبت نشد. لطفاً دوباره تلاش کنید`);
    }

    setIsSyncing(false);
  };

  // حذف یک خرید از صف
  const deletePendingPurchase = (purchaseId: string) => {
    const updated = pendingPurchases.filter(p => p.id !== purchaseId);
    setPendingPurchases(updated);
    localStorage.setItem('pending_purchases', JSON.stringify(updated));
    toast.success("خرید از صف حذف شد");
  };

  // حذف همه خریدها
  const deleteAllPendingPurchases = () => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید همه خریدهای در انتظار را حذف کنید؟')) {
      setPendingPurchases([]);
      localStorage.setItem('pending_purchases', JSON.stringify([]));
      toast.success("همه خریدها حذف شدند");
    }
  };

  const calculateTotal = (cart: any[]) => {
    return cart.reduce((sum, item) => {
      return sum + (Number(item.sale_price) * item.quantity);
    }, 0);
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', direction: "rtl", background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)" }}>
      <Container maxWidth="xl" sx={{ padding: { xs: '12px', md: '24px' }, paddingBottom: { xs: '100px', md: '40px' } }}>
        {/* Header */}
        <Box sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: { xs: "16px", md: "24px" }
        }}>
          <IconButton
            onClick={() => router.push('/shikshoo/admin')}
            sx={{
              color: "#fff",
              backgroundColor: "rgba(255,255,255,0.1)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.2)",
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ 
            fontWeight: "700", 
            fontSize: { xs: "18px", md: "24px" }, 
            color: "#fff"
          }}>
            خریدهای در انتظار
          </Typography>
          <Box sx={{ width: "40px" }} />
        </Box>

        {/* Status Banner */}
        {!isOnline && (
          <Box sx={{
            backgroundColor: "#ff9800",
            color: "#fff",
            padding: { xs: "8px 12px", md: "12px 20px" },
            borderRadius: { xs: "8px", md: "12px" },
            marginBottom: { xs: "12px", md: "16px" },
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <CloudQueueIcon sx={{ fontSize: { xs: "18px", md: "24px" } }} />
            <Typography sx={{ fontSize: { xs: "12px", md: "14px" }, fontWeight: "600" }}>
              حالت Offline - خریدها بعد از اتصال به اینترنت ارسال می‌شوند
            </Typography>
          </Box>
        )}

        {/* Actions */}
        {pendingPurchases.length > 0 && (
          <Box sx={{ 
            display: "flex", 
            gap: "12px", 
            marginBottom: "16px",
            flexDirection: { xs: "column", md: "row" }
          }}>
            {isOnline && !isSyncing && (
              <Button
                onClick={syncPendingPurchases}
                variant="contained"
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  fontWeight: "600",
                  "&:hover": {
                    transform: "translateY(-2px)",
                  }
                }}
              >
                همگام‌سازی همه خریدها
              </Button>
            )}
            {isSyncing && (
              <Button
                disabled
                variant="contained"
                startIcon={<CircularProgress size={20} sx={{ color: "#fff" }} />}
                sx={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                }}
              >
                در حال همگام‌سازی...
              </Button>
            )}
            <Button
              onClick={deleteAllPendingPurchases}
              variant="outlined"
              sx={{
                borderColor: "#ff4444",
                color: "#ff4444",
                "&:hover": {
                  borderColor: "#ff6666",
                  backgroundColor: "rgba(255, 68, 68, 0.1)",
                }
              }}
            >
              حذف همه
            </Button>
          </Box>
        )}

        {/* Purchases List */}
        {pendingPurchases.length > 0 ? (
          <TableContainer 
            component={Paper} 
            sx={{ 
              borderRadius: { xs: "12px", md: "16px" },
              backgroundColor: "#2b3143",
              border: "1px solid rgba(55, 84, 165, 0.3)",
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#1a1d2e" }}>
                  <TableCell align="right" sx={{ color: "#fff", fontWeight: "600" }}>
                    تاریخ
                  </TableCell>
                  <TableCell align="right" sx={{ color: "#fff", fontWeight: "600" }}>
                    شماره تلفن
                  </TableCell>
                  <TableCell align="right" sx={{ color: "#fff", fontWeight: "600" }}>
                    تعداد کالا
                  </TableCell>
                  <TableCell align="right" sx={{ color: "#fff", fontWeight: "600" }}>
                    مجموع
                  </TableCell>
                  <TableCell align="right" sx={{ color: "#fff", fontWeight: "600" }}>
                    عملیات
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingPurchases.map((purchase) => (
                  <TableRow 
                    key={purchase.id}
                    sx={{
                      backgroundColor: "#2b3143",
                      "&:hover": {
                        backgroundColor: "#1a1d2e",
                      }
                    }}
                  >
                    <TableCell align="right" sx={{ color: "#fff" }}>
                      {formatDate(purchase.timestamp)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "#fff" }}>
                      {purchase.phone || "بدون شماره تلفن"}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "#fff" }}>
                      {purchase.cart?.length || purchase.data?.products?.length || 0} کالا
                    </TableCell>
                    <TableCell align="right" sx={{ color: "#78b568", fontWeight: "600" }}>
                      {formatNumber(purchase.total || calculateTotal(purchase.cart || []))} تومان
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => deletePendingPurchase(purchase.id)}
                        sx={{
                          color: "#ff4444",
                          "&:hover": {
                            backgroundColor: "rgba(255, 68, 68, 0.1)",
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Card sx={{ 
            backgroundColor: "#2b3143", 
            borderRadius: { xs: "12px", md: "16px" },
            border: "1px solid rgba(55, 84, 165, 0.3)",
            textAlign: "center",
            padding: { xs: "24px", md: "48px" }
          }}>
            <CardContent>
              <CloudQueueIcon sx={{ 
                fontSize: { xs: "48px", md: "80px" }, 
                color: "rgba(255,255,255,0.3)", 
                marginBottom: { xs: "12px", md: "20px" } 
              }} />
              <Typography sx={{ 
                color: "rgba(255,255,255,0.6)", 
                fontSize: { xs: "14px", md: "20px" } 
              }}>
                هیچ خرید در انتظاری وجود ندارد
              </Typography>
            </CardContent>
          </Card>
        )}
      </Container>
      <ToastContainer autoClose={3000} style={{ marginBottom: '76px', borderRadius: "15px" }} position={"bottom-right"} />
    </Box>
  );
}

