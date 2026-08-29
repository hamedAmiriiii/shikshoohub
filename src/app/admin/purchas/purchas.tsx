
"use client";
import {
  Avatar,
  Box,
  Button,
  Card,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  CircularProgress,
} from "@mui/material";
import ReplayIcon from '@mui/icons-material/Replay';
import InstallmentIcon from '@mui/icons-material/AccountBalance';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PaymentIcon from '@mui/icons-material/Payment';
import React, { useEffect, useState } from "react";
import LabelCustom from "@/app/coponent/labelCustom";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { Chip, Divider, TextField } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import {
  formatProductQuantity,
  getMinQuantity,
  getUnitLabel,
  getPriceUnitLabel,
  isKgProduct,
  parseQuantityInput,
} from "@/app/lib/productUnits";
import { paymentTypeLabel } from "@/app/lib/paymentTypes";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import {
  isIranMobile,
  normalizeIranMobile,
  purchaseReturnCreditMessage,
  returnFullPurchase,
  returnPurchaseItem,
} from "@/app/lib/purchaseReturns";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const formatNumber = (num: number | string) => {
  const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(numValue)) return '';
  return new Intl.NumberFormat('fa-IR').format(numValue);
};

function PurchaseInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "",
        alignItems: "center",
        gap: 1,
        width: "100%",
        pb: 1.5,
        minWidth: 0,
      }}
    >
      <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)", flexShrink: 0 }}>
        {label}:
      </Typography>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--admin-text)",
          textAlign: "left",
          direction: "ltr",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'نامشخص';
  try {
    // اگر تاریخ به صورت ISO است (مثل 2026-02-12T09:09:47.000000Z)
    if (dateString.includes('T')) {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    }
    // اگر تاریخ به صورت رشته است (مثل 1404-11-23)
    return dateString.split(' ')[0]; // فقط بخش تاریخ را برمی‌گرداند
  } catch (error) {
    return dateString;
  }
};

