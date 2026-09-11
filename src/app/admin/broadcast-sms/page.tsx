"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Checkbox,
  CircularProgress,
  Card,
  CardContent,
  TextField,
  IconButton,
  Chip,
  InputAdornment,
  Divider,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import ShopSmsQuotaCard from "@/app/coponent/ShopSmsQuotaCard";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";

interface Customer {
  phone: string;
  name?: string | null;
  total_purchases: number;
  total_spent: number;
}

type CustomerSort =
  | "count_desc"
  | "count_asc"
  | "amount_desc"
  | "amount_asc";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface)",
    color: "var(--admin-text)",
    fontSize: "14px",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputBase-input::placeholder": {
    color: "var(--admin-text-secondary)",
    opacity: 1,
  },
};

const formatMoney = (n: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(n));

function purchaseCount(customer: Customer): number {
  const n = Number(customer.total_purchases);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function purchaseAmount(customer: Customer): number {
  const n = Number(customer.total_spent);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function extractCustomers(res: unknown): Customer[] {
  const obj = res && typeof res === "object" ? (res as Record<string, unknown>) : null;
  const nested = obj?.data && typeof obj.data === "object" ? (obj.data as Record<string, unknown>) : null;
  const raw = obj?.customers ?? nested?.customers;
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const purchases = Number(
      row.total_purchases ?? row.purchase_count ?? row.purchases_count ?? row.orders_count ?? 0,
    );
    const spent = Number(
      row.total_spent ?? row.spent_total ?? row.total_amount ?? row.purchase_total ?? 0,
    );
    return {
      phone: typeof row.phone === "string" ? row.phone : String(row.phone ?? ""),
      name: typeof row.name === "string" ? row.name : null,
      total_purchases: Number.isFinite(purchases) ? purchases : 0,
      total_spent: Number.isFinite(spent) ? spent : 0,
    };
  });
}

function PhoneRow({
  phone,
  name,
  purchases,
  spent,
  selected,
  manual,
  onToggle,
  onRemove,
}: {
  phone: string;
  name?: string | null;
  purchases?: number;
  spent?: number;
  selected: boolean;
  manual?: boolean;
  onToggle: () => void;
  onRemove?: () => void;
}) {
  const displayName = String(name || "").trim();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        py: 0.75,
        px: 1,
        borderBottom: "1px solid var(--admin-divider)",
        bgcolor: selected ? "var(--admin-menu-hover)" : "transparent",
      }}
    >
      <Checkbox
        size="small"
        checked={selected}
        onChange={onToggle}
        sx={{
          p: 0.5,
          color: "var(--admin-accent)",
          "&.Mui-checked": { color: "var(--admin-accent)" },
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {displayName ? (
          <Typography sx={{ color: "var(--admin-text)", fontSize: "14px", fontWeight: 600 }}>
            {displayName}
          </Typography>
        ) : null}
        <Typography
          sx={{
            color: displayName ? "var(--admin-text-muted)" : "var(--admin-text)",
            fontSize: displayName ? "12px" : "14px",
            fontWeight: displayName ? 400 : 500,
            direction: "ltr",
            textAlign: "right",
          }}
        >
          {phone}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.35, flexShrink: 0 }}>
        {typeof spent === "number" ? (
          <Chip
            label={`${formatMoney(spent)} ت`}
            size="small"
            sx={{
              height: 20,
              fontSize: "10px",
              fontWeight: 700,
              bgcolor: "var(--admin-accent-soft, var(--admin-surface-alt))",
              color: "var(--admin-accent)",
              border: "1px solid var(--admin-accent-border)",
            }}
          />
        ) : null}
        {typeof purchases === "number" ? (
          <Chip
            label={`${purchases} خرید`}
            size="small"
            sx={{
              height: 20,
              fontSize: "10px",
              bgcolor: "var(--admin-surface-alt)",
              color: "var(--admin-text-muted)",
              border: "1px solid var(--admin-border)",
            }}
          />
        ) : null}
      </Box>
      {manual && (
        <Chip
          label="دستی"
          size="small"
          sx={{
            height: 20,
            fontSize: "10px",
            bgcolor: "var(--admin-info-bg)",
            color: "var(--admin-info-icon)",
            border: "1px solid var(--admin-info-border)",
          }}
        />
      )}
      {manual && onRemove && (
        <IconButton size="small" onClick={onRemove} sx={{ color: "#e53935", p: 0.5 }}>
          <DeleteIcon sx={{ fontSize: 18 }} />
        </IconButton>
      )}
    </Box>
  );
}

