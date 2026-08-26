"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  fetchShopAccounts,
  isMainShopAccount,
  type ShopAccount,
} from "@/app/lib/shopAccounts";

const formatNumber = (num: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(num || 0));

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function parseAmount(value: string): number {
  const normalized = value
    .replace(/[۰-۹]/g, (c) => String(PERSIAN_DIGITS.indexOf(c)))
    .replace(/[,٬\s]/g, "")
    .replace(/\D/g, "");
  if (!normalized) return 0;
  const n = parseInt(normalized, 10);
  return Number.isNaN(n) ? 0 : n;
}

function formatAmountInput(value: string): string {
  const n = parseAmount(value);
  if (!value.trim() || n <= 0) {
    const digitsOnly = value
      .replace(/[۰-۹]/g, (c) => String(PERSIAN_DIGITS.indexOf(c)))
      .replace(/[,٬\s]/g, "")
      .replace(/\D/g, "");
    if (!digitsOnly) return "";
  }
  if (n <= 0 && !value.trim()) return "";
  const raw = value
    .replace(/[۰-۹]/g, (c) => String(PERSIAN_DIGITS.indexOf(c)))
    .replace(/[,٬\s]/g, "")
    .replace(/\D/g, "");
  if (!raw) return "";
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) return "";
  return new Intl.NumberFormat("fa-IR").format(parsed);
}

function getApiErrorMessage(res: unknown, fallback: string): string {
  if (!res || typeof res !== "object") return fallback;
  const r = res as Record<string, unknown>;
  if (typeof r.message === "string") return r.message;
  if (typeof r.error === "string") return r.error;
  if (typeof r.errorText === "string") {
    try {
      const parsed = JSON.parse(r.errorText);
      if (typeof parsed.message === "string") return parsed.message;
      if (Array.isArray(parsed.message) && parsed.message[0]?.title) {
        return parsed.message[0].title;
      }
    } catch {
      if (r.errorText && r.errorText !== "fetch failed") return String(r.errorText);
    }
  }
  return fallback;
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
  "& .MuiSelect-icon": { color: "var(--admin-text-muted)" },
} as const;

