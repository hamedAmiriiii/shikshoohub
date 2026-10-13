"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import {
  formatNumber,
  parseAmount,
  type Cheque,
} from "@/app/lib/cheques";
import {
  documentCreditRemaining,
  type DocumentPaymentFields,
} from "@/app/lib/documentPayments";
import { chequeFormFieldSx } from "@/app/admin/cheques/ChequeFormSheet";

type DebtDoc = DocumentPaymentFields & {
  id: number;
  title?: string | null;
  amount?: number | string;
  date?: string | null;
  beneficiary?: { id?: number; name?: string | null; phone?: string | null } | null;
};

type DocKind = "invoice" | "expense";

type Props = {
  open: boolean;
  cheque: Cheque | null;
  onClose: () => void;
  onSuccess: () => void;
};

function extractDocs(res: unknown): DebtDoc[] {
  if (!res || typeof res !== "object") return [];
  const obj = res as { data?: unknown };
  if (Array.isArray(obj.data)) return obj.data as DebtDoc[];
  if (Array.isArray(res)) return res as DebtDoc[];
  return [];
}

function docLabel(doc: DebtDoc, kind: DocKind): string {
  const remaining = documentCreditRemaining(doc);
  const parts = [
    kind === "invoice" ? `فاکتور #${doc.id}` : `هزینه #${doc.id}`,
    doc.title?.trim() || null,
    doc.beneficiary?.name || null,
    `مانده ${formatNumber(remaining)}`,
  ].filter(Boolean);
  return parts.join(" — ");
}

export default function ChequeTransferDialog({ open, cheque, onClose, onSuccess }: Props) {
  const [kind, setKind] = useState<DocKind>("invoice");
  const [docs, setDocs] = useState<DebtDoc[]>([]);
  const [selected, setSelected] = useState<DebtDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chequeAmount = parseAmount(cheque?.amount);

  const eligibleDocs = useMemo(
    () => docs.filter((doc) => documentCreditRemaining(doc) + 0.02 >= chequeAmount),
    [docs, chequeAmount],
  );

  const loadDocs = (query = "") => {
    const token = tokenCode();
    if (!token) return;
    setLoading(true);
    const q = query.trim();
    const base =
      kind === "invoice"
        ? `/api/invoices?per_page=40&payment_status=unpaid`
        : `/api/expenses?per_page=40&payment_status=unpaid`;
    const url = q
      ? `${base}&searchFilterModel=${encodeURIComponent(JSON.stringify({ title: q }))}`
      : base;
    FetchWithJwtClient("GET", url, token)
      .then(async (unpaidRes) => {
        const partialUrl =
          kind === "invoice"
            ? `/api/invoices?per_page=40&payment_status=partial`
            : `/api/expenses?per_page=40&payment_status=partial`;
        const partialRes = await FetchWithJwtClient(
          "GET",
          q
            ? `${partialUrl}&searchFilterModel=${encodeURIComponent(JSON.stringify({ title: q }))}`
            : partialUrl,
          token,
        );
        const merged = [...extractDocs(unpaidRes), ...extractDocs(partialRes)];
        const seen = new Set<number>();
        setDocs(
          merged.filter((row) => {
            if (!row?.id || seen.has(row.id)) return false;
            seen.add(row.id);
            return documentCreditRemaining(row) > 0;
          }),
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open) return;
    setKind("invoice");
    setSelected(null);
    setNote("");
    loadDocs("");
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    loadDocs("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const handleSubmit = async () => {
    if (!cheque?.id) return;
    if (!selected?.id) {
      toast.error(kind === "invoice" ? "فاکتور خرید را انتخاب کنید" : "هزینه را انتخاب کنید");
      return;
    }
    const remaining = documentCreditRemaining(selected);
    if (chequeAmount - remaining > 0.02) {
      toast.error("مبلغ چک بیشتر از مانده نسیه سند است");
      return;
    }
    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        ...(kind === "invoice" ? { invoice_id: selected.id } : { expense_id: selected.id }),
      };
      if (note.trim()) body.note = note.trim();
      if (selected.beneficiary?.id) body.beneficiary_id = selected.beneficiary.id;

      const res = await FetchWithJwtClient("POST", `/api/cheques/${cheque.id}/transfer`, body);
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ظهرنویسی چک"));
        return;
      }
      toast.success(typeof res.message === "string" ? res.message : "چک ظهرنویسی شد");
      onClose();
      onSuccess();
    } catch {
      toast.error("خطا در ظهرنویسی چک");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: "var(--admin-surface)",
          borderRadius: "16px",
          direction: "rtl",
          border: "1px solid var(--admin-border)",
        },
      }}
    >
      <DialogTitle sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 15, textAlign: "center" }}>
        ظهرنویسی چک دریافتی
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: "12px !important" }}>
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, textAlign: "center" }}>
          چک شماره {cheque?.cheque_number || "—"} به مبلغ {formatNumber(chequeAmount)} تومان بدون برداشت از
          صندوق، بابت بدهی نفر دیگر تسویه می‌شود.
        </Typography>

        <RadioGroup
          row
          value={kind}
          onChange={(e) => setKind(e.target.value as DocKind)}
          sx={{ justifyContent: "center", gap: 1 }}
        >
          <FormControlLabel
            value="invoice"
            control={<Radio size="small" sx={{ color: "var(--admin-accent)", "&.Mui-checked": { color: "var(--admin-accent)" } }} />}
            label="فاکتور خرید"
            sx={{ color: "var(--admin-text)", m: 0, "& .MuiFormControlLabel-label": { fontSize: 12 } }}
          />
          <FormControlLabel
            value="expense"
            control={<Radio size="small" sx={{ color: "var(--admin-accent)", "&.Mui-checked": { color: "var(--admin-accent)" } }} />}
            label="هزینه نسیه"
            sx={{ color: "var(--admin-text)", m: 0, "& .MuiFormControlLabel-label": { fontSize: 12 } }}
          />
        </RadioGroup>

        <Autocomplete
          size="small"
          options={eligibleDocs}
          loading={loading}
          value={selected}
          onOpen={() => {
            if (docs.length === 0) loadDocs("");
          }}
          onInputChange={(_e, query, reason) => {
            if (reason !== "input") return;
            if (searchTimer.current) clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => loadDocs(query), 280);
          }}
          onChange={(_e, next) => setSelected(next)}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          getOptionLabel={(doc) => docLabel(doc, kind)}
          noOptionsText={loading ? "در حال جستجو..." : "سند نسیه‌ای با مانده کافی پیدا نشد"}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label={kind === "invoice" ? "فاکتور خرید (نسیه)" : "هزینه (نسیه)"}
              sx={chequeFormFieldSx}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={14} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <TextField
          size="small"
          label="یادداشت (اختیاری)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={chequeFormFieldSx}
        />

        {selected ? (
          <Box sx={{ p: 1, borderRadius: "10px", bgcolor: "var(--admin-surface-alt)" }}>
            <Typography sx={{ fontSize: 12, color: "var(--admin-text)" }}>
              مانده نسیه: {formatNumber(documentCreditRemaining(selected))} تومان
            </Typography>
            <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", mt: 0.3 }}>
              بعد از ظهرنویسی، چک از لیست وصول شما خارج می‌شود و صندوق تغییر نمی‌کند.
            </Typography>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", gap: 1, pb: 2 }}>
        <Button size="small" disabled={saving} onClick={onClose} sx={{ color: "var(--admin-text)" }}>
          انصراف
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={saving || !selected}
          onClick={() => void handleSubmit()}
          sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          تایید ظهرنویسی
        </Button>
      </DialogActions>
    </Dialog>
  );
}
