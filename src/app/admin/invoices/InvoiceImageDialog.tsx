"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { toast } from "react-toastify";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminButtonStartIconSx } from "@/app/admin/theme/adminTheme";
import type { InvoiceRecord } from "@/app/admin/invoices/InvoiceDetailsDialog";

function resolveImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const base = (process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoplus.ir").replace(
    /\/$/,
    "",
  );
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}

export function getInvoiceImageUrl(invoice?: InvoiceRecord | null): string | null {
  if (!invoice) return null;
  const rec = invoice as InvoiceRecord & { image?: string | null; photo_url?: string | null; photo?: string | null };
  return resolveImageUrl(rec.image_url || rec.image || rec.photo_url || rec.photo || null);
}

function extractInvoice(res: any, fallback: InvoiceRecord): InvoiceRecord {
  if (!res || res.hasError) return fallback;
  const candidate = res.data ?? res.invoice ?? res;
  if (Array.isArray(candidate)) {
    const found = candidate.find((row) => row && row.id === fallback.id);
    return found ? { ...fallback, ...found } : fallback;
  }
  if (candidate && typeof candidate === "object" && candidate.id != null) {
    return { ...fallback, ...candidate };
  }
  return fallback;
}

type Props = {
  open: boolean;
  invoice: InvoiceRecord | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function InvoiceImageDialog({ open, invoice, onClose, onSaved }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoOpenedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !invoice) return;

    let cancelled = false;
    autoOpenedRef.current = false;

    const load = async () => {
      setLoading(true);
      setImageBase64(null);

      let full = invoice;
      const token = tokenCode();
      if (token) {
        const res = await FetchWithJwtClient("GET", `/api/invoices/${invoice.id}`, token);
        if (!cancelled) full = extractInvoice(res, invoice);
      }

      if (cancelled) return;
      const preview = getInvoiceImageUrl(full);
      setImagePreview(preview);
      setLoading(false);

      if (!preview && !autoOpenedRef.current) {
        autoOpenedRef.current = true;
        window.setTimeout(() => fileInputRef.current?.click(), 200);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, invoice]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایل‌های تصویری مجاز هستند");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم فایل باید کمتر از ۵ مگابایت باشد");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      if (base64String) {
        setImagePreview(base64String);
        setImageBase64(base64String);
      }
    };
    reader.onerror = () => toast.error("خطا در خواندن فایل");
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const uploadImage = async (base64: string) => {
    if (!invoice) return false;
    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      return false;
    }
    let res = await FetchWithJwtClient("PUT", `/api/invoices/${invoice.id}`, {
      image_base64: base64,
      image: base64,
    });
    if (res?.hasError) {
      res = await FetchWithJwtClient("POST", `/api/invoices/${invoice.id}/image`, {
        image_base64: base64,
        image: base64,
      });
    }
    if (res?.hasError) {
      toast.error(getApiErrorMessage(res, "خطا در آپلود عکس فاکتور"));
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!invoice) return;
    if (!imageBase64) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const ok = await uploadImage(imageBase64);
      if (!ok) return;
      toast.success("عکس فاکتور ذخیره شد");
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      return;
    }
    setSaving(true);
    try {
      const res = await FetchWithJwtClient("DELETE", `/api/invoices/${invoice.id}/image`, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در حذف عکس فاکتور"));
        return;
      }
      setImagePreview(null);
      setImageBase64(null);
      toast.success("عکس فاکتور حذف شد");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const hasExistingImage = Boolean(imagePreview) && !imageBase64;

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "var(--admin-surface)",
          borderRadius: "16px",
          border: "1px solid rgba(55, 84, 165, 0.3)",
        },
      }}
    >
      <DialogTitle sx={{ color: "var(--admin-text)", fontWeight: "700", fontSize: 15, py: 1.5 }}>
        عکس فاکتور{invoice?.title ? ` — ${invoice.title}` : ""}
      </DialogTitle>
      <DialogContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleImageUpload}
        />
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
            {imagePreview ? (
              <>
                <Box
                  component="img"
                  src={imagePreview}
                  alt="عکس فاکتور"
                  sx={{
                    width: "100%",
                    maxHeight: 320,
                    objectFit: "contain",
                    borderRadius: "8px",
                    backgroundColor: "var(--admin-surface-alt)",
                  }}
                />
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCameraIcon />}
                    disabled={saving}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      ...adminButtonStartIconSx,
                      color: "var(--admin-text)",
                      borderColor: "var(--admin-border)",
                    }}
                  >
                    ویرایش عکس
                  </Button>
                  {hasExistingImage ? (
                    <Button
                      startIcon={<DeleteOutlineIcon />}
                      disabled={saving}
                      onClick={handleDelete}
                      sx={{ color: "#ff6b6b" }}
                    >
                      حذف عکس
                    </Button>
                  ) : null}
                </Box>
              </>
            ) : (
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: "1px dashed var(--admin-border)",
                  borderRadius: "12px",
                  p: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: "var(--admin-surface-alt)",
                  "&:hover": { borderColor: "var(--admin-accent)" },
                }}
              >
                <PhotoCameraIcon sx={{ color: "var(--admin-accent)", fontSize: 36, mb: 1 }} />
                <Typography sx={{ color: "var(--admin-text)", fontWeight: 600, mb: 0.5 }}>
                  آپلود عکس فاکتور
                </Typography>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                  برای انتخاب تصویر کلیک کنید — حداکثر ۵ مگابایت
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ padding: "16px 24px" }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: "var(--admin-text-muted)" }}>
          بستن
        </Button>
        {imageBase64 ? (
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            sx={{
              backgroundColor: "var(--admin-accent)",
              "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
            }}
          >
            {saving ? "در حال ذخیره..." : "ذخیره عکس"}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
