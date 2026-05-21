"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  GlobalStyles,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EventIcon from "@mui/icons-material/Event";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import {
  formatAccessEndDate,
  gregorianApiDateFromDateObject,
  parseAccessEndToDateObject,
} from "@/app/lib/shopAccess";
import { toast } from "react-toastify";

export interface ShopSmsQuotaRow {
  atelier_id?: number;
  id?: number;
  shop_name?: string;
  name?: string;
  shop_code?: string;
  phone?: string;
  balance?: number;
  shop_sms_quota?: number;
  products_count?: number;
  shop_access_starts_at?: string;
  shop_access_ends_at?: string;
  shop_access_active?: boolean;
  shop_access_days_remaining?: number;
  shop_access_suspended?: boolean;
}

function getShopId(item: ShopSmsQuotaRow): number | null {
  const id = item.atelier_id ?? item.id;
  return id != null ? Number(id) : null;
}

function getBalance(item: ShopSmsQuotaRow): number {
  if (typeof item.balance === "number") return item.balance;
  if (typeof item.shop_sms_quota === "number") return item.shop_sms_quota;
  return 0;
}

function getShopName(item: ShopSmsQuotaRow): string {
  return item.shop_name || item.name || "";
}

/** بالاتر از MUI Dialog (۱۳۰۰) */
const DATE_PICKER_Z_INDEX = 2000;

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "var(--admin-text)",
    backgroundColor: "var(--admin-surface-alt)",
    "& fieldset": { borderColor: "#505669" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
} as const;

interface Props {
  item: ShopSmsQuotaRow;
  onSuccess?: () => void;
  variant?: "row" | "card";
}