const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return 'نامشخص';
  try {
    // اگر تاریخ به صورت ISO است
    if (dateString.includes('T')) {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}/${month}/${day} ${hours}:${minutes}`;
    }
    return dateString;
  } catch (error) {
    return dateString;
  }
};

export default function purchas(props: any) {

  const [openSnackbar, setOpenSnackbar] = useState("");
  const [load, setLoad] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [returnMode, setReturnMode] = useState<"item" | "full">("item");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnPhone, setReturnPhone] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [adjustedQuantities, setAdjustedQuantities] = useState<Record<number, number>>({});
  const [deleting, setDeleting] = useState(false);
  const [totalDeleting, setTotalDeleting] = useState(0);
  const [deletedItems, setDeletedItems] = useState<number[]>([]);
  const [installmentsDialogOpen, setInstallmentsDialogOpen] = useState(false);
  const [payInstallmentDialogOpen, setPayInstallmentDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [installmentNotes, setInstallmentNotes] = useState("");
  const [payingInstallment, setPayingInstallment] = useState(false);
  const [installmentsData, setInstallmentsData] = useState<any[]>([]);
  const router = useRouter();
  const data = props?.props?.data;
  const onRefresh = props?.props?.onRefresh || props?.props?.refreshGrid;
  const isDetailsView = props?.props?.variant === "details";
  const isInstallment = data?.payment_type === 'installment';
  const isCheque = data?.payment_type === 'cheque';

  const purchasePhone = typeof data?.phone === "string" ? normalizeIranMobile(data.phone) : "";
  const needsReturnPhone = !isIranMobile(purchasePhone);

  const handleOpenDeleteDialog = (item: any) => {
    setReturnMode("item");
    setSelectedItem(item);
    const isKg = isKgProduct(item.product ?? item);
    setReturnQuantity(isKg ? 0.5 : 1);
    setReturnPhone(purchasePhone);
    setReturnNotes("");
    setDeleteDialogOpen(true);
  };

  const handleOpenFullReturn = () => {
    setReturnMode("full");
    setSelectedItem(null);
    setReturnPhone(purchasePhone);
    setReturnNotes("");
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedItem(null);
    setReturnQuantity(1);
    setReturnNotes("");
    setDeleting(false);
  };

  const resolveReturnPhone = (): string | null => {
    const phone = normalizeIranMobile(returnPhone || purchasePhone);
    if (!isIranMobile(phone)) {
      toast.error("برای برگشت باید شماره موبایل مشتری را وارد کنید تا اعتبار به همان فرد برگردد");
      return null;
    }
    return phone;
  };

  const getItemQuantity = (item: any) => {
    const qty = adjustedQuantities[item.id] ?? item.quantity;
    const productRef = item.product ?? item;
    const min = getMinQuantity(productRef);
    return Math.max(min, Number(qty) || min);
  };

  const isSelectedKg = selectedItem
    ? isKgProduct(selectedItem.product ?? selectedItem)
    : false;

  const handleOpenPayInstallmentDialog = (installment: any) => {
    setSelectedInstallment(installment);
    setInstallmentNotes("");
    setPayInstallmentDialogOpen(true);
  };

  const handleClosePayInstallmentDialog = () => {
    setPayInstallmentDialogOpen(false);
    setSelectedInstallment(null);
    setInstallmentNotes("");
  };

  const handlePayInstallment = async () => {
    if (!selectedInstallment || !data?.id) return;
    
    setPayingInstallment(true);
    try {
      const response = await FetchWithJwtClient(
        "POST",
        `/api/purchased-products/${data.id}/installments/${selectedInstallment.id}/pay`,
        {
          notes: installmentNotes || null
        }
      );
      
      if (response !== null && response.installment) {
        // استفاده از داده‌های برگشتی از API (شامل due_date_jalali و paid_at_jalali)
        const updatedInstallment = response.installment;
        
        // به‌روزرسانی installmentsData
        const currentInstallments = installmentsData.length > 0 ? installmentsData : (data?.installments || []);
        const updatedInstallments = currentInstallments.map((inst: any) => 
          inst.id === selectedInstallment.id 
            ? updatedInstallment // شامل فیلدهای شمسی از API
            : inst
        );
        setInstallmentsData(updatedInstallments);
        
        // به‌روزرسانی data.installments هم
        if (data.installments && Array.isArray(data.installments)) {
          data.installments = updatedInstallments;
        }
        
        handleClosePayInstallmentDialog();
        
        // Refresh the list if callback provided
        if (onRefresh) {
          onRefresh();
        }
      } else {
        alert("خطا در پرداخت قسط");
      }
    } catch (error) {
      console.error("Error paying installment:", error);
      alert("خطا در پرداخت قسط");
    } finally {
      setPayingInstallment(false);
    }
  };

  
  const handleDeleteItem = async () => {
    if (!selectedItem || !data?.id) return;

    const phone = resolveReturnPhone();
    if (!phone) return;

    const maxQty = getItemQuantity(selectedItem);
    const minQty = getMinQuantity(selectedItem.product ?? selectedItem);
    const qtyToReturn = Math.min(
      Math.max(minQty, Number(returnQuantity) || minQty),
      maxQty,
    );

    setDeleting(true);
    try {
      const payload: { quantity: number; phone: string; notes?: string } = {
        quantity: qtyToReturn,
        phone,
      };
      if (returnNotes.trim()) payload.notes = returnNotes.trim();

      const response = await returnPurchaseItem(data.id, selectedItem.id, payload);

      if (response !== null && !response.hasError) {
        const returnedQty = Number(response?.returned_item?.quantity ?? qtyToReturn);
        const unitPrice = parseFloat(
          response?.returned_item?.sale_price ?? selectedItem.sale_price ?? selectedItem.product?.sale_price ?? "0"
        );
        const returnAmount = Number(response?.returned_item?.return_amount ?? unitPrice * returnedQty);
        setTotalDeleting((prev) => prev + returnAmount);

        const remainingQty = maxQty - returnedQty;
        if (remainingQty <= 0) {
          setDeletedItems((prev) => [...prev, selectedItem.id]);
          setAdjustedQuantities((prev) => {
            const next = { ...prev };
            delete next[selectedItem.id];
            return next;
          });
        } else if (!onRefresh) {
          setAdjustedQuantities((prev) => ({
            ...prev,
            [selectedItem.id]: remainingQty,
          }));
        }

        const creditMsg = purchaseReturnCreditMessage(response);
        toast.success(creditMsg || (returnedQty === 1 ? "برگشت کالا ثبت شد" : "برگشت کالا ثبت شد"));
        setReturnPhone(phone);

        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.error(getApiErrorMessage(response, "خطا در برگشت کالا"));
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("خطا در برگشت کالا");
    } finally {
      setDeleting(false);
    }
  };

  const handleFullReturn = async () => {
    if (!data?.id) return;
    const phone = resolveReturnPhone();
    if (!phone) return;

    setDeleting(true);
    try {
      const payload: { phone: string; notes?: string } = { phone };
      if (returnNotes.trim()) payload.notes = returnNotes.trim();
      const response = await returnFullPurchase(data.id, payload);
      if (!response || response.hasError) {
        toast.error(getApiErrorMessage(response, "خطا در برگشت کامل فاکتور"));
        return;
      }

      const items = Array.isArray(data.purchased_products) ? data.purchased_products : [];
      setDeletedItems(items.map((item: any) => item.id).filter(Boolean));
      const returnedTotal = Number(
        response?.return_amount ?? response?.return_sale_total ?? data?.total_amount ?? 0,
      );
      if (returnedTotal > 0) setTotalDeleting(returnedTotal);
      setReturnPhone(phone);

      const creditMsg = purchaseReturnCreditMessage(response);
      toast.success(creditMsg || "فاکتور به‌طور کامل برگشت خورد و مبلغ به اعتبار مشتری اضافه شد");
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error returning purchase:", error);
      toast.error("خطا در برگشت کامل فاکتور");
    } finally {
      setDeleting(false);
    }
  };

  const goToNewPurchase = () => {
    const params = new URLSearchParams();
    if (totalDeleting) params.set("price", String(totalDeleting));
    const phone = normalizeIranMobile(returnPhone || purchasePhone);
    if (isIranMobile(phone)) params.set("phone", phone);
    router.push(`/admin?${params.toString()}`);
  };

  useEffect(() => {
    // ساختار جدید: created_at ممکن است در سطح اصلی باشد یا نباشد
    const datetime = data?.created_at || data?.createdAt || "";
    if (datetime) {
      const [datePart, timePart] = datetime?.split(" ") || [];
      setDate(datePart || "")
      setTime(timePart || "")
    }
    
    // به‌روزرسانی installmentsData از data.installments
    if (data?.installments && Array.isArray(data.installments)) {
      setInstallmentsData(data.installments);
    }
    
    setLoad(true)
   
  }, [data])

 
  return load ? (
    <Box
      sx={{
        backgroundColor: "var(--admin-surface)",
        borderRadius: isDetailsView ? 0 : "15px",
        border: isDetailsView ? "none" : "1px solid rgb(55, 84, 165)",
        m: isDetailsView ? 0 : 1,
        p: isDetailsView ? 0 : 1,
      }}
    >
      <Grid
        xs={12} style={{backgroundColor:"#1f9ad1" ,
          display:"flex" , justifyContent:"space-between" , alignItems:"center"
          }}
        className={`p-1 rounded-xl flex  items-center `}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isInstallment && (
            <Chip
              icon={<InstallmentIcon />}
              label="اقساطی"
              size="small"
              sx={{
                backgroundColor: "#ff9800",
                color: "var(--admin-text)",
                fontWeight: "600",
                fontSize: "11px",
                height: "24px",
                "& .MuiChip-icon": {
                  color: "var(--admin-text)",
                  fontSize: "16px"
                }
              }}
            />
          )}
          {isCheque && (
            <Chip
              icon={<ReceiptLongIcon />}
              label={data?.payment_type_label || "چکی"}
              size="small"
              sx={{
                backgroundColor: data?.is_cheque_settled ? "var(--admin-accent)" : "#2196f3",
                color: "var(--admin-text)",
                fontWeight: "600",
                fontSize: "11px",
                height: "24px",
                "& .MuiChip-icon": {
                  color: "var(--admin-text)",
                  fontSize: "16px"
                }
              }}
            />
          )}
          <span className="  rounded-xl aligan-center">
            {date || "تاریخ نامشخص"}
          </span>
        </Box>
        <span className="  rounded-xl aligan-center">
          {time || "زمان نامشخص"}
        </span>
      </Grid>
      
      <Grid container className="mt-2">
        <Grid xs={12}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: { xs: 0.5, md: 1 },
              columnGap: { md: 3 },
              alignItems: "start",
            }}
          >
            {data?.total_amount !== undefined && (
              <PurchaseInfoRow label="مجموع مبلغ" value={`${formatNumber(data.total_amount)} تومان`} />
            )}
            {data?.phone && <PurchaseInfoRow label="شماره تلفن" value={data.phone} />}

            {(data?.payment_type_label || data?.payment_type) && (
              <PurchaseInfoRow
                label="نوع پرداخت"
                value={data.payment_type_label || paymentTypeLabel(data.payment_type)}
              />
            )}

            {isCheque && data?.cheque && (
              <>
                <PurchaseInfoRow
                  label="شماره چک"
                  value={data.cheque.cheque_number || "—"}
                />
                {data.cheque.bank_name ? (
                  <PurchaseInfoRow label="بانک" value={data.cheque.bank_name} />
                ) : null}
                {data.cheque.payee ? (
                  <PurchaseInfoRow label="پرداخت‌کننده" value={data.cheque.payee} />
                ) : null}
                {(data.cheque.due_date_jalali || data.cheque.due_date) ? (
                  <PurchaseInfoRow
                    label="سررسید چک"
                    value={data.cheque.due_date_jalali || data.cheque.due_date}
                  />
                ) : null}
              </>
            )}

            {isCheque && (
              <PurchaseInfoRow
                label="وضعیت وصول"
                value={
                  data?.is_cheque_settled
                    ? "وصول‌شده"
                    : `در انتظار وصول${data?.outstanding_cheque_amount ? ` — ${formatNumber(data.outstanding_cheque_amount)} تومان` : ""}`
                }
              />
            )}

            

            {data?.cash_amount != null && Number(data.cash_amount) > 0 && (
              <PurchaseInfoRow label="پرداخت نقد" value={`${formatNumber(data.cash_amount)} تومان`} />
            )}

            {data?.card_amount != null && Number(data.card_amount) > 0 && (
              <PurchaseInfoRow label="پرداخت کارت" value={`${formatNumber(data.card_amount)} تومان`} />
            )}

            {data?.credit_used !== undefined && data.credit_used > 0 && (
              <PurchaseInfoRow label="اعتبار استفاده شده" value={`${formatNumber(data.credit_used)} تومان`} />
            )}

            {data?.credit_earned !== undefined && data.credit_earned > 0 && (
              <PurchaseInfoRow label="اعتبار کسب شده" value={`${formatNumber(data.credit_earned)} تومان`} />
            )}

            {isInstallment && data?.installment_count && (
              <PurchaseInfoRow label="تعداد اقساط" value={`${data.installment_count} قسط`} />
            )}

            {isInstallment && data?.installment_amount && (
              <PurchaseInfoRow label="مبلغ هر قسط" value={`${formatNumber(data.installment_amount)} تومان`} />
            )}

            {isInstallment && data?.installment_amount && (
              <PurchaseInfoRow label="مبلغ پرداخت شده" value={`${formatNumber(data.paid_amount)} تومان`} />
            )}
          </Box>
          
          {/* نمایش لیست محصولات */}
          {data?.purchased_products && Array.isArray(data.purchased_products) && data.purchased_products.length > 0 && (
            <Box className="mt-2">
              {!isInstallment && data.purchased_products.some((item: any) => !deletedItems.includes(item.id)) ? (
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ReplayIcon />}
                    onClick={handleOpenFullReturn}
                    sx={{
                      color: "#ff8a80",
                      borderColor: "#ff5252",
                      fontSize: 12,
                      "&:hover": { borderColor: "#ff1744", backgroundColor: "rgba(255, 82, 82, 0.08)" },
                    }}
                  >
                    برگشت کامل فاکتور
                  </Button>
                </Box>
              ) : null}
              
              {data.purchased_products
                .filter((item: any) => !deletedItems.includes(item.id))
                .map((item: any, index: number) => (
                <Box key={item.id || index} sx={{ 
                  backgroundColor: "var(--admin-surface-alt)", 
                  borderRadius: "8px", 
                  padding: "8px", 
                  marginBottom: "8px" ,
                  border:"1px solid rgb(212, 87, 37)"
                }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    
                      <LabelCustom 
                        title={"کالا"} 
                        name="" 
                        text={`${item?.item_name} — ${formatProductQuantity(getItemQuantity(item), item.product ?? item)} ${getUnitLabel(item.product ?? item)}`}
                      />
                      <LabelCustom 
                        title={"قیمت "} 
                        name="" 
                        text={
                          item?.product?.has_discount 
                            ? `${formatNumber(item?.sale_price || 0)} تومان (${getPriceUnitLabel(item.product ?? item)} · تخفیف: ${formatNumber(item.product.discount_percent || 0)}%)`
                            : `${formatNumber(item?.sale_price || 0)} تومان (${getPriceUnitLabel(item.product ?? item)})`
                        } 
                      />
                   
                    {/* دکمه برگشت فقط برای خریدهای غیراقساطی */}
                    {!isInstallment && (
                      <IconButton
                        onClick={() => handleOpenDeleteDialog(item)}
                        sx={{
                          backgroundColor: "#ff5252",
                          color: "var(--admin-text)",
                          padding: "6px",
                          marginRight: "4px",
                          "&:hover": {
                            backgroundColor: "#ff1744",
                          }
                        }}
                        size="small"
                        title="برگشت از خرید"
                      >
                        <ReplayIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
          
          {/* سازگاری با ساختار قدیمی */}
          {!data?.purchased_products && data?.product && (
            <>
              <LabelCustom title={"کالا"} name="" text={data.product?.name + " --- " + data.product?.id} />
              <LabelCustom 
                title={"قیمت "} 
                name="" 
                text={
                  data.product?.has_discount 
                    ? `${formatNumber(data.product.sale_price || 0)} تومان (تخفیف: ${formatNumber(data.product.discount_percent || 0)}%)`
                    : formatNumber(data.product?.sale_price || 0) + " تومان"
                } 
              />
            </>
          )}
        </Grid>
      </Grid>

      {/* دکمه مشاهده جزئیات اقساط */}
      {isInstallment && (
        <Box sx={{ marginTop: "12px", display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            startIcon={<VisibilityIcon />}
            onClick={() => {
              setInstallmentsDialogOpen(true);
            }}
            sx={{
              backgroundColor: "#ff9800",
              color: "var(--admin-text)",
              "&:hover": {
                backgroundColor: "#f57c00",
              },
              fontSize: "13px",
              padding: "8px 16px"
            }}
          >
            مشاهده جزئیات اقساط
          </Button>
        </Box>
      )}

      {/* Dialog تایید حذف */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            backgroundColor: "var(--admin-surface)",
            borderRadius: "16px",
            direction: "rtl",
            minWidth: "300px",
          }
        }}
      >
        <DialogTitle sx={{ color: "var(--admin-text)", textAlign: "center", fontSize: "18px" }}>
          {returnMode === "full" ? "برگشت کامل فاکتور" : "تایید برگشت کالا"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "var(--admin-text-secondary)", textAlign: "center" }}>
            {returnMode === "full"
              ? "تمام کالاهای این فاکتور برگشت می‌خورد. مبلغ فروش به اعتبار مشتری اضافه می‌شود و اگر از اعتبار این خرید استفاده شده باشد، به نسبت از اعتبار کم می‌شود."
              : "آیا از برگشت این کالا مطمئن هستید؟ مبلغ به اعتبار مشتری برمی‌گردد."}
          </DialogContentText>
            {returnMode === "item" && selectedItem && (
              <Box sx={{ 
                marginTop: "12px", 
                padding: "8px", 
                backgroundColor: "var(--admin-surface-alt)", 
                borderRadius: "8px",
                color: "var(--admin-text)"
              }}>
                <Typography variant="body2" sx={{ marginBottom: "12px" }}>
                  {selectedItem.product?.name} — {formatProductQuantity(getItemQuantity(selectedItem), selectedItem.product ?? selectedItem)}{" "}
                  {getUnitLabel(selectedItem.product ?? selectedItem)} در خرید
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  label={`مقدار برگشت (${getUnitLabel(selectedItem.product ?? selectedItem)})`}
                  value={returnQuantity}
                  onChange={(e) => {
                    const productRef = selectedItem.product ?? selectedItem;
                    if (isKgProduct(productRef)) {
                      const parsed = parseQuantityInput(e.target.value, productRef);
                      if (parsed !== null) {
                        setReturnQuantity(Math.min(Math.max(getMinQuantity(productRef), parsed), getItemQuantity(selectedItem)));
                      } else if (e.target.value === "") {
                        setReturnQuantity(getMinQuantity(productRef));
                      }
                      return;
                    }
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      setReturnQuantity(Math.min(Math.max(1, val), getItemQuantity(selectedItem)));
                    } else if (e.target.value === "") {
                      setReturnQuantity(1);
                    }
                  }}
                  inputProps={{
                    min: getMinQuantity(selectedItem.product ?? selectedItem),
                    max: getItemQuantity(selectedItem),
                    step: isSelectedKg ? 0.001 : 1,
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "var(--admin-surface)",
                      color: "var(--admin-text)",
                      "& fieldset": { borderColor: "#505669" },
                      "&:hover fieldset": { borderColor: "var(--admin-accent)" },
                      "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
                    },
                    "& .MuiInputLabel-root": { color: "var(--admin-text-secondary)" },
                    "& .MuiInputBase-input": { color: "var(--admin-text)" },
                  }}
                />
                <Typography variant="caption" sx={{ display: "block", marginTop: "8px", color: "var(--admin-text-secondary)" }}>
                  مبلغ برگشتی تقریبی: {formatNumber(
                    returnQuantity * parseFloat(selectedItem.sale_price ?? selectedItem.product?.sale_price ?? "0")
                  )} تومان
                </Typography>
              </Box>
            )}
            <TextField
              fullWidth
              required={needsReturnPhone}
              label={needsReturnPhone ? "شماره موبایل مشتری (الزامی)" : "شماره موبایل مشتری"}
              value={returnPhone}
              onChange={(e) => setReturnPhone(normalizeIranMobile(e.target.value))}
              placeholder="09xxxxxxxxx"
              helperText={
                needsReturnPhone
                  ? "این فاکتور مشتری ندارد. با این شماره کاربر باشگاه پیدا یا ساخته می‌شود و اعتبار به همان فرد برمی‌گردد."
                  : "مبلغ برگشتی به اعتبار همین شماره اضافه می‌شود."
              }
              sx={{
                mt: 1.5,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "var(--admin-surface-alt)",
                  color: "var(--admin-text)",
                  "& fieldset": { borderColor: "#505669" },
                  "&:hover fieldset": { borderColor: "var(--admin-accent)" },
                  "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
                },
                "& .MuiInputLabel-root": { color: "var(--admin-text-secondary)" },
                "& .MuiFormHelperText-root": { color: "var(--admin-text-muted)", textAlign: "right" },
              }}
            />
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="یادداشت (اختیاری)"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              sx={{
                mt: 1.5,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "var(--admin-surface-alt)",
                  color: "var(--admin-text)",
                  "& fieldset": { borderColor: "#505669" },
                  "&:hover fieldset": { borderColor: "var(--admin-accent)" },
                  "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
                },
                "& .MuiInputLabel-root": { color: "var(--admin-text-secondary)" },
              }}
            />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", padding: "16px", gap: "12px" }}>
          <Button 
            onClick={handleCloseDeleteDialog}
            variant="outlined"
            sx={{ 
              color: "var(--admin-text)", 
              borderColor: "#666",
              "&:hover": {
                borderColor: "#888",
                backgroundColor: "var(--admin-surface-alt)"
              }
            }}
            // disabled={deleting}
          >
            انصراف
          </Button>
          <Button 
            onClick={returnMode === "full" ? handleFullReturn : handleDeleteItem}
            variant="contained"
            sx={{ 
              backgroundColor: "#ff5252",
              "&:hover": {
                backgroundColor: "#ff1744"
              }
            }}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <ReplayIcon />}
          >
            {deleting ? "در حال ثبت..." : returnMode === "full" ? "برگشت کامل فاکتور" : "برگشت کالا"}
          </Button>
          <Button 
            onClick={goToNewPurchase}
            variant="contained"
            sx={{ 
              backgroundColor: "var(--admin-accent)",
              "&:hover": {
                backgroundColor: "var(--admin-accent-hover)"
              }
            }}
            disabled={!totalDeleting}
          >
            ثبت خرید جدید
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog جزئیات اقساط */}
      <Dialog
        open={installmentsDialogOpen}
        onClose={() => setInstallmentsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "var(--admin-surface)",
            borderRadius: "16px",
            direction: "rtl",
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
            جزئیات اقساط خرید #{data?.id}
          </Typography>
          <IconButton
            onClick={() => setInstallmentsDialogOpen(false)}
            sx={{ color: "var(--admin-text)" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ padding: "24px", maxHeight: "70vh", overflowY: "auto" }}>
          {(!installmentsData || installmentsData.length === 0) && (!data?.installments || !Array.isArray(data.installments) || data.installments.length === 0) ? (
            <Typography sx={{ color: "var(--admin-text-secondary)", textAlign: "center", padding: "40px" }}>
              هیچ قسطی یافت نشد
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* خلاصه اطلاعات */}
              {(() => {
                const installments = installmentsData.length > 0 ? installmentsData : (data?.installments || []);
                return (
                  <>
                    <Box sx={{ 
                      backgroundColor: "var(--admin-surface-alt)", 
                      borderRadius: "8px", 
                      padding: "16px",
                      marginBottom: "16px"
                    }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px" }}>تعداد کل اقساط:</Typography>
                        <Typography sx={{ color: "var(--admin-text)", fontSize: "14px", fontWeight: "600" }}>
                          {installments.length} قسط
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px" }}>قسط‌های پرداخت شده:</Typography>
                        <Typography sx={{ color: "var(--admin-accent)", fontSize: "14px", fontWeight: "600" }}>
                          {installments.filter((inst: any) => inst.is_paid).length} قسط
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px" }}>قسط‌های باقیمانده:</Typography>
                        <Typography sx={{ color: "#ff9800", fontSize: "14px", fontWeight: "600" }}>
                          {installments.filter((inst: any) => !inst.is_paid).length} قسط
                        </Typography>
                      </Box>
                      <Divider sx={{ borderColor: "#505669", marginY: "8px" }} />
                      <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px" }}>مبلغ کل پرداخت شده:</Typography>
                        <Typography sx={{ color: "var(--admin-accent)", fontSize: "15px", fontWeight: "700" }}>
                          {formatNumber(
                            installments
                              .filter((inst: any) => inst.is_paid)
                              .reduce((sum: number, inst: any) => sum + parseFloat(inst.amount || 0), 0)
                          )} تومان
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px" }}>مبلغ باقیمانده:</Typography>
                        <Typography sx={{ color: "#ff9800", fontSize: "15px", fontWeight: "700" }}>
                          {formatNumber(
                            installments
                              .filter((inst: any) => !inst.is_paid)
                              .reduce((sum: number, inst: any) => sum + parseFloat(inst.amount || 0), 0)
                          )} تومان
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ borderColor: "#505669", marginY: "8px" }} />

                    {/* لیست اقساط */}
                    {installments.map((installment: any, index: number) => (
                <Box
                  key={installment.id || index}
                  sx={{
                    backgroundColor: installment.is_paid ? "#1a3a1a" : "var(--admin-surface-alt)",
                    borderRadius: "8px",
                    padding: "16px",
                    border: `1px solid ${installment.is_paid ? "var(--admin-accent)" : "#505669"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <Typography sx={{ 
                        color: "var(--admin-text)", 
                        fontSize: "16px", 
                        fontWeight: "600" 
                      }}>
                        قسط {installment.installment_number}
                      </Typography>
                      {installment.is_paid ? (
                        <Chip
                          // icon={<CheckCircleIcon />}
                          label="پرداخت شده"
                          size="small"
                          sx={{
                            backgroundColor: "var(--admin-accent)",
                            color: "var(--admin-text)",
                            fontSize: "11px",
                            height: "22px"
                          }}
                        />
                      ) : (
                        <Chip
                          // icon={<CancelIcon />}
                          label="پرداخت نشده"
                          size="small"
                          sx={{
                            backgroundColor: "#ff9800",
                            color: "var(--admin-text)",
                            fontSize: "11px",
                            height: "22px"
                          }}
                        />
                      )}
                    </Box>
                    <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", marginBottom: "4px" }}>
                      مبلغ: {formatNumber(installment.amount)} تومان
                    </Typography>
                    {installment.due_date && (
                      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", marginBottom: "4px" }}>
                        تاریخ سررسید: {installment.due_date_jalali || formatDate(installment.due_date)}
                      </Typography>
                    )}
                    {installment.is_paid && installment.paid_at && (
                      <Typography sx={{ color: "var(--admin-accent)", fontSize: "13px" }}>
                        تاریخ پرداخت: {installment.paid_at_jalali || formatDateTime(installment.paid_at)}
                      </Typography>
                    )}
                    {installment.notes && (
                      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "12px", marginTop: "8px", fontStyle: "italic" }}>
                        یادداشت: {installment.notes}
                      </Typography>
                    )}
                  </Box>
                  {!installment.is_paid && (
                    <Button
                      variant="contained"
                      // startIcon={<PaymentIcon />}
                      onClick={() => handleOpenPayInstallmentDialog(installment)}
                      sx={{
                        backgroundColor: "var(--admin-accent)",
                        color: "var(--admin-text)",
                        fontSize: "12px",
                        padding: "6px 12px",
                        minWidth: "auto",
                        "&:hover": {
                          backgroundColor: "#66a055",
                        }
                      }}
                    >
                      پرداخت
                    </Button>
                  )}
                </Box>
                    ))}
                  </>
                );
              })()}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", padding: "16px", borderTop: "1px solid #505669" }}>
          <Button
            onClick={() => setInstallmentsDialogOpen(false)}
            variant="contained"
            sx={{
              backgroundColor: "#505669",
              color: "var(--admin-text)",
              "&:hover": {
                backgroundColor: "#666"
              }
            }}
          >
            بستن
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog تایید پرداخت قسط */}
      <Dialog
        open={payInstallmentDialogOpen}
        onClose={handleClosePayInstallmentDialog}
        PaperProps={{
          sx: {
            backgroundColor: "var(--admin-surface)",
            borderRadius: "16px",
            direction: "rtl",
            minWidth: "400px",
          }
        }}
      >
        <DialogTitle sx={{ color: "var(--admin-text)", textAlign: "center", fontSize: "18px" }}>
          تایید پرداخت قسط
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "var(--admin-text-secondary)", textAlign: "center", marginBottom: "16px" }}>
            آیا از پرداخت این قسط مطمئن هستید؟
          </DialogContentText>
          {selectedInstallment && (
            <Box sx={{ 
              marginBottom: "16px", 
              padding: "12px", 
              backgroundColor: "var(--admin-surface-alt)", 
              borderRadius: "8px",
            }}>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "14px", marginBottom: "8px" }}>
                قسط شماره: {selectedInstallment.installment_number}
              </Typography>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "14px", marginBottom: "8px" }}>
                مبلغ: {formatNumber(selectedInstallment.amount)} تومان
              </Typography>
              {selectedInstallment.due_date && (
                <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px" }}>
                  تاریخ سررسید: {selectedInstallment.due_date_jalali || formatDate(selectedInstallment.due_date)}
                </Typography>
              )}
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            value={installmentNotes}
            onChange={(e) => setInstallmentNotes(e.target.value)}
            placeholder="یادداشت پرداخت (اختیاری)"
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "var(--admin-surface-alt)",
                color: "var(--admin-text)",
                "& fieldset": {
                  borderColor: "#505669",
                },
                "&:hover fieldset": {
                  borderColor: "var(--admin-accent)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "var(--admin-accent)",
                },
              },
              "& .MuiInputBase-input": {
                color: "var(--admin-text)",
                fontSize: "14px",
              },
              "& .MuiInputBase-input::placeholder": {
                color: "var(--admin-text-secondary)",
                opacity: 1
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", padding: "16px", gap: "12px" }}>
          <Button 
            onClick={handleClosePayInstallmentDialog}
            variant="outlined"
            sx={{ 
              color: "var(--admin-text)", 
              borderColor: "#666",
              "&:hover": {
                borderColor: "#888",
                backgroundColor: "var(--admin-surface-alt)"
              }
            }}
            disabled={payingInstallment}
          >
            انصراف
          </Button>
          <Button 
            onClick={handlePayInstallment}
            variant="contained"
            sx={{ 
              backgroundColor: "var(--admin-accent)",
              "&:hover": {
                backgroundColor: "#66a055"
              }
            }}
            disabled={payingInstallment}
            startIcon={payingInstallment ? <CircularProgress size={16} color="inherit" /> : <PaymentIcon />}
          >
            {payingInstallment ? "در حال پرداخت..." : "تایید پرداخت"}
          </Button>
        </DialogActions>
      </Dialog>
      <ToastContainer autoClose={3000} position="bottom-right" />
    </Box>
  ) : (<></>)
}