export default function BroadcastSMSPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [manualPhones, setManualPhones] = useState<string[]>([]);
  const [manualPhoneInput, setManualPhoneInput] = useState("");
  const [message, setMessage] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [minPurchases, setMinPurchases] = useState(0);
  const [customerSort, setCustomerSort] = useState<CustomerSort>("amount_desc");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const token = tokenCode();
        const res = await FetchWithJwtClient("GET", "/api/customer-broadcast/list", token);
        if (!res || res.hasError) {
          toast.error(getApiErrorMessage(res, "خطا در دریافت لیست مشتریان"));
          return;
        }
        setCustomers(extractCustomers(res));
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("خطا در دریافت لیست مشتریان");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const searchNorm = phoneSearch.trim().toLowerCase().replace(/\s/g, "");

  const filteredCustomers = useMemo(() => {
    const min = Number(minPurchases) || 0;
    const list = customers.filter((c) => {
      if (purchaseCount(c) < min) return false;
      if (!searchNorm) return true;
      const phone = String(c.phone || "").replace(/\s/g, "");
      const name = String(c.name || "").toLowerCase().replace(/\s/g, "");
      return phone.includes(searchNorm) || name.includes(searchNorm);
    });
    return [...list].sort((a, b) => {
      if (customerSort === "count_desc" || customerSort === "count_asc") {
        const diff = purchaseCount(a) - purchaseCount(b);
        return customerSort === "count_desc" ? -diff : diff;
      }
      const diff = purchaseAmount(a) - purchaseAmount(b);
      return customerSort === "amount_desc" ? -diff : diff;
    });
  }, [customers, searchNorm, minPurchases, customerSort]);

  const filteredManualPhones = useMemo(() => {
    if (!searchNorm) return manualPhones;
    return manualPhones.filter((p) => p.includes(searchNorm));
  }, [manualPhones, searchNorm]);

  const allFilteredSelected = useMemo(() => {
    const phones = [
      ...filteredCustomers.map((c) => c.phone).filter(Boolean),
      ...filteredManualPhones,
    ];
    return phones.length > 0 && phones.every((p) => selectedPhones.includes(p));
  }, [filteredCustomers, filteredManualPhones, selectedPhones]);

  const handleAddManualPhone = () => {
    const phone = manualPhoneInput.trim();
    if (!phone) {
      toast.error("شماره را وارد کنید");
      return;
    }
    if (!/^09\d{9}$/.test(phone)) {
      toast.error("شماره باید با 09 شروع شود و 11 رقم باشد");
      return;
    }
    if (selectedPhones.includes(phone) || manualPhones.includes(phone)) {
      toast.error("این شماره قبلاً اضافه شده");
      return;
    }
    if (customers.some((c) => c.phone === phone)) {
      toast.error("این شماره در لیست مشتریان است");
      return;
    }
    setManualPhones((prev) => [...prev, phone]);
    setSelectedPhones((prev) => [...prev, phone]);
    setManualPhoneInput("");
  };

  const handleRemoveManualPhone = (phone: string) => {
    setManualPhones((prev) => prev.filter((p) => p !== phone));
    setSelectedPhones((prev) => prev.filter((p) => p !== phone));
  };

  const handleSelectAllFiltered = (checked: boolean) => {
    const filteredCustomerPhones = filteredCustomers.map((c) => c.phone).filter(Boolean);
    if (checked) {
      setSelectedPhones((prev) => {
        const set = new Set([...prev, ...filteredCustomerPhones, ...filteredManualPhones]);
        return Array.from(set);
      });
    } else {
      const remove = new Set([...filteredCustomerPhones, ...filteredManualPhones]);
      setSelectedPhones((prev) => prev.filter((p) => !remove.has(p)));
    }
  };

  const togglePhone = (phone: string) => {
    setSelectedPhones((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone],
    );
  };

  const handleSendMessage = async () => {
    if (selectedPhones.length === 0) {
      toast.error("حداقل یک شماره انتخاب کنید");
      return;
    }
    if (!message.trim()) {
      toast.error("متن پیام را وارد کنید");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await FetchWithJwtClient("POST", "/api/customer-broadcast/message", {
        message,
        phones: selectedPhones,
      });
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ارسال پیام"));
        return;
      }
      toast.success(`پیام برای ${selectedPhones.length} شماره ارسال شد`);
      setSelectedPhones(manualPhones);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("خطا در ارسال پیام");
    } finally {
      setIsSubmitting(false);
    }
  };

  const listEmpty =
    !loading && filteredCustomers.length === 0 && filteredManualPhones.length === 0;

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <ShopSmsQuotaCard
        compact
        estimateMessage={message}
        estimateRecipientCount={selectedPhones.length}
      />

      <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
        {/* دسکتاپ RTL: اولین ستون = راست → ارسال پیام */}
        <Grid item xs={12} md={6} sx={{ display: "flex" }}>
      <Card
        sx={{
          flex: 1,
          width: "100%",
          bgcolor: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          borderRadius: "12px",
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="متن پیام..."
            sx={{ ...fieldSx, mb: 1.5 }}
          />
          <Box sx={{ display: "flex", gap: 1, mb: manualPhones.length ? 1 : 0 }}>
            <TextField
              size="small"
              fullWidth
              value={manualPhoneInput}
              onChange={(e) => setManualPhoneInput(e.target.value)}
              placeholder="09xxxxxxxxx"
              onKeyDown={(e) => e.key === "Enter" && handleAddManualPhone()}
              inputProps={{ style: { direction: "ltr", textAlign: "left" } }}
              sx={fieldSx}
            />
            <Button
              size="small"
              variant="outlined"
              onClick={handleAddManualPhone}
              sx={{
                ...adminButtonStartIconSx,
                minWidth: 88,
                borderColor: "var(--admin-border)",
                color: "var(--admin-text)",
              }}
              startIcon={<AddIcon />}
            >
              افزودن
            </Button>
          </Box>
          {manualPhones.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
              {manualPhones.map((phone) => (
                <Chip
                  key={phone}
                  size="small"
                  label={phone}
                  onDelete={() => handleRemoveManualPhone(phone)}
                  sx={{
                    direction: "ltr",
                    bgcolor: "var(--admin-surface-alt)",
                    color: "var(--admin-text)",
                  }}
                />
              ))}
            </Box>
          )}
          <Button
            fullWidth
            variant="contained"
            disabled={isSubmitting || selectedPhones.length === 0 || !message.trim()}
            onClick={handleSendMessage}
            startIcon={<SendIcon />}
            sx={{
              ...adminButtonStartIconSx,
              py: 1,
              fontWeight: 700,
              bgcolor: "var(--admin-accent)",
              color: "var(--admin-on-accent)",
              "&:hover": { bgcolor: "var(--admin-accent-hover)", color: "var(--admin-on-accent)" },
              "&.Mui-disabled": {
                bgcolor: "var(--admin-border)",
                color: "var(--admin-text-secondary)",
              },
            }}
          >
            {isSubmitting
              ? "در حال ارسال..."
              : `ارسال (${selectedPhones.length} گیرنده)`}
          </Button>
        </CardContent>
      </Card>
        </Grid>

        {/* دومین ستون = چپ → لیست شماره‌ها */}
        <Grid item xs={12} md={6} sx={{ display: "flex" }}>
      <Card
        sx={{
          flex: 1,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          bgcolor: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <TextField
            size="small"
            fullWidth
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
            placeholder="جستجو در شماره‌ها..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 20, color: "var(--admin-text-muted)" }} />
                </InputAdornment>
              ),
            }}
            inputProps={{ style: { direction: "ltr" } }}
            sx={fieldSx}
          />
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <TextField
              size="small"
              type="number"
              label="حداقل خرید"
              placeholder="مثلاً ۵"
              value={minPurchases || ""}
              onChange={(e) => {
                const n = Number(e.target.value);
                setMinPurchases(Number.isFinite(n) && n > 0 ? n : 0);
              }}
              inputProps={{ min: 0, step: 1 }}
              sx={{ ...fieldSx, flex: 1, minWidth: 0 }}
              InputLabelProps={{ sx: { color: "var(--admin-text-muted)", fontSize: "13px" } }}
            />
            <TextField
              size="small"
              select
              label="مرتب‌سازی"
              value={customerSort}
              onChange={(e) => setCustomerSort(e.target.value as CustomerSort)}
              sx={{ ...fieldSx, flex: 1, minWidth: 0 }}
              InputLabelProps={{ sx: { color: "var(--admin-text-muted)", fontSize: "13px" } }}
            >
              <MenuItem value="amount_desc">بیشترین مبلغ</MenuItem>
              <MenuItem value="amount_asc">کمترین مبلغ</MenuItem>
              <MenuItem value="count_desc">بیشترین تعداد خرید</MenuItem>
              <MenuItem value="count_asc">کمترین تعداد خرید</MenuItem>
            </TextField>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Checkbox
                size="small"
                checked={allFilteredSelected}
                disabled={
                  filteredCustomers.length === 0 && filteredManualPhones.length === 0
                }
                onChange={(e) => handleSelectAllFiltered(e.target.checked)}
                sx={{
                  p: 0.5,
                  color: "var(--admin-accent)",
                  "&.Mui-checked": { color: "var(--admin-accent)" },
                }}
              />
              <Typography sx={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>
              {searchNorm ? "انتخاب نتایج" : minPurchases > 0 ? "انتخاب فیلترشده" : "انتخاب همه"}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "12px", color: "var(--admin-text-secondary)" }}>
              {selectedPhones.length} انتخاب · {filteredCustomers.length + filteredManualPhones.length} نمایش
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ borderColor: "var(--admin-divider)" }} />

        {loading ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={28} sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : listEmpty ? (
          <Typography
            sx={{
              py: 3,
              textAlign: "center",
              color: "var(--admin-text-secondary)",
              fontSize: "14px",
            }}
          >
            {searchNorm || minPurchases > 0
              ? "مشتری‌ای با این فیلتر یافت نشد"
              : "مشتریی یافت نشد"}
          </Typography>
        ) : (
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              maxHeight: { xs: "min(52vh, 420px)", md: "calc(100vh - 300px)" },
              minHeight: { md: 280 },
            }}
          >
            {filteredManualPhones.map((phone) => (
              <PhoneRow
                key={`m-${phone}`}
                phone={phone}
                manual
                selected={selectedPhones.includes(phone)}
                onToggle={() => togglePhone(phone)}
                onRemove={() => handleRemoveManualPhone(phone)}
              />
            ))}
            {filteredCustomers.map((customer) => (
              <PhoneRow
                key={customer.phone}
                phone={customer.phone || "بدون شماره"}
                name={customer.name}
                purchases={purchaseCount(customer)}
                spent={purchaseAmount(customer)}
                selected={selectedPhones.includes(customer.phone)}
                onToggle={() => togglePhone(customer.phone)}
              />
            ))}
          </Box>
        )}
      </Card>
        </Grid>
      </Grid>

      <ToastContainer
        autoClose={3000}
        style={{ marginBottom: "76px", borderRadius: "15px" }}
        position="bottom-right"
      />
    </Box>
  );
}
