"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import tokenCode from "@/app/coponent/tokenCode";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { readShopFeatures } from "@/app/lib/shopFeatures";
import { adminButtonStartIconSx, adminSurfaceCardSx } from "@/app/admin/theme/adminTheme";

type Row = {
  id: number;
  category_id: number;
  category_name?: string | null;
  phone: string;
  note?: string | null;
};

type Props = {
  /** اگر true فقط دکمه را نشان می‌دهد وقتی باشگاه مشتریان روشن است */
  asToolbarButton?: boolean;
};

export default function CategoryStockNotifyManage({ asToolbarButton = true }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);
  const clubOn = readShopFeatures().customer_club_enabled;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", "/api/category-stock-notify", tokenCode(), {
        per_page: 200,
      });
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خواندن لیست ناموفق بود"));
        setRows([]);
        return;
      }
      const list = Array.isArray(res?.data) ? (res.data as Row[]) : [];
      setRows(list);
    } catch {
      toast.error("خطا در خواندن لیست");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const openEdit = (row: Row) => {
    setEditRow(row);
    setEditPhone(row.phone || "");
    setEditNote(row.note || "");
  };

  const saveEdit = async () => {
    if (!editRow) return;
    const phone = editPhone.trim();
    if (!/^09\d{9}$/.test(phone)) {
      toast.error("شماره معتبر نیست");
      return;
    }
    setSaving(true);
    try {
      const res = await FetchWithJwtClient(
        "PUT",
        `/api/category-stock-notify/${editRow.id}`,
        tokenCode(),
        {},
        { body: JSON.stringify({ phone, note: editNote.trim() || null }) },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ویرایش ناموفق بود"));
        return;
      }
      toast.success("ذخیره شد");
      setEditRow(null);
      await load();
    } catch {
      toast.error("خطا در ویرایش");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Row) => {
    if (!window.confirm(`شماره ${row.phone} از لیست دسته «${row.category_name || row.category_id}» حذف شود؟`)) {
      return;
    }
    try {
      const res = await FetchWithJwtClient(
        "DELETE",
        `/api/category-stock-notify/${row.id}`,
        tokenCode(),
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "حذف ناموفق بود"));
        return;
      }
      toast.success("حذف شد");
      await load();
    } catch {
      toast.error("خطا در حذف");
    }
  };

  if (!clubOn) return null;

  return (
    <>
      {asToolbarButton ? (
        <Button
          size="small"
          startIcon={<NotificationsActiveOutlinedIcon sx={{ fontSize: 16 }} />}
          onClick={() => setOpen(true)}
          sx={{
            ...adminButtonStartIconSx,
            height: "32px",
            borderRadius: "8px",
            color: "var(--admin-text)",
            border: "1px solid var(--admin-border)",
            backgroundColor: "var(--admin-surface)",
            fontSize: "11px",
            whiteSpace: "nowrap",
            textTransform: "none",
            "&:hover": { backgroundColor: "var(--admin-menu-hover)" },
          }}
        >
          خبر موجود شدن دسته
        </Button>
      ) : null}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: "var(--admin-surface)",
            color: "var(--admin-text)",
            borderRadius: "16px",
            direction: "rtl",
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 16 }}>
          <Box sx={{ flex: 1 }}>لیست خبر موجود شدن دسته‌ها</Box>
          <IconButton size="small" onClick={() => void load()} disabled={loading}>
            <RefreshIcon fontSize="small" sx={{ color: "var(--admin-accent)" }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: "var(--admin-border)" }}>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 1.5 }}>
            شماره‌هایی که از راست‌کلیک دسته در حالت منو ثبت شده‌اند. با کالای جدید یا موجود شدن از صفر، دو
            پیامک (متن + لینک مشاهده) می‌رود.
          </Typography>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} sx={{ color: "var(--admin-accent)" }} />
            </Box>
          ) : rows.length === 0 ? (
            <Typography sx={{ color: "var(--admin-text-muted)", textAlign: "center", py: 3 }}>
              لیست خالی است.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {rows.map((row) => (
                <Box
                  key={row.id}
                  sx={{
                    ...adminSurfaceCardSx,
                    p: 1.25,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 140 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                      {row.category_name || `دسته #${row.category_id}`}
                    </Typography>
                    <Typography dir="ltr" sx={{ fontSize: 13, fontFamily: "monospace", textAlign: "left" }}>
                      {row.phone}
                    </Typography>
                    {row.note ? (
                      <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>{row.note}</Typography>
                    ) : null}
                  </Box>
                  <IconButton size="small" onClick={() => openEdit(row)} aria-label="ویرایش">
                    <EditOutlinedIcon fontSize="small" sx={{ color: "var(--admin-accent)" }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => void remove(row)} aria-label="حذف">
                    <DeleteOutlineIcon fontSize="small" sx={{ color: "var(--admin-error-soft)" }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: "none" }}>
            بستن
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(editRow)}
        onClose={() => !saving && setEditRow(null)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: "var(--admin-surface)",
            color: "var(--admin-text)",
            borderRadius: "16px",
            direction: "rtl",
          },
        }}
      >
        <DialogTitle sx={{ fontSize: 15 }}>ویرایش شماره</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 1.5 }}>
            {editRow?.category_name || ""}
          </Typography>
          <TextField
            fullWidth
            label="شماره"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
            inputProps={{ style: { direction: "ltr", textAlign: "left" } }}
            sx={{ mb: 1.5 }}
          />
          <TextField
            fullWidth
            label="یادداشت"
            value={editNote}
            onChange={(e) => setEditNote(e.target.value.slice(0, 255))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button disabled={saving} onClick={() => setEditRow(null)}>
            انصراف
          </Button>
          <Button
            variant="contained"
            disabled={saving}
            onClick={() => void saveEdit()}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
