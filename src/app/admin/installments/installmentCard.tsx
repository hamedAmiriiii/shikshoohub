"use client";
import { useState } from "react";
import { Box, Typography, Chip, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, IconButton, CircularProgress } from "@mui/material";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';

const formatNumber = (num: number | string) => {
  const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(numValue)) return '';
  return new Intl.NumberFormat('fa-IR').format(numValue);
};

export default function InstallmentCard(props: any) {
  const [payInstallmentDialogOpen, setPayInstallmentDialogOpen] = useState(false);
  const [installmentNotes, setInstallmentNotes] = useState("");
  const [payingInstallment, setPayingInstallment] = useState(false);

  const data = props?.props?.data;
  const onRefresh = props?.props?.onRefresh;

  const handleOpenPayInstallmentDialog = () => {
    setInstallmentNotes("");
    setPayInstallmentDialogOpen(true);
  };

  const handleClosePayInstallmentDialog = () => {
    setPayInstallmentDialogOpen(false);
    setInstallmentNotes("");
  };

  const handlePayInstallment = async () => {
    if (!data || !data.purchase_id) return;
    
    setPayingInstallment(true);
    try {
      const response = await FetchWithJwtClient(
        "POST",
        `/api/purchased-products/${data.purchase_id}/installments/${data.id}/pay`,
        {
          notes: installmentNotes || null
        }
      );
      
      if (response !== null && response.installment) {
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

  return (
    <Box style={{ backgroundColor: "#2b3143", borderRadius: "15px", border: "1px solid rgb(55, 84, 165)" }} m={1} p={1}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: "600" }}>
              قسط شماره {data?.installment_number}
            </Typography>
            {data?.is_paid ? (
              <Chip
                icon={<CheckCircleIcon />}
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
                icon={<CancelIcon />}
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
            مبلغ: {formatNumber(data?.amount)} تومان
          </Typography>
          
          {data?.due_date_jalali && (
            <Typography sx={{ color: "#999", fontSize: "13px", marginBottom: "4px" }}>
              تاریخ سررسید: {data.due_date_jalali}
            </Typography>
          )}
          
          {data?.is_paid && data?.paid_at_jalali && (
            <Typography sx={{ color: "#78b568", fontSize: "13px", marginBottom: "4px" }}>
              تاریخ پرداخت: {data.paid_at_jalali}
            </Typography>
          )}
          
          {data?.purchase && (
            <>
              <Typography sx={{ color: "#999", fontSize: "12px", marginTop: "8px" }}>
                خرید #{data.purchase.id}
              </Typography>
              {data.purchase.phone && (
                <Typography sx={{ color: "#999", fontSize: "12px" }}>
                  تلفن: {data.purchase.phone}
                </Typography>
              )}
            </>
          )}
        </Box>
        
        {!data?.is_paid && (
          <Button
            variant="contained"
            startIcon={<PaymentIcon />}
            onClick={handleOpenPayInstallmentDialog}
            sx={{
              backgroundColor: "#78b568",
              color: "#fff",
              fontSize: "12px",
              padding: "6px 12px",
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: "#66a055",
              }
            }}
          >
            پرداخت
          </Button>
        )}
      </Box>

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
        <DialogTitle sx={{ color: "#fff", textAlign: "center", fontSize: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ fontSize: "18px", fontWeight: "600" }}>تایید پرداخت قسط</Typography>
          <IconButton
            onClick={handleClosePayInstallmentDialog}
            sx={{ color: "#fff" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#ccc", textAlign: "center", marginBottom: "16px" }}>
            آیا از پرداخت این قسط مطمئن هستید؟
          </DialogContentText>
          {data && (
            <Box sx={{ 
              marginBottom: "16px", 
              padding: "12px", 
              backgroundColor: "#1a1d2e", 
              borderRadius: "8px",
            }}>
              <Typography sx={{ color: "#fff", fontSize: "14px", marginBottom: "8px" }}>
                قسط شماره: {data.installment_number}
              </Typography>
              <Typography sx={{ color: "#fff", fontSize: "14px", marginBottom: "8px" }}>
                مبلغ: {formatNumber(data.amount)} تومان
              </Typography>
              {data.due_date_jalali && (
                <Typography sx={{ color: "#999", fontSize: "13px" }}>
                  تاریخ سررسید: {data.due_date_jalali}
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
  );
}

