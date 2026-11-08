"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import {
  PAYROLL_ITEM_PRESETS,
  PAYROLL_ITEM_TYPE_OPTIONS,
  formatInputWithSeparator,
  formatNumber,
  parseAmount,
  payrollItemTypeLabel,
  type Payroll,
  type PayrollItem,
  type PayrollItemType,
} from "@/app/lib/payroll";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
} as const;

type Props = {
  payroll: Payroll | null;
  onClose: () => void;
  onChanged: (payroll: Payroll) => void;
};

export default function PayrollItemsDialog({ payroll, onClose, onChanged }: Props) {
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itemType, setItemType] = useState<PayrollItemType>("bonus");
  const [title, setTitle] = useState("پاداش");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!payroll) return;
    setItems(Array.isArray(payroll.items) ? payroll.items : []);
    void loadItems(payroll.id);
  }, [payroll?.id]);

  const loadItems = async (id: number) => {
    const token = tokenCode();
    if (!token) return;
    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", `/api/employee-payrolls/${id}/items`, token);
      if (!res?.hasError) {
        const data = (res as { data?: PayrollItem[] }).data;
        if (Array.isArray(data)) setItems(data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!payroll) return null;

  const applyPreset = (preset: { type: PayrollItemType; title: string }) => {
    setItemType(preset.type);
    setTitle(preset.title);
  };

  const addItem = async () => {
    const value = parseAmount(amount);
    if (!title.trim()) {
      toast.error("عنوان ردیف را وارد کنید");
      return;
    }
    if (value <= 0) {
      toast.error("مبلغ معتبر نیست");
      return;
    }
    setSaving(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient(
        "POST",
        `/api/employee-payrolls/${payroll.id}/items`,
        token,
        {},
        {
          body: JSON.stringify({
            item_type: itemType,
            title: title.trim(),
            amount: value,
          }),
        },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در افزودن ردیف"));
        return;
      }
      const updated = (res as { payroll?: Payroll }).payroll;
      if (updated) {
        onChanged(updated);
        setItems(Array.isArray(updated.items) ? updated.items : []);
      } else {
        await loadItems(payroll.id);
      }
      setAmount("");
      toast.success("ردیف اضافه شد");
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (item: PayrollItem) => {
    setSaving(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient(
        "DELETE",
        `/api/employee-payrolls/${payroll.id}/items/${item.id}`,
        token,
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در حذف ردیف"));
        return;
      }
      const updated = (res as { payroll?: Payroll }).payroll;
      if (updated) {
        onChanged(updated);
        setItems(Array.isArray(updated.items) ? updated.items : []);
      } else {
        await loadItems(payroll.id);
      }
      toast.success("ردیف حذف شد");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={() => !saving && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>ردیف‌های فیش — {payroll.employee?.name || payroll.employee_name || ""}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, pt: 1 }}>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
            پاداش، مزایا، کسر، مالیات و بیمه روی همین فیش ماه. مساعده جداگانه از بخش پرداخت ثبت می‌شود.
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {PAYROLL_ITEM_PRESETS.map((p) => (
              <Button key={`${p.type}-${p.title}`} size="small" variant="outlined" onClick={() => applyPreset(p)}>
                {p.title}
              </Button>
            ))}
          </Box>
          <TextField
            select
            size="small"
            label="نوع"
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            sx={fieldSx}
          >
            {PAYROLL_ITEM_TYPE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="عنوان"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={fieldSx}
          />
          <TextField
            size="small"
            label="مبلغ (تومان)"
            value={amount}
            onChange={(e) => setAmount(formatInputWithSeparator(e.target.value))}
            sx={fieldSx}
            inputProps={{ inputMode: "numeric", style: { direction: "ltr", textAlign: "right" } }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => void addItem()}
            disabled={saving}
          >
            افزودن ردیف
          </Button>

          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.75 }}>
            {loading ? (
              <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>در حال بارگذاری…</Typography>
            ) : items.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>ردیفی ثبت نشده</Typography>
            ) : (
              items.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    py: 0.5,
                    borderBottom: "1px solid var(--admin-border)",
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: 13 }}>
                      {item.title}
                      <Typography component="span" sx={{ fontSize: 11, color: "var(--admin-text-muted)", ml: 1 }}>
                        ({payrollItemTypeLabel(item.item_type)})
                      </Typography>
                    </Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                      {formatNumber(parseAmount(item.amount))} تومان
                    </Typography>
                  </Box>
                  <IconButton size="small" disabled={saving} onClick={() => void removeItem(item)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  );
}
