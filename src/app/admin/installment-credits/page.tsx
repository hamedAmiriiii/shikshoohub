"use client";

import List from "@/app/coponent/grid/Grid";
import React, { Suspense, useState } from "react";
import { Box, Typography, Button, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import InstallmentCreditCard from "./installmentCreditCard";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatAmountInput, parseAmountInput } from "@/app/lib/amountInput";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import BottomSheet from "@/app/coponent/BottomSheet";
import { adminButtonStartIconSx } from "@/app/admin/theme/adminTheme";
import {
  creditDisplayName,
  formatCreditDate,
  formatCreditMoney,
  toCreditRow,
  type InstallmentCreditRow,
} from "./creditRow";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "var(--admin-accent)" },
} as const;

export default function InstallmentCreditsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InstallmentCreditRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InstallmentCreditRow | null>(null);
  const [phone, setPhone] = useState("");
  const [creditDisplay, setCreditDisplay] = useState("");
  const [installmentCreditDisplay, setInstallmentCreditDisplay] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const searchBoxList = [
    { fieldName: "phone", fieldOperation: "MATCH" as const, fieldValue: "", nextConditionOperator: "OR" as const },
    { fieldName: "user.phone", fieldOperation: "MATCH" as const, fieldValue: "", nextConditionOperator: "OR" as const },
    { fieldName: "name", fieldOperation: "MATCH" as const, fieldValue: "", nextConditionOperator: "OR" as const },
    { fieldName: "user.name", fieldOperation: "MATCH" as const, fieldValue: "", nextConditionOperator: "OR" as const },
  ];

  const desktopColumns = [
    {
      label: "کاربر",
      field: (item: unknown) => {
        const row = toCreditRow(item);
        if (row.name && row.phone) return `${row.name} — ${row.phone}`;
        return row.name || row.phone || "بدون مشخصات";
      },
      width: "220px",
    },
    {
      label: "اعتبار اقساطی",
      field: (item: unknown) => `${formatCreditMoney(toCreditRow(item).installment_credit)} تومان`,
    },
    {
      label: "اعتبار عادی",
      field: (item: unknown) => `${formatCreditMoney(toCreditRow(item).credit)} تومان`,
    },
    {
      label: "تاریخ ایجاد",
      field: (item: unknown) => {
        const row = toCreditRow(item);
        return formatCreditDate(row.created_at_jalali || row.created_at);
      },
      width: "170px",
    },
    {
      label: "تاریخ بروزرسانی",
      field: (item: unknown) => {
        const row = toCreditRow(item);
        return formatCreditDate(row.updated_at_jalali || row.updated_at);
      },
      width: "170px",
    },
  ];

  const openCreate = () => {
    setEditing(null);
    setPhone("");
    setCreditDisplay("");
    setInstallmentCreditDisplay("");
    setFormOpen(true);
  };

  const closeForm = () => {
    if (isSubmitting) return;
    setFormOpen(false);
    setEditing(null);
    setPhone("");
    setCreditDisplay("");
    setInstallmentCreditDisplay("");
  };

  const handleEditCredit = (item: unknown) => {
    const row = toCreditRow(item);
    setEditing(row);
    setPhone(row.phone);
    setCreditDisplay(row.credit ? formatAmountInput(String(Math.round(row.credit))) : "");
    setInstallmentCreditDisplay(
      row.installment_credit ? formatAmountInput(String(Math.round(row.installment_credit))) : "",
    );
    setFormOpen(true);
  };

  const handleAskDelete = (item: unknown) => {
    const row = toCreditRow(item);
    if (!row.phone && row.id == null) {
      toast.error("شماره یا شناسه این اعتبار پیدا نشد");
      return;
    }
    setDeleteTarget(row);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const key = deleteTarget.phone || String(deleteTarget.id ?? "");
    if (!key) {
      toast.error("شماره تلفن برای حذف مشخص نیست");
      return;
    }
    setDeleting(true);
    try {
      const token = tokenCode();
      const res = await apiRequestError(
        "Delete",
        {},
        {},
        `/api/installment-credits/${encodeURIComponent(key)}`,
        true,
        true,
        token,
      );
      if (res.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در حذف اعتبار"));
        return;
      }
      toast.success("اعتبار با موفقیت حذف شد");
      setDeleteTarget(null);
      setRefreshKey((prev) => prev + 1);
    } catch {
      toast.error("خطا در حذف اعتبار");
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async () => {
    if (!phone.trim()) {
      toast.error("لطفاً شماره تلفن را وارد کنید");
      return;
    }
    if (phone.length !== 11 || !/^\d+$/.test(phone)) {
      toast.error("شماره تلفن باید دقیقاً ۱۱ رقم باشد");
      return;
    }
    if (!creditDisplay.trim()) {
      toast.error("لطفاً مبلغ اعتبار را وارد کنید");
      return;
    }
    if (!installmentCreditDisplay.trim()) {
      toast.error("لطفاً مبلغ اعتبار اقساطی را وارد کنید");
      return;
    }

    const creditValue = parseAmountInput(creditDisplay);
    const installmentValue = parseAmountInput(installmentCreditDisplay);
    if (creditValue < 0 || installmentValue < 0) {
      toast.error("مبلغ اعتبار نمی‌تواند منفی باشد");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = tokenCode();
      const data = {
        phone: phone.trim(),
        credit: creditValue,
        installment_credit: installmentValue,
      };
      const res = editing
        ? await apiRequestError("Put", {}, data, `/api/installment-credits/${phone.trim()}`, true, true, token)
        : await apiRequestError("Post", {}, data, `/api/installment-credits`, true, true, token);

      if (res.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ذخیره اعتبار"));
        return;
      }
      toast.success(editing ? "اعتبار به‌روزرسانی شد" : "اعتبار ایجاد شد");
      closeForm();
      setRefreshKey((prev) => prev + 1);
    } catch {
      toast.error("خطا در ذخیره اعتبار");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <Box
        sx={{
          width: { xs: "100%", md: "130%" },
          direction: "rtl",
          padding: "16px",
          minHeight: "100vh",
          paddingBottom: "100px",
          background: "var(--admin-bg-gradient)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{
              ...adminButtonStartIconSx,
              backgroundColor: "var(--admin-accent)",
              color: "#fff",
              "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
            }}
          >
            ایجاد اعتبار
          </Button>
        </Box>

        <div style={{ width: "100%", direction: "rtl" }} className="flex-col items-center justify-center">
          <List
            key={refreshKey}
            disableFilter={true}
            searchBoxList={searchBoxList}
            filterBoxList={[]}
            CartComponent={(props: { data?: unknown }) => (
              <InstallmentCreditCard props={props} onEdit={handleEditCredit} onDelete={handleAskDelete} />
            )}
            url="/api/installment-credits"
            filterComponent={null}
            showTotal={true}
            enablePagination
            compactDesktop
            desktopColumns={desktopColumns}
            onEditItem={handleEditCredit}
            onDeleteItem={handleAskDelete}
            hidePrintAction
          />
        </div>

        <BottomSheet open={formOpen} onClose={closeForm} title={editing ? "ویرایش اعتبار" : "ایجاد اعتبار جدید"}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, direction: "rtl" }}>
            <TextField
              label="شماره تلفن"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9۰-۹]/g, "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
                if (value.length <= 11) setPhone(value);
              }}
              disabled={!!editing}
              inputProps={{ maxLength: 11, style: { textAlign: "right", direction: "ltr" } }}
              fullWidth
              required
              sx={fieldSx}
            />
            <TextField
              label="مبلغ اعتبار عادی (تومان)"
              value={creditDisplay}
              onChange={(e) => setCreditDisplay(formatAmountInput(e.target.value))}
              inputProps={{ inputMode: "numeric", style: { textAlign: "right", direction: "ltr" } }}
              fullWidth
              required
              sx={fieldSx}
            />
            <TextField
              label="مبلغ اعتبار اقساطی (تومان)"
              value={installmentCreditDisplay}
              onChange={(e) => setInstallmentCreditDisplay(formatAmountInput(e.target.value))}
              inputProps={{ inputMode: "numeric", style: { textAlign: "right", direction: "ltr" } }}
              fullWidth
              required
              sx={fieldSx}
            />
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 1 }}>
              <Button onClick={closeForm} disabled={isSubmitting} sx={{ color: "var(--admin-text-muted)" }}>
                انصراف
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                variant="contained"
                sx={{
                  backgroundColor: "var(--admin-accent)",
                  color: "#fff",
                  "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
                }}
              >
                {isSubmitting ? "در حال ذخیره..." : editing ? "به‌روزرسانی" : "ایجاد"}
              </Button>
            </Box>
          </Box>
        </BottomSheet>

        <BottomSheet
          open={!!deleteTarget}
          onClose={() => !deleting && setDeleteTarget(null)}
          title="حذف اعتبار"
        >
          <Box sx={{ direction: "rtl" }}>
            <Typography sx={{ color: "var(--admin-text)", fontSize: 14, mb: 2 }}>
              مطمئن هستید که می‌خواهید اعتبار {deleteTarget ? creditDisplayName(deleteTarget) : "این کاربر"} را حذف کنید؟
            </Typography>
            {deleteTarget ? (
              <Box
                sx={{
                  bgcolor: "var(--admin-surface-alt)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: "10px",
                  p: 1.5,
                  mb: 2,
                }}
              >
                {deleteTarget.name ? (
                  <Typography sx={{ fontSize: 13, color: "var(--admin-text)" }}>نام: {deleteTarget.name}</Typography>
                ) : null}
                <Typography sx={{ fontSize: 13, color: "var(--admin-text)", direction: "ltr" }}>
                  شماره: {deleteTarget.phone || "—"}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)", mt: 0.5 }}>
                  اعتبار اقساطی: {formatCreditMoney(deleteTarget.installment_credit)} تومان
                </Typography>
                <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
                  اعتبار عادی: {formatCreditMoney(deleteTarget.credit)} تومان
                </Typography>
              </Box>
            ) : null}
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ color: "var(--admin-text-muted)" }}>
                انصراف
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={deleting}
                variant="contained"
                color="error"
              >
                {deleting ? "در حال حذف..." : "حذف"}
              </Button>
            </Box>
          </Box>
        </BottomSheet>

        <ToastContainer autoClose={3000} style={{ marginBottom: "76px", borderRadius: "15px" }} position="bottom-right" />
      </Box>
    </Suspense>
  );
}
