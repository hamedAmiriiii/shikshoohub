"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  CircularProgress,
  Paper,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PaymentIcon from "@mui/icons-material/Payment";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
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

interface Customer {
  id: number;
  phone: string;
  name: string;
  last_name: string;
  address?: string | null;
  city_id?: number | null;
  state_id?: number | null;
  postal_code?: string | null;
}

interface Order {
  id: number;
  cart_id?: number;
  customer_id: number;
  status: string;
  payment_status?: string;
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
  customer?: Customer;
}

const statusColors: Record<string, string> = {
  pending: "#ff9800",
  processing: "#2196f3",
  shipped: "#9c27b0",
  delivered: "#4caf50",
  completed: "#4caf50",
  cancelled: "#f44336",
};

const statusLabels: Record<string, string> = {
  pending: "در انتظار",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل داده شده",
  completed: "تکمیل شده",
  cancelled: "لغو شده",
};

const paymentStatusColors: Record<string, string> = {
  paid: "#4caf50",
  unpaid: "#f44336",
  partial: "#ff9800",
};

const paymentStatusLabels: Record<string, string> = {
  paid: "پرداخت شده",
  unpaid: "پرداخت نشده",
  partial: "پرداخت جزئی",
};

const statusOptions = [
  { value: "shipped", label: "ارسال شده" },
  { value: "completed", label: "تکمیل شده" },
  { value: "cancelled", label: "لغو شده" },
];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("completed"); // پیش‌فرض: تکمیل شده

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("لطفاً ابتدا وارد شوید");
      router.push("/admin/login");
      return;
    }

    setLoading(true);
    try {
      // ساخت URL با فیلتر وضعیت
      let url = "/api/orders";
      if (statusFilter && statusFilter !== "all") {
        url += `?status=${statusFilter}`;
      }

      const res = await apiRequestError(
        "Get",
        {},
        {},
        url,
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
    const token = localStorage.getItem("token");
    if (!token) return;

    setDetailsLoading(true);
    try {
      const res = await apiRequestError(
        "Get",
        {},
        {},
        `/api/orders/${orderId}`,
        true,
        true,
        token
      );

      if (!res.hasError) {
        const orderData = res.data || res;
        console.log('Order Details Response:', res);
        console.log('Order Data:', orderData);
        console.log('Order Items:', orderData.items);
        if (orderData.items && orderData.items.length > 0) {
          console.log('First Item:', orderData.items[0]);
          console.log('First Item Size:', orderData.items[0].size);
          console.log('First Item Color:', orderData.items[0].color);
        }
        setSelectedOrder(orderData);
        setNewStatus(orderData.status);
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

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("لطفاً ابتدا وارد شوید");
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await apiRequestError(
        "Put",
        {},
        { status: newStatus },
        `/api/orders/${selectedOrder.cart_id || selectedOrder.id}/status`,
        true,
        true,
        token
      );

      if (!res.hasError) {
        toast.success("وضعیت سفارش با موفقیت تغییر کرد");
        // Update the order in the list and dialog
        const updatedOrder = { ...selectedOrder, status: newStatus };
        setSelectedOrder(updatedOrder);
        setOrders(orders.map(order => 
          (order.cart_id || order.id) === (selectedOrder.cart_id || selectedOrder.id)
            ? { ...order, status: newStatus }
            : order
        ));
      } else {
        const parsed = JSON.parse(res.errorText || "{}");
        toast.error(parsed.message || "خطا در تغییر وضعیت سفارش");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("خطا در تغییر وضعیت سفارش");
    } finally {
      setUpdatingStatus(false);
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

  const getCustomerName = (order: Order): string => {
    if (order.customer) {
      const parts = [order.customer.name, order.customer.last_name].filter(Boolean);
      return parts.length > 0 ? parts.join(" ") : order.customer.phone || "---";
    }
    const shippingParts = [order.shipping_name, order.shipping_last_name].filter(Boolean);
    return shippingParts.length > 0 ? shippingParts.join(" ") : "---";
  };

  const getCustomerPhone = (order: Order): string => {
    return order.customer?.phone || order.shipping_phone || "---";
  };

  const getProductName = (item: OrderItem): string => {
    return item.product?.name || `محصول #${item.product_id}`;
  };

  const getItemTotal = (item: OrderItem): number => {
    const price = typeof item.price === "string" ? parseFloat(item.price) : item.price;
    return price * item.quantity;
  };

  return (
    <Box
      sx={{
        width: "100%",
        direction: "rtl",
        padding: "16px",
        minHeight: "100vh",
        paddingBottom: "100px",
        background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)",
      }}
    >
      <ToastContainer rtl position="top-center" />

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          padding: "16px 20px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(102, 126, 234, 0.3)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Box
            sx={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingBagIcon sx={{ color: "#fff", fontSize: "24px" }} />
          </Box>
          <Box>
            <Typography
              sx={{ color: "#fff", fontWeight: "700", fontSize: "18px" }}
            >
              سفارشات
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>
              {orders.length} سفارش
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: "8px" }}>
          <IconButton
            onClick={fetchOrders}
            sx={{
              backgroundColor: "rgba(255,255,255,0.2)",
              color: "#fff",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" },
            }}
          >
            <RefreshIcon />
          </IconButton>
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
      </Box>

      {/* Status Filter */}
      <Box
        sx={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <Chip
          label="همه"
          onClick={() => setStatusFilter("all")}
          sx={{
            backgroundColor: statusFilter === "all" ? "#667eea" : "rgba(255,255,255,0.1)",
            color: "#fff",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: statusFilter === "all" ? "#5a6fd6" : "rgba(255,255,255,0.2)",
            },
            fontWeight: statusFilter === "all" ? "700" : "500",
          }}
        />
        <Chip
          label="ارسال شده"
          onClick={() => setStatusFilter("shipped")}
          sx={{
            backgroundColor: statusFilter === "shipped" ? "#9c27b0" : "rgba(255,255,255,0.1)",
            color: "#fff",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: statusFilter === "shipped" ? "#7b1fa2" : "rgba(255,255,255,0.2)",
            },
            fontWeight: statusFilter === "shipped" ? "700" : "500",
          }}
        />
        <Chip
          label="تکمیل شده"
          onClick={() => setStatusFilter("completed")}
          sx={{
            backgroundColor: statusFilter === "completed" ? "#4caf50" : "rgba(255,255,255,0.1)",
            color: "#fff",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: statusFilter === "completed" ? "#388e3c" : "rgba(255,255,255,0.2)",
            },
            fontWeight: statusFilter === "completed" ? "700" : "500",
          }}
        />
      </Box>

      {/* Orders List */}
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "300px",
          }}
        >
          <CircularProgress sx={{ color: "#667eea" }} />
        </Box>
      ) : orders.length === 0 ? (
        <Paper
          sx={{
            padding: "40px",
            textAlign: "center",
            borderRadius: "16px",
            backgroundColor: "rgba(255,255,255,0.05)",
          }}
        >
          <ShoppingBagIcon
            sx={{ fontSize: "60px", color: "#666", marginBottom: "16px" }}
          />
          <Typography sx={{ color: "#999", fontSize: "16px" }}>
            هیچ سفارشی یافت نشد
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {orders.map((order) => (
            <Grid item xs={12} sm={6} md={4} key={order.id}>
              <Card
                sx={{
                  borderRadius: "16px",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  },
                }}
              >
                <CardContent sx={{ padding: "20px" }}>
                  {/* Order Header */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "16px",
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: "16px",
                          marginBottom: "4px",
                        }}
                      >
                        سفارش #{order.cart_id || order.id}
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <CalendarTodayIcon
                          sx={{ fontSize: "14px", color: "#888" }}
                        />
                        <Typography sx={{ color: "#888", fontSize: "12px" }}>
                          {formatDate(order.created_at)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <Chip
                        label={statusLabels[order.status] || order.status}
                        size="small"
                        sx={{
                          backgroundColor:
                            statusColors[order.status] || "#666",
                          color: "#fff",
                          fontSize: "11px",
                          height: "24px",
                        }}
                      />
                      <Chip
                        label={
                          paymentStatusLabels[order.payment_status] ||
                          order.payment_status
                        }
                        size="small"
                        sx={{
                          backgroundColor:
                            paymentStatusColors[order.payment_status] || "#666",
                          color: "#fff",
                          fontSize: "11px",
                          height: "24px",
                        }}
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", marginBottom: "16px" }} />

                  {/* Customer Info */}
                  <Box sx={{ marginBottom: "16px" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <PersonIcon sx={{ fontSize: "18px", color: "#667eea" }} />
                      <Typography sx={{ color: "#fff", fontSize: "14px" }}>
                        {getCustomerName(order)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <PhoneIcon sx={{ fontSize: "18px", color: "#667eea" }} />
                      <Typography
                        sx={{ color: "#ccc", fontSize: "13px", direction: "ltr" }}
                      >
                        {getCustomerPhone(order)}
                      </Typography>
                    </Box>
                    {order.customer?.address && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <LocationOnIcon
                          sx={{ fontSize: "18px", color: "#667eea" }}
                        />
                        <Typography sx={{ color: "#ccc", fontSize: "13px" }}>
                          {order.customer.address}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", marginBottom: "16px" }} />

                  {/* Total & Actions */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography sx={{ color: "#888", fontSize: "12px" }}>
                        مبلغ کل
                      </Typography>
                      <Typography
                        sx={{
                          color: "#4caf50",
                          fontWeight: "700",
                          fontSize: "18px",
                        }}
                      >
                        {formatPrice(order.total)} تومان
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: "8px" }}>
                      <Button
                        variant="contained"
                        startIcon={
                          detailsLoading ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <VisibilityIcon />
                          )
                        }
                        onClick={() => fetchOrderDetails(order.cart_id || order.id)}
                        disabled={detailsLoading}
                        sx={{
                          backgroundColor: "#667eea",
                          color: "#fff",
                          borderRadius: "12px",
                          fontSize: "13px",
                          "&:hover": { backgroundColor: "#5a6fd6" },
                        }}
                      >
                        جزئیات
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Order Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setNewStatus("");
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            backgroundColor: "#1a1d2e",
            color: "#fff",
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
          }}
        >
          <Typography sx={{ fontWeight: "700", fontSize: "18px" }}>
            جزئیات سفارش #{selectedOrder?.cart_id || selectedOrder?.id}
          </Typography>
          {selectedOrder && (
            <Box sx={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Chip
                label={statusLabels[selectedOrder.status] || selectedOrder.status}
                size="small"
                sx={{
                  backgroundColor: statusColors[selectedOrder.status] || "#666",
                  color: "#fff",
                }}
              />
            </Box>
          )}
        </DialogTitle>
        <DialogContent sx={{ padding: "24px" }}>
          {selectedOrder && (
            <>
              {/* Customer Info */}
              <Paper
                sx={{
                  padding: "20px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  marginBottom: "16px",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px",
                    paddingBottom: "16px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Box
                    sx={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(102, 126, 234, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PersonIcon sx={{ color: "#667eea", fontSize: "24px" }} />
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: "700",
                      fontSize: "18px",
                      color: "#fff",
                    }}
                  >
                    اطلاعات مشتری
                  </Typography>
                </Box>
                
                <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Name and Phone Row */}
                  <Box sx={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    <Box sx={{ flex: "1", minWidth: "200px" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <PersonIcon sx={{ fontSize: "16px", color: "#888" }} />
                        <Typography sx={{ color: "#888", fontSize: "12px", fontWeight: "500" }}>
                          نام و نام خانوادگی
                        </Typography>
                      </Box>
                      <Typography sx={{ color: "#fff", fontSize: "15px", fontWeight: "500" }}>
                        {getCustomerName(selectedOrder)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: "1", minWidth: "200px" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <PhoneIcon sx={{ fontSize: "16px", color: "#888" }} />
                        <Typography sx={{ color: "#888", fontSize: "12px", fontWeight: "500" }}>
                          شماره تماس
                        </Typography>
                      </Box>
                      <Typography
                        sx={{ color: "#fff", fontSize: "15px", fontWeight: "500", direction: "ltr" }}
                      >
                        {getCustomerPhone(selectedOrder)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Address */}
                  {selectedOrder.customer?.address && (
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <LocationOnIcon sx={{ fontSize: "16px", color: "#888" }} />
                        <Typography sx={{ color: "#888", fontSize: "12px", fontWeight: "500" }}>
                          آدرس
                        </Typography>
                      </Box>
                      <Typography sx={{ color: "#fff", fontSize: "15px", lineHeight: 1.6 }}>
                        {selectedOrder.customer.address}
                      </Typography>
                    </Box>
                  )}

                  {/* Postal Code and Location */}
                  {(selectedOrder.customer?.postal_code || selectedOrder.customer?.state_id || selectedOrder.customer?.city_id) && (
                    <Box sx={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      {selectedOrder.customer?.postal_code && (
                        <Box sx={{ flex: "1", minWidth: "150px" }}>
                          <Typography sx={{ color: "#888", fontSize: "12px", fontWeight: "500", marginBottom: "6px" }}>
                            کد پستی
                          </Typography>
                          <Typography sx={{ color: "#fff", fontSize: "15px", direction: "ltr" }}>
                            {selectedOrder.customer.postal_code}
                          </Typography>
                        </Box>
                      )}
                      {(selectedOrder.customer?.state_id || selectedOrder.customer?.city_id) && (
                        <Box sx={{ flex: "1", minWidth: "150px" }}>
                          <Typography sx={{ color: "#888", fontSize: "12px", fontWeight: "500", marginBottom: "6px" }}>
                            استان / شهر
                          </Typography>
                          <Typography sx={{ color: "#fff", fontSize: "15px" }}>
                            {selectedOrder.customer.state_id ? `استان ${selectedOrder.customer.state_id}` : ""}
                            {selectedOrder.customer.state_id && selectedOrder.customer.city_id ? " - " : ""}
                            {selectedOrder.customer.city_id ? `شهر ${selectedOrder.customer.city_id}` : ""}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <Paper
                  sx={{
                    borderRadius: "12px",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    overflow: "hidden",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "600",
                      padding: "16px",
                      color: "#667eea",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    محصولات
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: "#888", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                            محصول
                          </TableCell>
                          <TableCell sx={{ color: "#888", borderBottom: "1px solid rgba(255,255,255,0.1)" }} align="center">
                            تعداد
                          </TableCell>
                          <TableCell sx={{ color: "#888", borderBottom: "1px solid rgba(255,255,255,0.1)" }} align="center">
                            قیمت واحد
                          </TableCell>
                          <TableCell sx={{ color: "#888", borderBottom: "1px solid rgba(255,255,255,0.1)" }} align="left">
                            جمع
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell sx={{ color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              <Box>
                                <Typography sx={{ color: "#fff", fontSize: "14px" }}>
                                  {getProductName(item)}
                                </Typography>
                                {(item.size || item.color) && (
                                  <Box sx={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                                    {item.size && (
                                      <Chip
                                        label={`سایز: ${item.size}`}
                                        size="small"
                                        sx={{
                                          backgroundColor: "rgba(168, 85, 247, 0.2)",
                                          color: "#c084fc",
                                          fontSize: "10px",
                                          height: "20px",
                                        }}
                                      />
                                    )}
                                    {item.color && (
                                      <Chip
                                        label={`رنگ: ${item.color}`}
                                        size="small"
                                        sx={{
                                          backgroundColor: "rgba(239, 68, 68, 0.2)",
                                          color: "#fca5a5",
                                          fontSize: "10px",
                                          height: "20px",
                                        }}
                                      />
                                    )}
                                  </Box>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.05)" }} align="center">
                              {item.quantity}
                            </TableCell>
                            <TableCell sx={{ color: "#ccc", borderBottom: "1px solid rgba(255,255,255,0.05)" }} align="center">
                              {formatPrice(item.price)} تومان
                            </TableCell>
                            <TableCell sx={{ color: "#4caf50", fontWeight: "600", borderBottom: "1px solid rgba(255,255,255,0.05)" }} align="left">
                              {formatPrice(getItemTotal(item))} تومان
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* Total */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px",
                  marginTop: "16px",
                  backgroundColor: "rgba(76, 175, 80, 0.1)",
                  borderRadius: "12px",
                  border: "1px solid rgba(76, 175, 80, 0.3)",
                }}
              >
                <Typography sx={{ color: "#fff", fontWeight: "600" }}>
                  مبلغ کل سفارش
                </Typography>
                <Typography
                  sx={{ color: "#4caf50", fontWeight: "700", fontSize: "20px" }}
                >
                  {formatPrice(selectedOrder.total)} تومان
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions
          sx={{ 
            padding: "20px 24px", 
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {/* Status Change Section */}
          {selectedOrder && (
            <Box sx={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: "180px",
                  "& .MuiOutlinedInput-root": {
                    color: "#fff",
                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255,255,255,0.3)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#ff9800",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(255,255,255,0.7)",
                    "&.Mui-focused": {
                      color: "#ff9800",
                    },
                  },
                  "& .MuiSvgIcon-root": {
                    color: "#fff",
                  },
                }}
              >
                <InputLabel>تغییر وضعیت</InputLabel>
                <Select
                  value={newStatus || selectedOrder.status}
                  label="تغییر وضعیت"
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Box
                          sx={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            backgroundColor: statusColors[option.value],
                          }}
                        />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                onClick={handleUpdateStatus}
                disabled={updatingStatus || (newStatus || selectedOrder.status) === selectedOrder.status}
                variant="contained"
                sx={{
                  backgroundColor: "#ff9800",
                  color: "#fff",
                  borderRadius: "12px",
                  padding: "8px 20px",
                  "&:hover": { backgroundColor: "#f57c00" },
                  "&:disabled": { 
                    backgroundColor: "rgba(255, 152, 0, 0.3)", 
                    color: "rgba(255,255,255,0.5)" 
                  },
                }}
              >
                {updatingStatus ? <CircularProgress size={20} color="inherit" /> : "ذخیره تغییرات"}
              </Button>
            </Box>
          )}
          <Button
            onClick={() => {
              setDialogOpen(false);
              setNewStatus("");
            }}
            sx={{
              color: "#fff",
              borderRadius: "12px",
              padding: "8px 20px",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
            }}
          >
            بستن
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

