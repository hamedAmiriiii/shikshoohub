"use client";

import React, {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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

type CustomerGroup = {
  id: number;
  name: string;
  member_count: number;
  phones: string[];
};

type CustomerSort =
  | "count_desc"
  | "count_asc"
  | "amount_desc"
  | "amount_asc";

type ListItem =
  | { kind: "manual"; phone: string }
  | {
      kind: "customer";
      phone: string;
      name?: string | null;
      purchases: number;
      spent: number;
    };

const ROW_HEIGHT = 56;
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

const PhoneRow = memo(function PhoneRow({
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
  onToggle: (phone: string) => void;
  onRemove?: (phone: string) => void;
}) {
  const displayName = String(name || "").trim();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        height: ROW_HEIGHT,
        px: 1,
        borderBottom: "1px solid var(--admin-divider)",
        bgcolor: selected ? "var(--admin-menu-hover)" : "transparent",
        boxSizing: "border-box",
      }}
    >
      <Checkbox
        size="small"
        checked={selected}
        onChange={() => onToggle(phone)}
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
      {manual ? (
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
      ) : null}
      {manual && onRemove ? (
        <IconButton size="small" onClick={() => onRemove(phone)} sx={{ color: "#e53935", p: 0.5 }}>
          <DeleteIcon sx={{ fontSize: 18 }} />
        </IconButton>
      ) : null}
    </Box>
  );
});

