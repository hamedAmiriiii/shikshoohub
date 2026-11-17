"use client";

import { memo, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { toast } from "react-toastify";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { formatAmountInput } from "@/app/lib/amountInput";
import {
  asRawMaterial,
  materialPriceLabelFromCode,
  materialQtyFieldLabelFromCode,
  parseAmount,
  parseRawMaterialUnit,
  type RawMaterial,
  type RawMaterialUnit,
} from "@/app/lib/productionCosting";
import InvoiceLinkFields, {
  buildInvoiceLinkPayload,
  emptyInvoiceLinkState,
  purchaseInvoiceTitle,
  validateInvoiceLink,
  type InvoiceLinkState,
} from "@/app/admin/production/InvoiceLinkFields";

const LAYER_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
/** بالای دیالوگ کالای تولیدی (≈۱۳۰۰) و زیر date picker فاکتور (۱۶۰۰) */
const DIALOG_Z = 1400;

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontSize: 12,
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": {
    color: "var(--admin-text-muted)",
    fontSize: 12,
    right: 14,
    left: "auto",
    transformOrigin: "top right",
    textAlign: "right",
  },
  "& .MuiInputLabel-shrink": {
    transform: "translate(-14px, -9px) scale(0.75)",
  },
  "& .MuiInputBase-input": {
    py: "6px",
    fontSize: 12,
    textAlign: "right",
    direction: "rtl",
  },
} as const;

const dialogGridSx = {
  display: "grid",
  gap: 1.25,
  pt: 0.5,
  direction: "rtl",
} as const;

const checkerSx = {
  backgroundImage:
    "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
  backgroundSize: "12px 12px",
  backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
  backgroundColor: "#fff",
} as const;

function layerImageSrc(url?: string | null): string | null {
  if (!url) return null;
  return url;
}

type Props = {
  open: boolean;
  editingMaterial?: RawMaterial | null;
  /** وقتی از فرمول کالای تولیدی باز شود */
  assignToRecipe?: boolean;
  onClose: () => void;
  onSaved: (material: RawMaterial | null, created: boolean) => void;
};

