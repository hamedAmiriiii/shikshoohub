"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { toast } from "react-toastify";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { formatAmountInput, formatAmountNumber, parseAmountInput } from "@/app/lib/amountInput";
import {
  isPieceMaterial,
  materialPriceLabel,
  materialQtyFieldLabel,
  materialUnitLabel,
  type RawMaterial,
} from "@/app/lib/productionCosting";
import InvoiceLinkFields, {
  buildInvoiceLinkPayload,
  emptyInvoiceLinkState,
  validateInvoiceLink,
  type InvoiceLinkState,
} from "@/app/admin/production/InvoiceLinkFields";
import { purchaseVatPayable, readPurchaseVatEnabledCache } from "@/app/lib/purchaseVat";

type LineDraft = {
  key: string;
  material: RawMaterial | null;
  qty: string;
  price: string;
};

type Props = {
  open: boolean;
  materials: RawMaterial[];
  onClose: () => void;
  onSuccess: () => void;
};

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

function newLine(): LineDraft {
  return {
    key: `line_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    material: null,
    qty: "",
    price: "",
  };
}

function lineTotal(line: LineDraft): number {
  const qty = parseAmountInput(line.qty);
  const price = parseAmountInput(line.price);
  if (qty <= 0 || price < 0) return 0;
  return Math.round(qty * price);
}

export default function BulkRawMaterialInvoiceDialog({
  open,
  materials,
  onClose,
  onSuccess,
}: Props) {
  const [lines, setLines] = useState<LineDraft[]>([newLine()]);
  const [invoiceLink, setInvoiceLink] = useState<InvoiceLinkState>(() => ({
    ...emptyInvoiceLinkState(),
    createInvoice: true,
    mode: "new",
    invoiceTitle: "خرید مواد اولیه",
  }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLines([newLine()]);
    setInvoiceLink({
      ...emptyInvoiceLinkState(),
      createInvoice: true,
      mode: "new",
      invoiceTitle: "خرید مواد اولیه",
    });
  }, [open]);

  const baseTotal = useMemo(() => lines.reduce((sum, line) => sum + lineTotal(line), 0), [lines]);
  const vatEnabled = readPurchaseVatEnabledCache();
  const payable = purchaseVatPayable(baseTotal, invoiceLink.vat);

  const updateLine = (key: string, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const handleSubmit = async () => {
    const prepared = lines
      .map((line) => ({
        material: line.material,
        qty: parseAmountInput(line.qty),
        price: parseAmountInput(line.price),
        total: lineTotal(line),
      }))
      .filter((row) => row.material);

    if (prepared.length === 0) {
      toast.error("حداقل یک ماده اولیه انتخاب کنید");
      return;
    }

    for (const row of prepared) {
      if (!row.material) continue;
      if (row.qty <= 0 || row.price < 0) {
        toast.error(`مقدار و ${materialPriceLabel(row.material)} را برای «${row.material.name}» وارد کنید`);
        return;
      }
      if (isPieceMaterial(row.material) && !Number.isInteger(row.qty)) {
        toast.error(`تعداد «${row.material.name}» باید عدد صحیح باشد`);
        return;
      }
    }

    if (baseTotal <= 0) {
      toast.error("جمع مبلغ فاکتور باید بیشتر از صفر باشد");
      return;
    }

    const invoiceState = { ...invoiceLink, createInvoice: true, mode: "new" as const };
    const invoiceError = validateInvoiceLink(invoiceState, baseTotal);
    if (invoiceError) {
      toast.error(invoiceError);
      return;
    }

    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      return;
    }

    setSaving(true);
    try {
      const res = await FetchWithJwtClient(
        "POST",
        "/api/raw-materials/bulk-purchase",
        token,
        {},
        {
          body: JSON.stringify({
            lines: prepared.map((row) => ({
              raw_material_id: row.material!.id,
              quantity_kg: row.qty,
              price_per_kg: row.price,
            })),
            ...buildInvoiceLinkPayload(invoiceState, baseTotal),
          }),
        },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ثبت فاکتور جمعی ناموفق بود"));
        return;
      }
      toast.success(res?.message || "فاکتور جمعی و موجودی ثبت شد");
      onClose();
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700, color: "var(--admin-text)", fontSize: 16 }}>
        فاکتور جمعی مواد اولیه
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
        <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
          مواد را یکی‌یکی انتخاب کنید، مقدار و مبلغ واحد را بزنید؛ همه با یک فاکتور به موجودی اضافه می‌شوند.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {lines.map((line, index) => {
            const total = lineTotal(line);
            return (
              <Box
                key={line.key}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1.4fr) 1fr 1fr auto auto" },
                  gap: 1,
                  alignItems: "start",
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid var(--admin-border)",
                  bgcolor: "var(--admin-surface)",
                }}
              >
                <Autocomplete
                  size="small"
                  options={materials}
                  value={line.material}
                  onChange={(_e, next) => updateLine(line.key, { material: next })}
                  getOptionLabel={(option) =>
                    `${option.name}${option.unit_type ? ` (${materialUnitLabel(option)})` : ""}`
                  }
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  noOptionsText="ماده اولیه‌ای نیست"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={`ماده ${formatAmountNumber(index + 1)}`}
                      sx={fieldSx}
                    />
                  )}
                />
                <TextField
                  size="small"
                  label={line.material ? materialQtyFieldLabel(line.material) : "مقدار"}
                  value={line.qty}
                  onChange={(e) => updateLine(line.key, { qty: formatAmountInput(e.target.value) })}
                  inputMode="decimal"
                  sx={fieldSx}
                />
                <TextField
                  size="small"
                  label={line.material ? materialPriceLabel(line.material) : "قیمت واحد"}
                  value={line.price}
                  onChange={(e) => updateLine(line.key, { price: formatAmountInput(e.target.value) })}
                  inputMode="numeric"
                  sx={fieldSx}
                />
                <Box sx={{ minWidth: 88, pt: 1 }}>
                  <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>جمع</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-accent)" }}>
                    {formatAmountNumber(total)}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  disabled={lines.length <= 1}
                  onClick={() => setLines((prev) => prev.filter((row) => row.key !== line.key))}
                  sx={{ color: "var(--admin-error)", mt: 0.5 }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          })}
        </Box>

        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setLines((prev) => [...prev, newLine()])}
          sx={{ alignSelf: "flex-start", color: "var(--admin-accent)" }}
        >
          افزودن ماده
        </Button>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            p: 1.25,
            borderRadius: 2,
            bgcolor: "var(--admin-surface-alt)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)" }}>
            مبلغ پایه: {formatAmountNumber(baseTotal)} تومان
          </Typography>
          {vatEnabled ? (
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-accent)" }}>
              قابل پرداخت (با ارزش افزوده): {formatAmountNumber(payable)} تومان
            </Typography>
          ) : null}
        </Box>

        <InvoiceLinkFields
          createOnly
          value={invoiceLink}
          onChange={(next) => setInvoiceLink({ ...next, createInvoice: true, mode: "new" })}
          lotTotal={baseTotal}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving}>
          انصراف
        </Button>
        <Button
          variant="contained"
          disabled={saving || baseTotal <= 0}
          onClick={handleSubmit}
          sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
        >
          {saving ? "در حال ثبت..." : "ثبت فاکتور و موجودی"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