const VirtualCustomerList = memo(function VirtualCustomerList({
  items,
  selectedSet,
  onToggle,
  onRemoveManual,
}: {
  items: ListItem[];
  selectedSet: Set<string>;
  onToggle: (phone: string) => void;
  onRemoveManual: (phone: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(360);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const sync = () => setViewportH(el.clientHeight || 360);
    sync();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);

  const overscan = 10;
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - overscan);
  const visibleCount = Math.ceil(viewportH / ROW_HEIGHT) + overscan * 2;
  const end = Math.min(items.length, start + visibleCount);
  const slice = items.slice(start, end);

  return (
    <Box
      ref={containerRef}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      sx={{
        flex: 1,
        overflowY: "auto",
        maxHeight: { xs: "min(52vh, 420px)", md: "calc(100vh - 300px)" },
        minHeight: { md: 280 },
      }}
    >
      <Box sx={{ height: items.length * ROW_HEIGHT, position: "relative" }}>
        <Box
          sx={{
            position: "absolute",
            top: start * ROW_HEIGHT,
            left: 0,
            right: 0,
          }}
        >
          {slice.map((item) =>
            item.kind === "manual" ? (
              <PhoneRow
                key={`m-${item.phone}`}
                phone={item.phone}
                manual
                selected={selectedSet.has(item.phone)}
                onToggle={onToggle}
                onRemove={onRemoveManual}
              />
            ) : (
              <PhoneRow
                key={item.phone}
                phone={item.phone || "بدون شماره"}
                name={item.name}
                purchases={item.purchases}
                spent={item.spent}
                selected={selectedSet.has(item.phone)}
                onToggle={onToggle}
              />
            ),
          )}
        </Box>
      </Box>
    </Box>
  );
});

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
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | "">("");
  const [newGroupName, setNewGroupName] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [quotaEstimateMessage, setQuotaEstimateMessage] = useState("");

  const deferredSearch = useDeferredValue(phoneSearch);
  const selectedSet = useMemo(() => new Set(selectedPhones), [selectedPhones]);

  useEffect(() => {
    const t = window.setTimeout(() => setQuotaEstimateMessage(message), 350);
    return () => window.clearTimeout(t);
  }, [message]);

  const loadGroups = useCallback(async () => {
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient("GET", "/api/shop-customer-groups", token);
      if (!res || res.hasError) return;
      const raw = (res as { groups?: CustomerGroup[] }).groups;
      if (!Array.isArray(raw)) {
        setGroups([]);
        return;
      }
      setGroups(
        raw.map((g) => ({
          id: Number(g.id),
          name: String(g.name || ""),
          member_count: Number(g.member_count) || 0,
          phones: Array.isArray(g.phones) ? g.phones.map(String) : [],
        })),
      );
    } catch {
      /* ignore */
    }
  }, []);

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
    void fetchCustomers();
    void loadGroups();
  }, [loadGroups]);

  const applyGroupSelection = (groupId: number | "") => {
    setSelectedGroupId(groupId);
    if (groupId === "") {
      setNewGroupName("");
      return;
    }
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    setSelectedPhones(group.phones.filter(Boolean));
    setNewGroupName(group.name);
    toast.info(`گروه «${group.name}» انتخاب شد (${group.phones.length} نفر)`);
  };

  const handleCreateGroup = async () => {
    const name = newGroupName.trim();
    if (!name) {
      toast.error("نام گروه را وارد کنید");
      return;
    }
    if (selectedPhones.length === 0) {
      toast.error("حداقل یک نفر را تیک بزنید");
      return;
    }
    setSavingGroup(true);
    try {
      const res = await FetchWithJwtClient("POST", "/api/shop-customer-groups", {
        name,
        phones: selectedPhones,
      });
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "ایجاد گروه ناموفق بود"));
        return;
      }
      toast.success("گروه ایجاد شد");
      await loadGroups();
      const created = (res as { group?: CustomerGroup }).group;
      if (created?.id) {
        setSelectedGroupId(Number(created.id));
        setNewGroupName(created.name || name);
      }
    } catch {
      toast.error("خطا در ایجاد گروه");
    } finally {
      setSavingGroup(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (selectedGroupId === "") {
      toast.error("ابتدا یک گروه را انتخاب کنید");
      return;
    }
    const name = newGroupName.trim();
    if (!name) {
      toast.error("نام گروه را وارد کنید");
      return;
    }
    if (selectedPhones.length === 0) {
      toast.error("حداقل یک نفر را تیک بزنید");
      return;
    }
    setSavingGroup(true);
    try {
      const res = await FetchWithJwtClient("PUT", `/api/shop-customer-groups/${selectedGroupId}`, {
        name,
        phones: selectedPhones,
      });
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "ویرایش گروه ناموفق بود"));
        return;
      }
      toast.success("گروه به‌روز شد");
      await loadGroups();
      const updated = (res as { group?: CustomerGroup }).group;
      if (updated?.name) setNewGroupName(updated.name);
    } catch {
      toast.error("خطا در ویرایش گروه");
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    const group = groups.find((g) => g.id === groupId);
    const label = group?.name ? `«${group.name}»` : "انتخاب‌شده";
    if (!window.confirm(`گروه ${label} حذف شود؟`)) return;
    try {
      const res = await FetchWithJwtClient("DELETE", `/api/shop-customer-groups/${groupId}`, {});
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "حذف گروه ناموفق بود"));
        return;
      }
      toast.success("گروه حذف شد");
      if (selectedGroupId === groupId) {
        setSelectedGroupId("");
        setNewGroupName("");
      }
      await loadGroups();
    } catch {
      toast.error("خطا در حذف گروه");
    }
  };

  const searchNorm = deferredSearch.trim().toLowerCase().replace(/\s/g, "");

  const listItems = useMemo(() => {
    const min = Number(minPurchases) || 0;
    const filteredManual = !searchNorm
      ? manualPhones
      : manualPhones.filter((p) => p.includes(searchNorm));

    const filtered = customers.filter((c) => {
      if (purchaseCount(c) < min) return false;
      if (!searchNorm) return true;
      const phone = String(c.phone || "").replace(/\s/g, "");
      const name = String(c.name || "").toLowerCase().replace(/\s/g, "");
      return phone.includes(searchNorm) || name.includes(searchNorm);
    });

    filtered.sort((a, b) => {
      if (customerSort === "count_desc" || customerSort === "count_asc") {
        const diff = purchaseCount(a) - purchaseCount(b);
        return customerSort === "count_desc" ? -diff : diff;
      }
      const diff = purchaseAmount(a) - purchaseAmount(b);
      return customerSort === "amount_desc" ? -diff : diff;
    });

    const items: ListItem[] = [
      ...filteredManual.map((phone) => ({ kind: "manual" as const, phone })),
      ...filtered.map((customer) => ({
        kind: "customer" as const,
        phone: customer.phone,
        name: customer.name,
        purchases: purchaseCount(customer),
        spent: purchaseAmount(customer),
      })),
    ];
    return items;
  }, [customers, manualPhones, searchNorm, minPurchases, customerSort]);

  const allFilteredSelected = useMemo(() => {
    if (listItems.length === 0) return false;
    return listItems.every((item) => selectedSet.has(item.phone));
  }, [listItems, selectedSet]);

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
    if (selectedSet.has(phone) || manualPhones.includes(phone)) {
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

  const handleRemoveManualPhone = useCallback((phone: string) => {
    setManualPhones((prev) => prev.filter((p) => p !== phone));
    setSelectedPhones((prev) => prev.filter((p) => p !== phone));
  }, []);

  const handleSelectAllFiltered = (checked: boolean) => {
    const phones = listItems.map((item) => item.phone).filter(Boolean);
    if (checked) {
      setSelectedPhones((prev) => Array.from(new Set([...prev, ...phones])));
    } else {
      const remove = new Set(phones);
      setSelectedPhones((prev) => prev.filter((p) => !remove.has(p)));
    }
  };

  const togglePhone = useCallback((phone: string) => {
    setSelectedPhones((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone],
    );
  }, []);

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

  const listEmpty = !loading && listItems.length === 0;

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <ShopSmsQuotaCard
        compact
        estimateMessage={quotaEstimateMessage}
        estimateRecipientCount={selectedPhones.length}
        preferLocalEstimate
      />

      <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
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
              <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                <TextField
                  size="small"
                  select
                  label="گروه خریداران"
                  value={selectedGroupId === "" ? "" : String(selectedGroupId)}
                  onChange={(e) => {
                    const v = e.target.value;
                    applyGroupSelection(v === "" ? "" : Number(v));
                  }}
                  sx={{ ...fieldSx, minWidth: 180, flex: 1 }}
                  InputLabelProps={{ sx: { color: "var(--admin-text-muted)", fontSize: "13px" } }}
                >
                  <MenuItem value="">همه / بدون گروه</MenuItem>
                  {groups.map((g) => (
                    <MenuItem key={g.id} value={String(g.id)}>
                      {g.name} ({g.member_count})
                    </MenuItem>
                  ))}
                </TextField>
                {selectedGroupId !== "" ? (
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => void handleDeleteGroup(Number(selectedGroupId))}
                    sx={{ ...adminButtonStartIconSx, minWidth: 100 }}
                  >
                    حذف
                  </Button>
                ) : null}
              </Box>
              <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                <TextField
                  size="small"
                  fullWidth
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder={
                    selectedGroupId !== ""
                      ? "نام گروه (برای ویرایش)"
                      : "نام گروه جدید از افراد تیک‌خورده"
                  }
                  sx={{ ...fieldSx, flex: 1, minWidth: 160 }}
                />
                {selectedGroupId !== "" ? (
                  <Button
                    size="small"
                    variant="contained"
                    disabled={savingGroup || selectedPhones.length === 0 || !newGroupName.trim()}
                    onClick={() => void handleUpdateGroup()}
                    startIcon={<SaveOutlinedIcon />}
                    sx={{
                      ...adminButtonStartIconSx,
                      minWidth: 120,
                      bgcolor: "var(--admin-accent)",
                      color: "var(--admin-on-accent)",
                      "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                    }}
                  >
                    ذخیره ویرایش
                  </Button>
                ) : null}
                <Button
                  size="small"
                  variant="outlined"
                  disabled={savingGroup || selectedPhones.length === 0 || !newGroupName.trim()}
                  onClick={() => void handleCreateGroup()}
                  startIcon={<GroupAddIcon />}
                  sx={{
                    ...adminButtonStartIconSx,
                    minWidth: 120,
                    borderColor: "var(--admin-border)",
                    color: "var(--admin-text)",
                  }}
                >
                  {selectedGroupId !== "" ? "گروه جدید" : "ایجاد گروه"}
                </Button>
              </Box>
              {selectedGroupId !== "" ? (
                <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", mb: 1.5, mt: -0.5 }}>
                  اعضای تیک‌خورده و نام بالا با «ذخیره ویرایش» روی همین گروه اعمال می‌شود.
                </Typography>
              ) : null}
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
              {manualPhones.length > 0 ? (
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
              ) : null}
              <Button
                fullWidth
                variant="contained"
                disabled={isSubmitting || selectedPhones.length === 0 || !message.trim()}
                onClick={() => void handleSendMessage()}
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
                    disabled={listItems.length === 0}
                    onChange={(e) => handleSelectAllFiltered(e.target.checked)}
                    sx={{
                      p: 0.5,
                      color: "var(--admin-accent)",
                      "&.Mui-checked": { color: "var(--admin-accent)" },
                    }}
                  />
                  <Typography sx={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>
                    {searchNorm
                      ? "انتخاب نتایج"
                      : minPurchases > 0
                        ? "انتخاب فیلترشده"
                        : "انتخاب همه"}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: "12px", color: "var(--admin-text-secondary)" }}>
                  {selectedPhones.length} انتخاب · {listItems.length} نمایش
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
              <VirtualCustomerList
                items={listItems}
                selectedSet={selectedSet}
                onToggle={togglePhone}
                onRemoveManual={handleRemoveManualPhone}
              />
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