export default function PettyCashPage() {
  const [pettyAccounts, setPettyAccounts] = useState<ShopAccount[]>([]);
  const [mainAccounts, setMainAccounts] = useState<ShopAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [chargeTarget, setChargeTarget] = useState<ShopAccount | null>(null);
  const [newName, setNewName] = useState("");
  const [fromAccountId, setFromAccountId] = useState<number | "">("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeTitle, setChargeTitle] = useState("شارژ تنخواه");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [petty, all] = await Promise.all([
        fetchShopAccounts({ type: "petty_cash" }),
        fetchShopAccounts(),
      ]);
      setPettyAccounts(petty);
      setMainAccounts(all.filter(isMainShopAccount));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در دریافت تنخواه‌ها");
      setPettyAccounts([]);
      setMainAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalPettyBalance = useMemo(
    () => pettyAccounts.reduce((sum, item) => sum + (item.balance || 0), 0),
    [pettyAccounts]
  );

  const openCharge = (account: ShopAccount) => {
    setChargeTarget(account);
    setFromAccountId(mainAccounts[0]?.id ?? "");
    setChargeAmount("");
    setChargeTitle("شارژ تنخواه");
    setChargeOpen(true);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error("نام تنخواه را وارد کنید");
      return;
    }
    setSaving(true);
    const token = tokenCode();
    try {
      const res = await apiRequestError(
        "Post",
        {},
        { name, type: "petty_cash" },
        "/api/shop-accounts",
        true,
        true,
        token
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ایجاد تنخواه"));
        return;
      }
      toast.success("تنخواه ساخته شد");
      setCreateOpen(false);
      setNewName("");
      await load();
    } catch {
      toast.error("خطا در ایجاد تنخواه");
    } finally {
      setSaving(false);
    }
  };

  const handleCharge = async () => {
    if (!chargeTarget) return;
    if (!fromAccountId) {
      toast.error("حساب مبدأ را انتخاب کنید");
      return;
    }
    const amount = parseAmount(chargeAmount);
    if (amount <= 0) {
      toast.error("مبلغ شارژ معتبر نیست");
      return;
    }
    setSaving(true);
    const token = tokenCode();
    try {
      const res = await apiRequestError(
        "Post",
        {},
        {
          from_shop_account_id: fromAccountId,
          to_shop_account_id: chargeTarget.id,
          amount,
          title: chargeTitle.trim() || "شارژ تنخواه",
        },
        "/api/shop-account-transfers",
        true,
        true,
        token
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در شارژ تنخواه"));
        return;
      }
      toast.success("شارژ تنخواه ثبت شد");
      setChargeOpen(false);
      await load();
    } catch {
      toast.error("خطا در شارژ تنخواه");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (account: ShopAccount) => {
    if (!window.confirm(`تنخواه «${account.name}» غیرفعال شود؟`)) return;
    const token = tokenCode();
    try {
      const res = await apiRequestError(
        "Delete",
        {},
        {},
        `/api/shop-accounts/${account.id}`,
        true,
        true,
        token
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در حذف تنخواه"));
        return;
      }
      toast.success("تنخواه غیرفعال شد");
      await load();
    } catch {
      toast.error("خطا در حذف تنخواه");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--admin-bg-gradient)",
        pt: { xs: 1.5, md: 3 },
        pb: { xs: "140px", md: 8 },
        direction: "rtl",
      }}
    >
      <Container maxWidth="md" sx={{ px: { xs: 1.5, md: 3 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            flexWrap: "wrap",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <AccountBalanceWalletIcon sx={{ color: "var(--admin-accent)", fontSize: 30 }} />
            <Box>
              <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: { xs: 18, md: 22 } }}>
                تنخواه
              </Typography>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                شارژ از حساب اصلی فروشگاه · پرداخت هزینه و فاکتور
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={load}
              disabled={loading}
              sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
            >
              بروزرسانی
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setNewName("");
                setCreateOpen(true);
              }}
              sx={{
                bgcolor: "var(--admin-accent)",
                "&:hover": { bgcolor: "var(--admin-accent-hover)" },
              }}
            >
              تنخواه جدید
            </Button>
          </Box>
        </Box>

        <Card
          sx={{
            mb: 2,
            bgcolor: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
              جمع موجودی تنخواه‌ها:{" "}
              <Box component="span" sx={{ color: "var(--admin-accent)", fontWeight: 700 }}>
                {formatNumber(totalPettyBalance)} تومان
              </Box>
            </Typography>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : pettyAccounts.length === 0 ? (
          <Card
            sx={{
              bgcolor: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
              borderRadius: 2,
              textAlign: "center",
              py: 5,
            }}
          >
            <Typography sx={{ color: "var(--admin-text-muted)", mb: 2 }}>
              هنوز تنخواهی تعریف نشده است
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
              sx={{
                bgcolor: "var(--admin-accent)",
                "&:hover": { bgcolor: "var(--admin-accent-hover)" },
              }}
            >
              ایجاد اولین تنخواه
            </Button>
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {pettyAccounts.map((account) => (
              <Card
                key={account.id}
                sx={{
                  bgcolor: "var(--admin-surface)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: 2,
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.5,
                    flexWrap: "wrap",
                    py: 1.5,
                    "&:last-child": { pb: 1.5 },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 15 }}>
                      {account.name}
                    </Typography>
                    <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: 14, mt: 0.35 }}>
                      موجودی: {formatNumber(account.balance)} تومان
                    </Typography>
                    <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.5 }}>
                      شارژ: {formatNumber(account.charged_total ?? 0)} · هزینه:{" "}
                      {formatNumber(account.expenses_total ?? 0)} · فاکتور:{" "}
                      {formatNumber(account.invoices_total ?? 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SyncAltIcon sx={{ fontSize: 16 }} />}
                      onClick={() => openCharge(account)}
                      disabled={mainAccounts.length === 0}
                      sx={{
                        color: "var(--admin-accent)",
                        borderColor: "var(--admin-accent)",
                        fontSize: 12,
                      }}
                    >
                      شارژ
                    </Button>
                    <IconButton
                      size="small"
                      aria-label="حذف تنخواه"
                      onClick={() => handleDelete(account)}
                      sx={{ color: "#f87171" }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        <Dialog
          open={createOpen}
          onClose={() => !saving && setCreateOpen(false)}
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: {
              bgcolor: "var(--admin-surface)",
              color: "var(--admin-text)",
              borderRadius: 2,
              border: "1px solid var(--admin-border)",
              direction: "rtl",
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>تنخواه جدید</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              size="small"
              label="نام تنخواه"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="مثلاً تنخواه آشپزخانه"
              sx={{ ...fieldSx, mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 2 }}>
            <Button onClick={() => setCreateOpen(false)} disabled={saving} sx={{ color: "var(--admin-text-muted)" }}>
              انصراف
            </Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={saving}
              sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
            >
              {saving ? "..." : "ایجاد"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={chargeOpen}
          onClose={() => !saving && setChargeOpen(false)}
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: {
              bgcolor: "var(--admin-surface)",
              color: "var(--admin-text)",
              borderRadius: 2,
              border: "1px solid var(--admin-border)",
              direction: "rtl",
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            شارژ {chargeTarget?.name || "تنخواه"}
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
            <FormControl fullWidth size="small" sx={{ ...fieldSx, mt: 1 }}>
              <InputLabel id="from-account-label">از حساب فروشگاه</InputLabel>
              <Select
                labelId="from-account-label"
                label="از حساب فروشگاه"
                value={fromAccountId === "" ? "" : String(fromAccountId)}
                onChange={(e) =>
                  setFromAccountId(e.target.value === "" ? "" : Number(e.target.value))
                }
              >
                {mainAccounts.map((account) => (
                  <MenuItem key={account.id} value={String(account.id)}>
                    {account.name} — موجودی {formatNumber(account.balance)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label="مبلغ"
              value={chargeAmount}
              onChange={(e) => setChargeAmount(formatAmountInput(e.target.value))}
              placeholder="۰"
              sx={fieldSx}
              inputProps={{ style: { direction: "ltr", textAlign: "left" } }}
            />
            <TextField
              fullWidth
              size="small"
              label="عنوان (اختیاری)"
              value={chargeTitle}
              onChange={(e) => setChargeTitle(e.target.value)}
              sx={fieldSx}
            />
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 2 }}>
            <Button onClick={() => setChargeOpen(false)} disabled={saving} sx={{ color: "var(--admin-text-muted)" }}>
              انصراف
            </Button>
            <Button
              variant="contained"
              onClick={handleCharge}
              disabled={saving}
              sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
            >
              {saving ? "..." : "ثبت شارژ"}
            </Button>
          </DialogActions>
        </Dialog>

        <ToastContainer autoClose={3000} position="bottom-right" />
      </Container>
    </Box>
  );
}
