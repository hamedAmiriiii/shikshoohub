"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Paper,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  IconButton,
} from "@mui/material";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CancelIcon from "@mui/icons-material/Cancel";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiRequestError } from "@/app/lib/apiRequestError";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ProductImage {
  id: number;
  product_id: number;
  image_path: string;
  order: number;
  image_url: string;
}

interface Product {
  id: number;
  name: string;
  barcode: string;
  sale_price: string | number;
  images: ProductImage[];
}

interface OrderItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  price: string | number;
  size?: string | null;
  color?: string | null;
  product: Product;
}

interface Order {
  id: number;
  customer_id: number;
  status: string;
  shipping_name: string;
  shipping_last_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_state_id: number;
  shipping_state_name: string;
  shipping_city_id: number;
  shipping_city_name: string;
  shipping_postal_code: string;
  created_at: string;
  updated_at: string;
  total: string | number;
  items_count: number;
  items: OrderItem[];
}

const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  pending: { color: "#ff9800", label: "در انتظار تایید", icon: <HourglassEmptyIcon /> },
  processing: { color: "#2196f3", label: "در حال پردازش", icon: <HourglassEmptyIcon /> },
  shipped: { color: "#9c27b0", label: "ارسال شده", icon: <LocalShippingIcon /> },
  delivered: { color: "#4caf50", label: "تحویل داده شده", icon: <CheckCircleIcon /> },
  completed: { color: "#4caf50", label: "تکمیل شده", icon: <CheckCircleIcon /> },
  cancelled: { color: "#f44336", label: "لغو شده", icon: <CancelIcon /> },
};

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      toast.error("لطفاً ابتدا وارد شوید");
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequestError(
        "Get",
        {},
        {},
        "/api/cart/my-orders",
        true,
        true,
        token
      );

      if (!res.hasError) {
        // Handle paginated response
        const ordersData = res.data || res || [];
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } else {
        toast.error("خطا در دریافت سفارشات");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("خطا در دریافت سفارشات");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    const token = localStorage.getItem("customer_token");
    if (!token) return;

    setDetailsLoading(true);
    try {
      const res = await apiRequestError(
        "Get",
        {},
        {},
        `/api/cart/my-orders/${orderId}`,
        true,
        true,
        token
      );

      if (!res.hasError) {
        setSelectedOrder(res.data || res);
        setDialogOpen(true);
      } else {
        toast.error("خطا در دریافت جزئیات سفارش");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("خطا در دریافت جزئیات سفارش");
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("fa-IR").format(numPrice);
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("fa-IR");
    } catch {
      return dateString;
    }
  };

  const getProductImage = (item: OrderItem): string => {
    if (item.product?.images && item.product.images.length > 0) {
      const imageUrl = item.product.images[0].image_url;
      if (imageUrl) {
        if (imageUrl.startsWith("http")) {
          return imageUrl;
        }
        return `https://api.webinoplus.ir${imageUrl}`;
      }
    }
    return "/pic/noImageShop.jpg";
  };

  const getFullName = (order: Order): string => {
    const parts = [order.shipping_name, order.shipping_last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "---";
  };

  return (
    <Container maxWidth="lg" sx={{ padding: { xs: "16px", md: "24px" }, paddingBottom: "100px" }}>
      <ToastContainer rtl position="top-center" />

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
          padding: { xs: "16px", md: "20px 24px" },
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(102, 126, 234, 0.25)",
        }}
      >
        <Box sx={{ display: "flex", gap: "8px" }}>
        
        <IconButton
          onClick={() => router.back()}
          sx={{
            backgroundColor: "rgba(255,255,255,0.2)",
            color: "#fff",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
         
          <Box>
            <Typography sx={{ color: "#fff", fontWeight: "700", fontSize: { xs: "18px", md: "20px" } }}>
              سفارشات من
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>
              {orders.length} سفارش
            </Typography>
          </Box>
          <Box
            sx={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingBagIcon sx={{ color: "#fff", fontSize: "26px" }} />
          </Box>
        </Box>

        
      </Box>

      {/* Orders List */}
      {loading ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "300px",
            gap: "16px",
          }}
        >
          <CircularProgress sx={{ color: "#667eea" }} />
          <Typography sx={{ color: "#666" }}>در حال دریافت سفارشات...</Typography>
        </Box>
      ) : orders.length === 0 ? (
        <Paper
          sx={{
            padding: "60px 40px",
            textAlign: "center",
            borderRadius: "16px",
            backgroundColor: "#fff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <ShoppingBagIcon sx={{ fontSize: "80px", color: "#ddd", marginBottom: "16px" }} />
          <Typography sx={{ color: "#666", fontSize: "18px", marginBottom: "8px" }}>
            هنوز سفارشی ثبت نکرده‌اید
          </Typography>
          <Typography sx={{ color: "#999", fontSize: "14px", marginBottom: "24px" }}>
            با خرید از فروشگاه، سفارشات شما در این بخش نمایش داده می‌شود
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push("")}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              borderRadius: "15px",
              padding: "12px 32px",
            }}
          >
            مشاهده محصولات
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;

            return (
              <Grid item xs={12} key={order.id}>
                <Card
                  sx={{
                    borderRadius: "16px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    border: "1px solid #f0f0f0",
                    overflow: "hidden",
                  }}
                >
                  <CardContent sx={{ padding: { xs: "16px", md: "20px" } }}>
                    {/* Order Header */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "12px",
                        marginBottom: "16px",
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: "700", fontSize: "16px", color: "#333", marginBottom: "4px" }}>
                          سفارش #{order.id}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <CalendarTodayIcon sx={{ fontSize: "14px", color: "#888" }} />
                          <Typography sx={{ color: "#888", fontSize: "13px" }}>
                            {formatDate(order.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        icon={status.icon as React.ReactElement}
                        label={status.label}
                        size="small"
                        sx={{
                          backgroundColor: `${status.color}15`,
                          color: status.color,
                          fontWeight: "600",
                          fontSize: "12px",
                          "& .MuiChip-icon": { color: status.color },
                        }}
                      />
                    </Box>

                    <Divider sx={{ marginBottom: "16px" }} />

                    {/* Order Info */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "16px",
                      }}
                    >
                      <Box>
                        {order.items_count > 0 && (
                          <Typography sx={{ color: "#666", fontSize: "14px", marginBottom: "4px" }}>
                            {order.items_count} محصول
                          </Typography>
                        )}
                        {(order.shipping_city_name || order.shipping_state_name) && (
                          <Typography sx={{ color: "#888", fontSize: "13px" }}>
                            ارسال به: {order.shipping_city_name}{order.shipping_city_name && order.shipping_state_name && "، "}{order.shipping_state_name}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <Box sx={{ textAlign: "left" }}>
                          <Typography sx={{ color: "#888", fontSize: "12px" }}>مبلغ کل</Typography>
                          <Typography sx={{ color: "#333", fontWeight: "700", fontSize: "18px" }}>
                            {formatPrice(order.total)} <span style={{ fontSize: "12px", fontWeight: "400" }}>تومان</span>
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          startIcon={detailsLoading ? <CircularProgress size={16} color="inherit" /> : <VisibilityIcon />}
                          onClick={() => fetchOrderDetails(order.id)}
                          disabled={detailsLoading}
                          sx={{
                            borderColor: "#667eea",
                            color: "#667eea",
                            borderRadius: "12px",
                            fontSize: "13px",
                            "&:hover": {
                              borderColor: "#5a6fd6",
                              backgroundColor: "rgba(102, 126, 234, 0.08)",
                            },
                          }}
                        >
                          جزئیات
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Order Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
          }}
        >
          <Typography sx={{ fontWeight: "700", fontSize: "18px" }}>
            جزئیات سفارش #{selectedOrder?.id}
          </Typography>
          {selectedOrder && (
            <Chip
              label={statusConfig[selectedOrder.status]?.label || selectedOrder.status}
              size="small"
              sx={{
                backgroundColor: `${statusConfig[selectedOrder.status]?.color || "#666"}15`,
                color: statusConfig[selectedOrder.status]?.color || "#666",
                fontWeight: "600",
              }}
            />
          )}
        </DialogTitle>
        <DialogContent sx={{ padding: "24px" }}>
          {selectedOrder && (
            <>
              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <Box>
                  <Typography sx={{ fontWeight: "600", marginBottom: "16px", color: "#333" }}>
                    محصولات سفارش
                  </Typography>
                  {selectedOrder.items.map((item) => {
                    const itemPrice = typeof item.price === "string" ? parseFloat(item.price) : item.price;
                    const itemTotal = itemPrice * item.quantity;
                    return (
                      <Box
                        key={item.id}
                        sx={{
                          display: "flex",
                          gap: "12px",
                          padding: "12px",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "12px",
                          marginBottom: "12px",
                        }}
                      >
                        <Box
                          sx={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            position: "relative",
                            backgroundColor: "#fff",
                            flexShrink: 0,
                          }}
                        >
                          <Image
                            src={getProductImage(item)}
                            alt={item.product?.name || "محصول"}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: "500", fontSize: "14px", color: "#333", marginBottom: "4px" }}>
                            {item.product?.name || `محصول #${item.product_id}`}
                          </Typography>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography sx={{ color: "#888", fontSize: "13px" }}>
                              {item.quantity} عدد × {formatPrice(item.price)} تومان
                            </Typography>
                            <Typography sx={{ fontWeight: "600", color: "#333", fontSize: "14px" }}>
                              {formatPrice(itemTotal)} تومان
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Shipping Info */}
              <Box sx={{ marginTop: "16px", padding: "16px", backgroundColor: "#f0f4ff", borderRadius: "12px" }}>
                <Typography sx={{ fontWeight: "600", fontSize: "14px", color: "#667eea", marginBottom: "12px" }}>
                  اطلاعات ارسال
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Box sx={{ display: "flex", gap: "8px" }}>
                    <Typography sx={{ fontSize: "13px", color: "#666", minWidth: "60px" }}>گیرنده:</Typography>
                    <Typography sx={{ fontSize: "13px", color: "#333", fontWeight: "500" }}>
                      {getFullName(selectedOrder)}
                    </Typography>
                  </Box>
                  {selectedOrder.shipping_phone && (
                    <Box sx={{ display: "flex", gap: "8px" }}>
                      <Typography sx={{ fontSize: "13px", color: "#666", minWidth: "60px" }}>تلفن:</Typography>
                      <Typography sx={{ fontSize: "13px", color: "#333", direction: "ltr" }}>
                        {selectedOrder.shipping_phone}
                      </Typography>
                    </Box>
                  )}
                  {(selectedOrder.shipping_city_name || selectedOrder.shipping_state_name) && (
                    <Box sx={{ display: "flex", gap: "8px" }}>
                      <Typography sx={{ fontSize: "13px", color: "#666", minWidth: "60px" }}>شهر:</Typography>
                      <Typography sx={{ fontSize: "13px", color: "#333" }}>
                        {selectedOrder.shipping_city_name}{selectedOrder.shipping_city_name && selectedOrder.shipping_state_name && "، "}{selectedOrder.shipping_state_name}
                      </Typography>
                    </Box>
                  )}
                  {selectedOrder.shipping_address && (
                    <Box sx={{ display: "flex", gap: "8px" }}>
                      <Typography sx={{ fontSize: "13px", color: "#666", minWidth: "60px" }}>آدرس:</Typography>
                      <Typography sx={{ fontSize: "13px", color: "#333" }}>
                        {selectedOrder.shipping_address}
                      </Typography>
                    </Box>
                  )}
                  {selectedOrder.shipping_postal_code && (
                    <Box sx={{ display: "flex", gap: "8px" }}>
                      <Typography sx={{ fontSize: "13px", color: "#666", minWidth: "60px" }}>کد پستی:</Typography>
                      <Typography sx={{ fontSize: "13px", color: "#333", direction: "ltr" }}>
                        {selectedOrder.shipping_postal_code}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Total */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px",
                  marginTop: "16px",
                  backgroundColor: "#e8f5e9",
                  borderRadius: "12px",
                }}
              >
                <Typography sx={{ fontWeight: "600", color: "#333" }}>مبلغ کل</Typography>
                <Typography sx={{ fontWeight: "700", color: "#4caf50", fontSize: "20px" }}>
                  {formatPrice(selectedOrder.total)} تومان
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: "16px 24px", borderTop: "1px solid #f0f0f0" }}>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{
              color: "#666",
              borderRadius: "12px",
            }}
          >
            بستن
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

