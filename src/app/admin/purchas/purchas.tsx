
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

const formatNumber = (num: number | string) => {
  const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(numValue)) return '';
  return new Intl.NumberFormat('fa-IR').format(numValue);
};

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
  const [selectedItem, setSelectedItem] = useState<any>(null);
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
  const onRefresh = props?.props?.onRefresh;
  const isInstallment = data?.payment_type === 'installment';

  const handleOpenDeleteDialog = (item: any) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedItem(null);
    setDeleting(false);
  };

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
    console.log("ddddddddddd" , selectedItem);
   
    setDeleting(true);
    try {
      const response = await FetchWithJwtClient(
        "DELETE",
        `/api/purchased-products/${data.id}/items/${selectedItem.id}`,
        null
      );
      
      if (response !== null) {
        setTotalDeleting(totalDeleting + parseInt(selectedItem.sale_price) )
        console.log("totalDeleting" , totalDeleting);
        // Mark item as deleted locally
        setDeletedItems(prev => [...prev, selectedItem.id]);
        // handleCloseDeleteDialog();
        // Refresh the list if callback provided
        if (onRefresh) {
          onRefresh();
        }
      } else {
        alert("خطا در حذف آیتم");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("خطا در حذف آیتم");
      setDeleting(false);
    } finally {
      
    }
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
    <Box style={{ backgroundColor: "#2b3143", borderRadius: "15px"  , border:"1px solid rgb(55, 84, 165)" }} m={1} p={1}
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
                color: "#fff",
                fontWeight: "600",
                fontSize: "11px",
                height: "24px",
                "& .MuiChip-icon": {
                  color: "#fff",
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
          {/* نمایش شماره تلفن */}
          {data?.phone && (
            <LabelCustom title={"شماره تلفن"} name="" text={data.phone} />
          )}
          
          {/* نمایش مجموع مبلغ */}
          {data?.total_amount !== undefined && (
            <LabelCustom title={"مجموع مبلغ"} name="" text={formatNumber(data.total_amount) + " تومان"} />
          )}
          
          {/* نمایش اعتبار استفاده شده */}
          {data?.credit_used !== undefined && data.credit_used > 0 && (
            <LabelCustom title={"اعتبار استفاده شده"} name="" text={formatNumber(data.credit_used) + " تومان"} />
          )}
          
          {/* نمایش اعتبار کسب شده */}
          {data?.credit_earned !== undefined && data.credit_earned > 0 && (
            <LabelCustom title={"اعتبار کسب شده"} name="" text={formatNumber(data.credit_earned) + " تومان"} />
          )}
          
          {/* نمایش اطلاعات خرید اقساطی */}
          {isInstallment && (
            <>
              {data?.installment_count && (
                <LabelCustom title={"تعداد اقساط"} name="" text={`${data.installment_count} قسط`} />
              )}
              {data?.installment_amount && (
                <LabelCustom title={"مبلغ هر قسط"} name="" text={formatNumber(data.installment_amount) + " تومان"} />
              )}
              {data?.installment_amount && (
                <LabelCustom title={"مبلغ پرداخت شده"} name="" text={formatNumber(data.paid_amount) + " تومان"} />
              )}
            </>
          )}
          
          {/* نمایش لیست محصولات */}
          {data?.purchased_products && Array.isArray(data.purchased_products) && data.purchased_products.length > 0 && (
            <Box className="mt-2">
              
              {data.purchased_products
                .filter((item: any) => !deletedItems.includes(item.id))
                .map((item: any, index: number) => (
                <Box key={item.id || index} sx={{ 
                  backgroundColor: "#1a1d2e", 
                  borderRadius: "8px", 
                  padding: "8px", 
                  marginBottom: "8px" ,
                  border:"1px solid rgb(212, 87, 37)"
                }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box sx={{ flex: 1 }}>
                      <LabelCustom 
                        title={"کالا"} 
                        name="" 
                        text={item.product?.name + " " + item.product_id + " " + "-----" + " " +"عدد" + " " + item.quantity} 
                      />
                      {/* <LabelCustom 
                        title={"تعداد"} 
                        name="" 
                        text={ || 0} 
                      /> */}
                      <LabelCustom 
                        title={"قیمت "} 
                        name="" 
                        text={
                          item.product.has_discount 
                            ? `${formatNumber(item.product.sale_price || 0)} تومان (تخفیف: ${formatNumber(item.product.discount_percent || 0)}%)`
                            : formatNumber(item.product.sale_price || 0) + " تومان"
                        } 
                      />
                    </Box>
                    {/* دکمه برگشت فقط برای خریدهای غیراقساطی */}
                    {!isInstallment && (
                      <IconButton
                        onClick={() => handleOpenDeleteDialog(item)}
                        sx={{
                          backgroundColor: "#ff5252",
                          color: "#fff",
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
              color: "#fff",
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
            backgroundColor: "#2b3143",
            borderRadius: "16px",
            direction: "rtl",
            minWidth: "300px",
          }
        }}
      >
        <DialogTitle sx={{ color: "#fff", textAlign: "center", fontSize: "18px" }}>
          تایید برگشت کالا
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#ccc", textAlign: "center" }}>
            آیا از برگشت این کالا مطمئن هستید؟
            {selectedItem && (
              <Box sx={{ 
                marginTop: "12px", 
                padding: "8px", 
                backgroundColor: "#1a1d2e", 
                borderRadius: "8px",
                color: "#fff"
              }}>
                <Typography variant="body2">
                  {selectedItem.product?.name} - {selectedItem.quantity} عدد
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", padding: "16px", gap: "12px" }}>
          <Button 
            onClick={handleCloseDeleteDialog}
            variant="outlined"
            sx={{ 
              color: "#fff", 
              borderColor: "#666",
              "&:hover": {
                borderColor: "#888",
                backgroundColor: "rgba(255,255,255,0.05)"
              }
            }}
            // disabled={deleting}
          >
            انصراف
          </Button>
          <Button 
            onClick={handleDeleteItem}
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
            {deleting ? "در حال حذف..." : "برگشت کالا"}
          </Button>
          <Button 
            onClick={()=>{
              const params = new URLSearchParams({
                price: totalDeleting ,
              });
              router.push(`/admin?${params.toString()}`);
            }}
            variant="contained"
            sx={{ 
              backgroundColor: "#ff5252",
              "&:hover": {
                backgroundColor: "#ff1744"
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
            backgroundColor: "#2b3143",
            borderRadius: "16px",
            direction: "rtl",
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
            جزئیات اقساط خرید #{data?.id}
          </Typography>
          <IconButton
            onClick={() => setInstallmentsDialogOpen(false)}
            sx={{ color: "#fff" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ padding: "24px", maxHeight: "70vh", overflowY: "auto" }}>
          {(!installmentsData || installmentsData.length === 0) && (!data?.installments || !Array.isArray(data.installments) || data.installments.length === 0) ? (
            <Typography sx={{ color: "#999", textAlign: "center", padding: "40px" }}>
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
                      backgroundColor: "#1a1d2e", 
                      borderRadius: "8px", 
                      padding: "16px",
                      marginBottom: "16px"
                    }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <Typography sx={{ color: "#999", fontSize: "14px" }}>تعداد کل اقساط:</Typography>
                        <Typography sx={{ color: "#fff", fontSize: "14px", fontWeight: "600" }}>
                          {installments.length} قسط
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <Typography sx={{ color: "#999", fontSize: "14px" }}>قسط‌های پرداخت شده:</Typography>
                        <Typography sx={{ color: "#78b568", fontSize: "14px", fontWeight: "600" }}>
                          {installments.filter((inst: any) => inst.is_paid).length} قسط
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <Typography sx={{ color: "#999", fontSize: "14px" }}>قسط‌های باقیمانده:</Typography>
                        <Typography sx={{ color: "#ff9800", fontSize: "14px", fontWeight: "600" }}>
                          {installments.filter((inst: any) => !inst.is_paid).length} قسط
                        </Typography>
                      </Box>
                      <Divider sx={{ borderColor: "#505669", marginY: "8px" }} />
                      <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <Typography sx={{ color: "#999", fontSize: "14px" }}>مبلغ کل پرداخت شده:</Typography>
                        <Typography sx={{ color: "#78b568", fontSize: "15px", fontWeight: "700" }}>
                          {formatNumber(
                            installments
                              .filter((inst: any) => inst.is_paid)
                              .reduce((sum: number, inst: any) => sum + parseFloat(inst.amount || 0), 0)
                          )} تومان
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography sx={{ color: "#999", fontSize: "14px" }}>مبلغ باقیمانده:</Typography>
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
                    backgroundColor: installment.is_paid ? "#1a3a1a" : "#1a1d2e",
                    borderRadius: "8px",
                    padding: "16px",
                    border: `1px solid ${installment.is_paid ? "#78b568" : "#505669"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <Typography sx={{ 
                        color: "#fff", 
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
                            backgroundColor: "#78b568",
                            color: "#fff",
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
                            color: "#fff",
                            fontSize: "11px",
                            height: "22px"
                          }}
                        />
                      )}
                    </Box>
                    <Typography sx={{ color: "#999", fontSize: "13px", marginBottom: "4px" }}>
                      مبلغ: {formatNumber(installment.amount)} تومان
                    </Typography>
                    {installment.due_date && (
                      <Typography sx={{ color: "#999", fontSize: "13px", marginBottom: "4px" }}>
                        تاریخ سررسید: {installment.due_date_jalali || formatDate(installment.due_date)}
                      </Typography>
                    )}
                    {installment.is_paid && installment.paid_at && (
                      <Typography sx={{ color: "#78b568", fontSize: "13px" }}>
                        تاریخ پرداخت: {installment.paid_at_jalali || formatDateTime(installment.paid_at)}
                      </Typography>
                    )}
                    {installment.notes && (
                      <Typography sx={{ color: "#999", fontSize: "12px", marginTop: "8px", fontStyle: "italic" }}>
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
                        backgroundColor: "#78b568",
                        color: "#fff",
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
              color: "#fff",
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
            backgroundColor: "#2b3143",
            borderRadius: "16px",
            direction: "rtl",
            minWidth: "400px",
          }
        }}
      >
        <DialogTitle sx={{ color: "#fff", textAlign: "center", fontSize: "18px" }}>
          تایید پرداخت قسط
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#ccc", textAlign: "center", marginBottom: "16px" }}>
            آیا از پرداخت این قسط مطمئن هستید؟
          </DialogContentText>
          {selectedInstallment && (
            <Box sx={{ 
              marginBottom: "16px", 
              padding: "12px", 
              backgroundColor: "#1a1d2e", 
              borderRadius: "8px",
            }}>
              <Typography sx={{ color: "#fff", fontSize: "14px", marginBottom: "8px" }}>
                قسط شماره: {selectedInstallment.installment_number}
              </Typography>
              <Typography sx={{ color: "#fff", fontSize: "14px", marginBottom: "8px" }}>
                مبلغ: {formatNumber(selectedInstallment.amount)} تومان
              </Typography>
              {selectedInstallment.due_date && (
                <Typography sx={{ color: "#999", fontSize: "13px" }}>
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
              },
              "& .MuiInputBase-input::placeholder": {
                color: "rgba(255,255,255,0.4)",
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
              color: "#fff", 
              borderColor: "#666",
              "&:hover": {
                borderColor: "#888",
                backgroundColor: "rgba(255,255,255,0.05)"
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
              backgroundColor: "#78b568",
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
    </Box>
  ) : (<></>)
}

