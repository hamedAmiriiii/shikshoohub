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
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
} as const;

export default function ShopAccountsPage() {
  const [accounts, setAccounts] = useState<ShopAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ShopAccount | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchShopAccounts();
      setAccounts(list.filter(isMainShopAccount));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در دریافت حساب‌ها");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, item) => sum + (item.balance || 0), 0),
    [accounts]
  );

  const openCreate = () => {
    setEditing(null);
    setNameInput("");
    setDialogOpen(true);
  };

  const openEdit = (account: ShopAccount) => {
    setEditing(account);
    setNameInput(account.name);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const name = nameInput.trim();
    if (!name) {
      toast.error("نام حساب را وارد کنید");
      return;
    }
    setSaving(true);
    const token = tokenCode();
    try {
      if (editing) {
        const res = await apiRequestError(
          "Put",
          {},
          { name },
          `/api/shop-accounts/${editing.id}`,
          true,
          true,
          token
        );
        if (res?.hasError) {
          toast.error(getApiErrorMessage(res, "خطا در ویرایش حساب"));
          return;
        }
        toast.success("حساب به‌روز شد");
      } else {
        const res = await apiRequestError(
          "Post",
          {},
          { name, type: "main" },
          "/api/shop-accounts",
          true,
          true,
          token
        );
        if (res?.hasError) {
          toast.error(getApiErrorMessage(res, "خطا در ایجاد حساب"));
          return;
        }
        toast.success("حساب جدید ساخته شد");
      }
      setDialogOpen(false);
      await load();
    } catch {
      toast.error("خطا در ذخیره حساب");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (account: ShopAccount) => {
    if (account.is_default) {
      toast.error("حساب‌های پیش‌فرض قابل حذف نیستند");
      return;
    }
    if (!window.confirm(`حساب «${account.name}» غیرفعال شود؟`)) return;
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
        toast.error(getApiErrorMessage(res, "خطا در حذف حساب"));
        return;
      }
      toast.success("حساب غیرفعال شد");
      await load();
    } catch {
      toast.error("خطا در حذف حساب");
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
            <AccountBalanceIcon sx={{ color: "var(--admin-accent)", fontSize: 30 }} />
            <Box>
              <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: { xs: 18, md: 22 } }}>
                حساب‌های فروشگاه
              </Typography>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                حساب‌های اصلی برای واریز روزانه، شارژ تنخواه و پرداخت هزینه/فاکتور
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
              onClick={openCreate}
              sx={{
                bgcolor: "var(--admin-accent)",
                "&:hover": { bgcolor: "var(--admin-accent-hover)" },
              }}
            >
              حساب جدید
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
              جمع موجودی حساب‌ها:{" "}
              <Box component="span" sx={{ color: "var(--admin-accent)", fontWeight: 700 }}>
                {formatNumber(totalBalance)} تومان
              </Box>
            </Typography>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : accounts.length === 0 ? (
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
              هنوز حساب فروشگاهی تعریف نشده است
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{
                bgcolor: "var(--admin-accent)",
                "&:hover": { bgcolor: "var(--admin-accent-hover)" },
              }}
            >
              ایجاد اولین حساب
            </Button>
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {accounts.map((account) => (
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
                      {account.is_default ? (
                        <Box
                          component="span"
                          sx={{
                            ml: 1,
                            color: "var(--admin-text-muted)",
                            fontWeight: 500,
                            fontSize: 11,
                          }}
                        >
                          (پیش‌فرض)
                        </Box>
                      ) : null}
                    </Typography>
                    <Typography
                      sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: 14, mt: 0.35 }}
                    >
                      موجودی: {formatNumber(account.balance)} تومان
                    </Typography>
                    <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.5 }}>
                      واریز: {formatNumber(account.deposits_total ?? 0)} · شارژ تنخواه:{" "}
                      {formatNumber(account.charged_total ?? 0)} · هزینه:{" "}
                      {formatNumber(account.expenses_total ?? 0)} · فاکتور:{" "}
                      {formatNumber(account.invoices_total ?? 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                    <IconButton
                      size="small"
                      aria-label="ویرایش حساب"
                      onClick={() => openEdit(account)}
                      sx={{ color: "var(--admin-text-muted)" }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="حذف حساب"
                      disabled={Boolean(account.is_default)}
                      onClick={() => handleDelete(account)}
                      sx={{
                        color: account.is_default ? "var(--admin-text-secondary)" : "#f87171",
                      }}
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
          open={dialogOpen}
          onClose={() => !saving && setDialogOpen(false)}
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
            {editing ? "ویرایش حساب" : "حساب جدید"}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              size="small"
              label="نام حساب"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="مثلاً ملت / پاسارگاد"
              sx={{ ...fieldSx, mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 2 }}>
            <Button
              onClick={() => setDialogOpen(false)}
              disabled={saving}
              sx={{ color: "var(--admin-text-muted)" }}
            >
              انصراف
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{
                bgcolor: "var(--admin-accent)",
                "&:hover": { bgcolor: "var(--admin-accent-hover)" },
              }}
            >
              {saving ? "..." : "ذخیره"}
            </Button>
          </DialogActions>
        </Dialog>

        <ToastContainer autoClose={3000} position="bottom-right" />
      </Container>
    </Box>
  );
}