function RawMaterialFormDialog({
  open,
  editingMaterial = null,
  assignToRecipe = false,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<RawMaterialUnit>("kg");
  const [lotQty, setLotQty] = useState("");
  const [lotPrice, setLotPrice] = useState("");
  const [invoiceLink, setInvoiceLink] = useState<InvoiceLinkState>(emptyInvoiceLinkState);
  const [layerDataUrl, setLayerDataUrl] = useState<string | null>(null);
  const [layerRemoved, setLayerRemoved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingMaterial) {
      setName(editingMaterial.name || "");
      setUnit(parseRawMaterialUnit(editingMaterial.unit_type));
      setLotQty("");
      setLotPrice("");
      setInvoiceLink(emptyInvoiceLinkState());
    } else {
      setName("");
      setUnit("kg");
      setLotQty("");
      setLotPrice("");
      setInvoiceLink(emptyInvoiceLinkState());
    }
    setLayerDataUrl(null);
    setLayerRemoved(false);
  }, [open, editingMaterial]);

  const syncInvoiceTitleFromName = (nextName: string) => {
    if (editingMaterial) return;
    setInvoiceLink((prev) => {
      const auto = purchaseInvoiceTitle(nextName);
      const prevAuto = purchaseInvoiceTitle(name);
      // فقط وقتی عنوان هنوز خودکار است عوض شود؛ ویرایش دستی کاربر حفظ می‌شود
      if (prev.invoiceTitle && prev.invoiceTitle !== prevAuto) return prev;
      return { ...prev, invoiceTitle: auto };
    });
  };

  const pickLayerFile = (file: File | undefined | null) => {
    if (!file) return;
    if (file.type !== "image/png" && file.type !== "image/webp") {
      toast.error("عکس لایه باید PNG یا WebP با پس‌زمینهٔ شفاف باشد");
      return;
    }
    if (file.size > LAYER_IMAGE_MAX_BYTES) {
      toast.error("حجم عکس لایه نباید بیشتر از ۳ مگابایت باشد");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLayerDataUrl(typeof reader.result === "string" ? reader.result : null);
      setLayerRemoved(false);
    };
    reader.readAsDataURL(file);
  };

  const syncLayerImage = async (materialId: number, token: string): Promise<boolean> => {
    if (layerDataUrl) {
      const res = await FetchWithJwtClient(
        "POST",
        `/api/raw-materials/${materialId}/layer-image`,
        token,
        {},
        { body: JSON.stringify({ image_base64: layerDataUrl }) },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ماده ذخیره شد ولی عکس لایه آپلود نشد"));
        return false;
      }
    } else if (layerRemoved && editingMaterial?.layer_image_url) {
      const res = await FetchWithJwtClient("DELETE", `/api/raw-materials/${materialId}/layer-image`, token, {});
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "حذف عکس لایه ناموفق بود"));
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("نام ماده اولیه را وارد کنید");
      return;
    }
    const token = tokenCode();
    if (!token) return;
    setSaving(true);
    try {
      if (editingMaterial) {
        const res = await FetchWithJwtClient(
          "PUT",
          `/api/raw-materials/${editingMaterial.id}`,
          token,
          {},
          { body: JSON.stringify({ name: trimmed, unit_type: unit }) },
        );
        if (res?.hasError) {
          toast.error(getApiErrorMessage(res, "ویرایش ماده اولیه ناموفق بود"));
          return;
        }
        await syncLayerImage(editingMaterial.id, token);
        toast.success("ماده اولیه به‌روز شد");
        onSaved(asRawMaterial(res) || editingMaterial, false);
        onClose();
        return;
      }

      const qty = parseAmount(lotQty);
      const price = parseAmount(lotPrice);
      if (invoiceLink.createInvoice && (qty <= 0 || price <= 0)) {
        toast.error(`برای ایجاد فاکتور، مقدار و ${materialPriceLabelFromCode(unit)} را وارد کنید`);
        return;
      }
      if (unit === "piece" && qty > 0 && !Number.isInteger(qty)) {
        toast.error("تعداد باید عدد صحیح باشد");
        return;
      }
      // عنوان فاکتور را اگر خالی مانده از نام بساز
      const linkState: InvoiceLinkState = {
        ...invoiceLink,
        invoiceTitle: invoiceLink.invoiceTitle.trim() || purchaseInvoiceTitle(trimmed),
      };
      const invoiceError = validateInvoiceLink(linkState, qty * price);
      if (invoiceError) {
        toast.error(invoiceError);
        return;
      }

      let created: RawMaterial | null = null;
      if (linkState.createInvoice) {
        const res = await FetchWithJwtClient(
          "POST",
          "/api/raw-materials",
          token,
          {},
          {
            body: JSON.stringify({
              name: trimmed,
              unit_type: unit,
              quantity_kg: qty,
              price_per_kg: price,
              ...buildInvoiceLinkPayload(linkState, qty * price),
            }),
          },
        );
        if (res?.hasError) {
          toast.error(getApiErrorMessage(res, "ثبت ماده اولیه ناموفق بود"));
          return;
        }
        created = asRawMaterial(res);
      } else {
        const res = await FetchWithJwtClient(
          "POST",
          "/api/raw-materials",
          token,
          {},
          { body: JSON.stringify({ name: trimmed, unit_type: unit }) },
        );
        if (res?.hasError) {
          toast.error(getApiErrorMessage(res, "ثبت ماده اولیه ناموفق بود"));
          return;
        }
        created = asRawMaterial(res);
        if (created && qty > 0 && price > 0) {
          const lotRes = await FetchWithJwtClient(
            "POST",
            `/api/raw-materials/${created.id}/lots`,
            token,
            {},
            { body: JSON.stringify({ quantity_kg: qty, price_per_kg: price }) },
          );
          if (lotRes?.hasError) {
            toast.error(getApiErrorMessage(lotRes, "ماده ثبت شد ولی خرید انبار ذخیره نشد"));
            if (created) await syncLayerImage(created.id, token);
            onSaved(created, true);
            onClose();
            return;
          }
        }
      }

      if (created) await syncLayerImage(created.id, token);
      toast.success(assignToRecipe ? "ماده اولیه ثبت و در فرمول انتخاب شد" : "ماده اولیه ثبت شد");
      onSaved(created, true);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const existingLayer = layerRemoved ? null : layerImageSrc(editingMaterial?.layer_image_url);
  const shownLayer = layerDataUrl || existingLayer;

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      fullWidth
      maxWidth="sm"
      keepMounted={false}
      sx={{ zIndex: DIALOG_Z }}
      slotProps={{
        backdrop: { sx: { zIndex: DIALOG_Z } },
      }}
    >
      <DialogTitle sx={{ fontSize: 15, fontWeight: 700, py: 1, direction: "rtl" }}>
        {editingMaterial
          ? "ویرایش ماده اولیه"
          : assignToRecipe
            ? "ثبت ماده اولیه برای فرمول"
            : "ماده اولیه جدید"}
      </DialogTitle>
      <DialogContent sx={dialogGridSx}>
        <TextField
          autoFocus
          size="small"
          label="نام"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => syncInvoiceTitleFromName(name)}
          sx={fieldSx}
        />
        <TextField
          select
          size="small"
          label="واحد"
          value={unit}
          onChange={(e) => {
            const next = parseRawMaterialUnit(e.target.value);
            setUnit(next);
            if (next === "piece") setLotQty((prev) => String(Math.trunc(parseAmount(prev)) || ""));
          }}
          sx={fieldSx}
          SelectProps={{
            MenuProps: {
              // داخل خود دیالوگ رندر شود تا زیر لایهٔ دیالوگ نماند
              disablePortal: true,
            },
          }}
        >
          <MenuItem value="kg">کیلویی</MenuItem>
          <MenuItem value="liter">لیتری</MenuItem>
          <MenuItem value="piece">تعدادی (عدد)</MenuItem>
        </TextField>
        {editingMaterial ? (
          <Typography sx={{ gridColumn: "1 / -1", fontSize: 11, color: "var(--admin-text-muted)", textAlign: "right", lineHeight: 1.7 }}>
            اگر موجودی هنوز مصرف نشده باشد، واحد عوض می‌شود و همان مقدار با واحد جدید خوانده می‌شود.
            اگر بخشی مصرف شده یا در فرمول کالا استفاده شده، تغییر واحد ممکن نیست.
          </Typography>
        ) : null}
        {!editingMaterial ? (
          <>
            <TextField
              size="small"
              label={materialQtyFieldLabelFromCode(unit)}
              value={lotQty}
              onChange={(e) => setLotQty(e.target.value)}
              inputMode={unit === "piece" ? "numeric" : "decimal"}
              sx={fieldSx}
            />
            <TextField
              size="small"
              label={materialPriceLabelFromCode(unit)}
              value={lotPrice}
              onChange={(e) => setLotPrice(formatAmountInput(e.target.value))}
              inputMode="numeric"
              sx={fieldSx}
            />
            <Typography sx={{ gridColumn: "1 / -1", fontSize: 11, color: "var(--admin-text-muted)", textAlign: "right" }}>
              خرید اول انبار اختیاری است.
            </Typography>
            <Box sx={{ gridColumn: "1 / -1" }}>
              <InvoiceLinkFields
                value={invoiceLink}
                onChange={setInvoiceLink}
                lotTotal={parseAmount(lotQty) * parseAmount(lotPrice)}
              />
            </Box>
          </>
        ) : null}
        <Box
          sx={{
            gridColumn: "1 / -1",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1,
            borderRadius: "12px",
            border: "1px dashed var(--admin-border)",
          }}
        >
          <Box
            sx={{
              width: 84,
              height: 64,
              flexShrink: 0,
              borderRadius: "10px",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              ...checkerSx,
            }}
          >
            {shownLayer ? (
              <Box component="img" src={shownLayer} alt="" sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            ) : (
              <Typography sx={{ fontSize: 10, color: "#888" }}>بدون عکس</Typography>
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--admin-text)" }}>
              عکس لایه برای منوی سه‌بعدی
            </Typography>
            <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-muted)", lineHeight: 1.7 }}>
              PNG یا WebP با پس‌زمینهٔ شفاف. برای ساندویچ نمای کنار؛ برای پیتزا نمای بالا. حداکثر ۳ مگابایت.
            </Typography>
            <Box sx={{ display: "flex", gap: 0.8, mt: 0.6, flexWrap: "wrap" }}>
              <Button size="small" variant="outlined" component="label" startIcon={<CloudUploadIcon />} sx={{ fontSize: 11 }}>
                {shownLayer ? "تغییر عکس" : "انتخاب عکس"}
                <input
                  hidden
                  type="file"
                  accept="image/png,image/webp"
                  onChange={(e) => {
                    pickLayerFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </Button>
              {shownLayer ? (
                <Button
                  size="small"
                  color="error"
                  onClick={() => {
                    setLayerDataUrl(null);
                    setLayerRemoved(true);
                  }}
                  sx={{ fontSize: 11 }}
                >
                  حذف عکس
                </Button>
              ) : null}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 1.5, py: 1 }}>
        <Button size="small" disabled={saving} onClick={onClose}>
          انصراف
        </Button>
        <Button
          disabled={saving}
          onClick={() => void handleSave()}
          variant="contained"
          size="small"
          sx={{ backgroundColor: "var(--admin-accent)" }}
        >
          {assignToRecipe && !editingMaterial ? "ثبت و انتخاب" : "ذخیره"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default memo(RawMaterialFormDialog);