export default function ShopSmsQuotaActions({ item, onSuccess, variant = "row" }: Props) {
  const shopId = getShopId(item);
  const shopLabel = getShopName(item) || (shopId != null ? `فروشگاه #${shopId}` : "فروشگاه");

  const [editOpen, setEditOpen] = useState(false);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [balanceValue, setBalanceValue] = useState(String(getBalance(item)));
  const [chargeValue, setChargeValue] = useState("");
  const [accessEndDate, setAccessEndDate] = useState<DateObject | null>(() =>
    parseAccessEndToDateObject(item.shop_access_ends_at),
  );
  const [saving, setSaving] = useState(false);

  const putShop = async (body: Record<string, unknown>, successMsg: string) => {
    if (!shopId) {
      toast.error("شناسه فروشگاه نامعتبر است");
      return false;
    }
    setSaving(true);
    try {
      const res = await FetchWithJwtClient("PUT", `/api/admin/shops/${shopId}`, body);
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ذخیره"));
        return false;
      }
      toast.success(successMsg);
      onSuccess?.();
      return true;
    } finally {
      setSaving(false);
    }
  };

  const handleSetBalance = async () => {
    const balance = parseInt(balanceValue.replace(/\D/g, ""), 10);
    if (Number.isNaN(balance) || balance < 0) {
      toast.error("موجودی باید عدد صفر یا بیشتر باشد");
      return;
    }
    const ok = await putShop({ shop_sms_quota: balance }, "موجودی پیامک به‌روزرسانی شد");
    if (ok) setEditOpen(false);
  };

  const handleCharge = async () => {
    const amount = parseInt(chargeValue.replace(/\D/g, ""), 10);
    if (!amount || amount <= 0) {
      toast.error("مقدار شارژ باید عدد مثبت باشد");
      return;
    }
    if (!shopId) {
      toast.error("شناسه فروشگاه نامعتبر است");
      return;
    }

    setSaving(true);
    try {
      const res = await FetchWithJwtClient(
        "POST",
        `/api/admin/shop-sms-quota/${shopId}/charge`,
        { amount },
      );
      if (!res || res.hasError) {
        const fallback = await FetchWithJwtClient("PUT", `/api/admin/shops/${shopId}`, {
          shop_sms_quota: getBalance(item) + amount,
        });
        if (!fallback || fallback.hasError) {
          toast.error(getApiErrorMessage(res, "خطا در شارژ"));
          return;
        }
      }
      toast.success(`${amount.toLocaleString("fa-IR")} واحد شارژ شد`);
      setChargeOpen(false);
      setChargeValue("");
      onSuccess?.();
    } finally {
      setSaving(false);
    }
  };

  const handleSetAccessEnd = async () => {
    const apiDate = gregorianApiDateFromDateObject(accessEndDate);
    if (!apiDate) {
      toast.error("تاریخ پایان اعتبار را انتخاب کنید");
      return;
    }
    const ok = await putShop(
      { shop_access_ends_at: apiDate },
      "تاریخ اعتبار کاربری به‌روزرسانی شد",
    );
    if (ok) setAccessOpen(false);
  };

  const openEdit = () => {
    setBalanceValue(String(getBalance(item)));
    setEditOpen(true);
  };

  const openAccess = () => {
    setAccessEndDate(parseAccessEndToDateObject(item.shop_access_ends_at));
    setAccessOpen(true);
  };

  const isCard = variant === "card";
  const btnSx = isCard
    ? { flex: 1, py: 1, minWidth: "120px", fontSize: "12px" }
    : {
        width: "100%",
        px: 1,
        py: 0.6,
        fontSize: "11px",
        lineHeight: 1.3,
        justifyContent: "center",
        whiteSpace: "nowrap",
      };

  return (
    <>
      {accessOpen && (
        <GlobalStyles
          styles={{
            ".rmdp-portal": { zIndex: `${DATE_PICKER_Z_INDEX} !important` },
            "body > .rmdp-wrapper": { zIndex: `${DATE_PICKER_Z_INDEX} !important` },
            ".rmdp-calendar": { zIndex: `${DATE_PICKER_Z_INDEX} !important` },
          }}
        />
      )}
      <Box
        sx={{
          display: "flex",
          flexDirection: isCard ? "row" : "column",
          gap: isCard ? 1 : 0.5,
          flexWrap: isCard ? "wrap" : "nowrap",
          justifyContent: isCard ? "stretch" : "center",
          alignItems: "stretch",
          width: "100%",
          maxWidth: isCard ? "none" : 140,
          mx: isCard ? 0 : "auto",
        }}
      >
        <Button
          size="small"
          variant="outlined"
          startIcon={isCard ? <EventIcon /> : undefined}
          onClick={openAccess}
          sx={{ ...btnSx, borderColor: "#2196f3", color: "#2196f3" }}
        >
          {isCard ? "تاریخ اعتبار" : "اعتبار"}
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={isCard ? <EditIcon /> : undefined}
          onClick={openEdit}
          sx={{ ...btnSx, borderColor: "var(--admin-accent)", color: "var(--admin-accent)" }}
        >
          {isCard ? "تنظیم موجودی" : "موجودی"}
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={isCard ? <AddCircleOutlineIcon /> : undefined}
          onClick={() => setChargeOpen(true)}
          sx={{ ...btnSx, backgroundColor: "#ff9800", "&:hover": { backgroundColor: "#f57c00" } }}
        >
          شارژ
        </Button>
      </Box>

      <Dialog
        open={accessOpen}
        onClose={() => !saving && setAccessOpen(false)}
        disableEnforceFocus
        PaperProps={{
          sx: {
            backgroundColor: "var(--admin-surface)",
            borderRadius: "16px",
            overflow: "visible",
          },
        }}
        slotProps={{
          root: { sx: { zIndex: 1300 } },
        }}
      >
        <DialogTitle sx={{ color: "var(--admin-text)" }}>تاریخ اعتبار کاربری — {shopLabel}</DialogTitle>
        <DialogContent sx={{ overflow: "visible" }}>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 2 }}>
            پایان فعلی: {formatAccessEndDate(item.shop_access_ends_at)}
            {item.shop_access_days_remaining != null &&
              ` (${item.shop_access_days_remaining.toLocaleString("fa-IR")} روز مانده)`}
          </Typography>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "13px", mb: 1 }}>
            تاریخ پایان اعتبار (شمسی)
          </Typography>
          <Box
            sx={{
              width: "100%",
              position: "relative",
              zIndex: 1,
              "& .rmdp-wrapper": { width: "100%" },
              "& .rmdp-portal": { zIndex: `${DATE_PICKER_Z_INDEX} !important` },
              "& .rmdp-calendar": { zIndex: DATE_PICKER_Z_INDEX },
              "& .rmdp-input": {
                width: "100%",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "var(--admin-surface-alt)",
                border: "1px solid var(--admin-border)",
                color: "var(--admin-text)",
                fontSize: "15px",
                padding: "8px 12px",
                boxSizing: "border-box",
              },
              "& .rmdp-input:focus": {
                borderColor: "var(--admin-accent)",
                outline: "none",
              },
            }}
          >
            <DatePicker
              value={accessEndDate}
              onChange={(value) =>
                setAccessEndDate(
                  value && !Array.isArray(value) ? (value as DateObject) : null,
                )
              }
              calendar={persian}
              locale={persian_fa}
              format="YYYY/MM/DD"
              calendarPosition="bottom-center"
              zIndex={DATE_PICKER_Z_INDEX}
              containerStyle={{ width: "100%", zIndex: DATE_PICKER_Z_INDEX }}
              portal
              fixMainPosition
              placeholder="انتخاب تاریخ"
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "var(--admin-surface-alt)",
                color: "var(--admin-text)",
              }}
              className="rmdp-mobile"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccessOpen(false)} disabled={saving} sx={{ color: "var(--admin-text-muted)" }}>
            انصراف
          </Button>
          <Button
            onClick={handleSetAccessEnd}
            disabled={saving}
            variant="contained"
            sx={{ backgroundColor: "#2196f3" }}
          >
            {saving ? "..." : "ذخیره"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={() => !saving && setEditOpen(false)}
        PaperProps={{ sx: { backgroundColor: "var(--admin-surface)", borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ color: "var(--admin-text)" }}>تنظیم موجودی پیامک — {shopLabel}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 2 }}>
            مقدار نهایی واحد پیامک (جایگزین موجودی فعلی می‌شود)
          </Typography>
          <TextField
            fullWidth
            label="موجودی (واحد پیامک)"
            value={balanceValue}
            onChange={(e) => setBalanceValue(e.target.value.replace(/\D/g, ""))}
            sx={inputSx}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={saving} sx={{ color: "var(--admin-text-muted)" }}>
            انصراف
          </Button>
          <Button
            onClick={handleSetBalance}
            disabled={saving}
            variant="contained"
            sx={{ backgroundColor: "var(--admin-accent)" }}
          >
            {saving ? "..." : "ذخیره"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={chargeOpen}
        onClose={() => !saving && setChargeOpen(false)}
        PaperProps={{ sx: { backgroundColor: "var(--admin-surface)", borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ color: "var(--admin-text)" }}>شارژ پیامک — {shopLabel}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 2 }}>
            موجودی فعلی: {getBalance(item).toLocaleString("fa-IR")} واحد — مقدار واردشده به موجودی اضافه می‌شود.
          </Typography>
          <TextField
            fullWidth
            label="تعداد واحد برای شارژ"
            value={chargeValue}
            onChange={(e) => setChargeValue(e.target.value.replace(/\D/g, ""))}
            sx={inputSx}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChargeOpen(false)} disabled={saving} sx={{ color: "var(--admin-text-muted)" }}>
            انصراف
          </Button>
          <Button
            onClick={handleCharge}
            disabled={saving}
            variant="contained"
            sx={{ backgroundColor: "#ff9800" }}
          >
            {saving ? "..." : "شارژ"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function AccessStatusChip({ item }: { item: ShopSmsQuotaRow }) {
  if (item.shop_access_suspended) {
    return <Chip size="small" label="تعلیق" sx={{ bgcolor: "rgba(244,67,54,0.2)", color: "#f44336" }} />;
  }
  if (item.shop_access_active === false || (item.shop_access_days_remaining ?? 1) <= 0) {
    return <Chip size="small" label="منقضی" sx={{ bgcolor: "rgba(244,67,54,0.15)", color: "#ef5350" }} />;
  }
  return (
    <Chip
      size="small"
      label="فعال"
      sx={{ bgcolor: "rgba(120,181,104,0.2)", color: "var(--admin-accent)" }}
    />
  );
}

export function ShopSmsQuotaMobileCard({
  data,
  onSuccess,
}: {
  data: ShopSmsQuotaRow;
  onSuccess?: () => void;
}) {
  const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

  return (
    <Box
      sx={{
        p: 2,
        mb: 2,
        borderRadius: "16px",
        backgroundColor: "var(--admin-surface)",
        border: "1px solid var(--admin-border)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
        <Typography sx={{ color: "var(--admin-text)", fontWeight: 700 }}>
          {getShopName(data) || "—"}
        </Typography>
        <AccessStatusChip item={data} />
      </Box>
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "13px", mb: 0.5 }}>
        شناسه: {data.atelier_id ?? data.id ?? "—"} | تلفن: {data.phone || "—"}
      </Typography>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 0.5 }}>
        اعتبار تا {formatAccessEndDate(data.shop_access_ends_at)}
        {data.shop_access_days_remaining != null &&
          ` · ${data.shop_access_days_remaining.toLocaleString("fa-IR")} روز`}
      </Typography>
      <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: "18px", mb: 1.5 }}>
        {formatNumber(getBalance(data))} واحد پیامک
      </Typography>
      <ShopSmsQuotaActions item={data} onSuccess={onSuccess} variant="card" />
    </Box>
  );
}

export { AccessStatusChip };
