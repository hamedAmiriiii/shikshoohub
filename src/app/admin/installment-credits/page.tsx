"use client";
import List from "@/app/coponent/grid/Grid";
import React, { useState, Suspense } from "react";
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from "next/navigation";
import InstallmentCreditCard from "./installmentCreditCard";
import { apiRequestError } from "@/app/lib/apiRequestError";
import tokenCode from "@/app/coponent/tokenCode";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function InstallmentCreditsPage() {
  const router = useRouter();
  const [dataFilter, setDataFilter] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCredit, setEditingCredit] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [credit, setCredit] = useState('');
  const [creditDisplay, setCreditDisplay] = useState('');
  const [isCreditFocused, setIsCreditFocused] = useState(false);
  const [installmentCredit, setInstallmentCredit] = useState('');
  const [installmentCreditDisplay, setInstallmentCreditDisplay] = useState('');
  const [isInstallmentCreditFocused, setIsInstallmentCreditFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  let searchBoxList: any = [
    { fieldName: "phone", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
  ];

  const FilterComponent = () => <h1>ggggggggg</h1>;

  const formatNumber = (num: number | string) => {
    const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('fa-IR').format(numValue);
  };

  const desktopColumns = [
    { 
      label: "شماره تلفن", 
      field: (item: any) => item?.phone || "بدون شماره",
      width: "150px"
    },
    { 
      label: "اعتبار اقساطی (تومان)", 
      field: (item: any) => item?.installment_credit ? `${formatNumber(item.installment_credit)} تومان` : "0 تومان"
    },
    { 
      label: "اعتبار عادی (تومان)", 
      field: (item: any) => item?.credit ? `${formatNumber(item.credit)} تومان` : "0 تومان"
    },
    { 
      label: "تاریخ ایجاد", 
      field: (item: any) => item?.created_at ? new Date(item.created_at).toLocaleDateString('fa-IR') : "بدون تاریخ",
      width: "150px"
    },
    { 
      label: "تاریخ بروزرسانی", 
      field: (item: any) => item?.updated_at ? new Date(item.updated_at).toLocaleDateString('fa-IR') : "بدون تاریخ",
      width: "150px"
    },
  ];

  const handleOpenCreateDialog = () => {
    setEditingCredit(null);
    setPhone('');
    setCredit('');
    setCreditDisplay('');
    setIsCreditFocused(false);
    setInstallmentCredit('');
    setInstallmentCreditDisplay('');
    setIsInstallmentCreditFocused(false);
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setEditingCredit(null);
    setPhone('');
    setCredit('');
    setCreditDisplay('');
    setIsCreditFocused(false);
    setInstallmentCredit('');
    setInstallmentCreditDisplay('');
    setIsInstallmentCreditFocused(false);
  };

  const handleEditCredit = (creditData: any) => {
    setEditingCredit(creditData);
    setPhone(creditData.phone || '');
    const creditValue = creditData.credit?.toString() || '0';
    setCredit(creditValue);
    setCreditDisplay(formatNumber(parseFloat(creditValue) || 0));
    setIsCreditFocused(false);
    const installmentValue = creditData.installment_credit?.toString() || '0';
    setInstallmentCredit(installmentValue);
    setInstallmentCreditDisplay(formatNumber(parseFloat(installmentValue) || 0));
    setIsInstallmentCreditFocused(false);
    setCreateDialogOpen(true);
  };

  const handleDeleteCredit = async (phoneNumber: string) => {
    if (!confirm(`آیا مطمئن هستید که می‌خواهید اعتبار کاربر ${phoneNumber} را حذف کنید؟`)) {
      return;
    }

    try {
      const token = tokenCode();
      const res = await apiRequestError(
        "Delete",
        {},
        {},
        `/api/installment-credits/${phoneNumber}`,
        true,
        true,
        token
      );

      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        toast.error(parsedResponse.message || "خطا در حذف اعتبار");
      } else {
        toast.success("اعتبار با موفقیت حذف شد");
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error deleting credit:", error);
      toast.error("خطا در حذف اعتبار");
    }
  };

  const handleSubmit = async () => {
    // اعتبارسنجی
    if (!phone || phone.trim() === '') {
      toast.error("لطفاً شماره تلفن را وارد کنید");
      return;
    }

    if (phone.length !== 11 || !/^\d+$/.test(phone)) {
      toast.error("شماره تلفن باید دقیقاً 11 رقم باشد");
      return;
    }

    if (!credit || credit.trim() === '') {
      toast.error("لطفاً مبلغ اعتبار را وارد کنید");
      return;
    }

    if (!installmentCredit || installmentCredit.trim() === '') {
      toast.error("لطفاً مبلغ اعتبار اقساطی را وارد کنید");
      return;
    }

    const creditValue = parseFloat(credit.replace(/,/g, ''));
    if (isNaN(creditValue) || creditValue < 0) {
      toast.error("مبلغ اعتبار باید یک عدد مثبت باشد");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = tokenCode();
      const installmentValue = parseFloat(installmentCredit.replace(/,/g, ''));
      if (isNaN(installmentValue) || installmentValue < 0) {
        toast.error("مبلغ اعتبار اقساطی باید یک عدد مثبت باشد");
        setIsSubmitting(false);
        return;
      }

      const data = {
        phone: phone.trim(),
        credit: creditValue,
        installment_credit: installmentValue
      };

      let res;
      if (editingCredit) {
        // ویرایش - استفاده از PUT
        res = await apiRequestError(
          "Put",
          {},
          data,
          `/api/installment-credits/${phone.trim()}`,
          true,
          true,
          token
        );
      } else {
        // ایجاد - استفاده از POST
        res = await apiRequestError(
          "Post",
          {},
          data,
          `/api/installment-credits`,
          true,
          true,
          token
        );
      }

      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        toast.error(parsedResponse.message || "خطا در ذخیره اعتبار");
      } else {
        toast.success(editingCredit ? "اعتبار با موفقیت به‌روزرسانی شد" : "اعتبار با موفقیت ایجاد شد");
        handleCloseCreateDialog();
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error saving credit:", error);
      toast.error("خطا در ذخیره اعتبار");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCreditInput = (value: string) => {
    // حذف همه کاراکترهای غیر عددی
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '') return '';
    return numericValue;
  };

  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <Box sx={{width: { xs:"100%", md:"130%" , },  direction: "rtl", padding: "16px", minHeight: "100vh", paddingBottom: "100px", background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)" }}>
        {/* Header with Create Button */}
        <Box sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "16px" 
        }}>
         
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            sx={{
              backgroundColor: "#78b568",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#5a9a4a",
              },
              padding: { xs: "8px 16px", md: "10px 20px" },
              fontSize: { xs: "12px", md: "14px" }
            }}
          >
            ایجاد اعتبار
          </Button>
        </Box>
       
        {/* List Section */}
        <div style={{ width: "100%", direction: "rtl" }} className="flex-col items-center justify-center">
          <List
            key={refreshKey}
            disableFilter={true}
            searchBoxList={searchBoxList}
            filterBoxList={dataFilter}
            CartComponent={(props: any) => (
              <InstallmentCreditCard 
                props={props} 
                onEdit={handleEditCredit}
                onDelete={handleDeleteCredit}
              />
            )}
            url="/api/installment-credits"
            filterComponent={<FilterComponent />}
            showTotal={true}
            desktopColumns={desktopColumns}
            onEditItem={handleEditCredit}
            onDeleteItem={handleDeleteCredit}
          />
        </div>

        {/* Create/Edit Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={handleCloseCreateDialog}
          maxWidth="sm"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              backgroundColor: "#1a1d2e",
              borderRadius: "16px",
              border: "1px solid #505669"
            }
          }}
        >
          <DialogTitle sx={{ color: "#fff", fontSize: "20px", fontWeight: "600" }}>
            {editingCredit ? "ویرایش اعتبار" : "ایجاد اعتبار جدید"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
              <TextField
                label="شماره تلفن"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 11) {
                    setPhone(value);
                  }
                }}
                disabled={!!editingCredit}
                inputProps={{
                  maxLength: 11,
                  style: { textAlign: "right", direction: "ltr" }
                }}
                fullWidth
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#2b3143",
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
                  "& .MuiInputLabel-root": {
                    color: "rgba(255,255,255,0.7)",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#78b568",
                  },
                }}
              />
              <TextField
                label="مبلغ اعتبار (تومان)"
                value={isCreditFocused ? credit : creditDisplay}
                onChange={(e) => {
                  const numericValue = formatCreditInput(e.target.value);
                  setCredit(numericValue);
                  if (numericValue === '') {
                    setCreditDisplay('');
                  } else {
                    const num = parseFloat(numericValue);
                    if (!isNaN(num)) {
                      setCreditDisplay(formatNumber(num));
                    }
                  }
                }}
                onFocus={() => {
                  setIsCreditFocused(true);
                  // نمایش عدد خام بدون جداکننده
                  setCredit(credit.replace(/,/g, ''));
                }}
                onBlur={() => {
                  setIsCreditFocused(false);
                  // فرمت کردن عدد با جداکننده هزارگان
                  const num = parseFloat(credit.replace(/,/g, ''));
                  if (!isNaN(num) && num >= 0) {
                    setCredit(num.toString());
                    setCreditDisplay(formatNumber(num));
                  } else {
                    setCredit('');
                    setCreditDisplay('');
                  }
                }}
                inputProps={{
                  style: { textAlign: "right", direction: "ltr" }
                }}
                fullWidth
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#2b3143",
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
                  "& .MuiInputLabel-root": {
                    color: "rgba(255,255,255,0.7)",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#78b568",
                  },
                }}
              />
              <TextField
                label="مبلغ اعتبار اقساطی (تومان)"
                value={isInstallmentCreditFocused ? installmentCredit : installmentCreditDisplay}
                onChange={(e) => {
                  const numericValue = formatCreditInput(e.target.value);
                  setInstallmentCredit(numericValue);
                  if (numericValue === '') {
                    setInstallmentCreditDisplay('');
                  } else {
                    const num = parseFloat(numericValue);
                    if (!isNaN(num)) {
                      setInstallmentCreditDisplay(formatNumber(num));
                    }
                  }
                }}
                onFocus={() => {
                  setIsInstallmentCreditFocused(true);
                  setInstallmentCredit(installmentCredit.replace(/,/g, ''));
                }}
                onBlur={() => {
                  setIsInstallmentCreditFocused(false);
                  const num = parseFloat(installmentCredit.replace(/,/g, ''));
                  if (!isNaN(num) && num >= 0) {
                    setInstallmentCredit(num.toString());
                    setInstallmentCreditDisplay(formatNumber(num));
                  } else {
                    setInstallmentCredit('');
                    setInstallmentCreditDisplay('');
                  }
                }}
                inputProps={{
                  style: { textAlign: "right", direction: "ltr" }
                }}
                fullWidth
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#2b3143",
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
                  "& .MuiInputLabel-root": {
                    color: "rgba(255,255,255,0.7)",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#78b568",
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ padding: "16px 24px" }}>
            <Button
              onClick={handleCloseCreateDialog}
              sx={{
                color: "rgba(255,255,255,0.7)",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                }
              }}
            >
              انصراف
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              variant="contained"
              sx={{
                backgroundColor: "#78b568",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#5a9a4a",
                },
                "&:disabled": {
                  backgroundColor: "#505669",
                  color: "#999",
                },
              }}
            >
              {isSubmitting ? "در حال ذخیره..." : editingCredit ? "به‌روزرسانی" : "ایجاد"}
            </Button>
          </DialogActions>
        </Dialog>

        <ToastContainer autoClose={3000} style={{ marginBottom: '76px', borderRadius: "15px" }} position={"bottom-right"} />
      </Box>
    </Suspense>
  );
}

