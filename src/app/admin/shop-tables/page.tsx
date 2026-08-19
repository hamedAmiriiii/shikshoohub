"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import {
  extractShopTables,
  getAdminShopCode,
  shopTableDisplayName,
  tableQrImageUrl,
  tableReservAbsoluteUrl,
  type ShopTable,
} from "@/app/lib/shopTables";

export default function ShopTablesPage() {
  const [tables, setTables] = useState<ShopTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopCode, setShopCode] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ShopTable | null>(null);
  const [tableNumber, setTableNumber] = useState("1");
  const [tableName, setTableName] = useState("");
  const [saving, setSaving] = useState(false);
  const [defaultsCount, setDefaultsCount] = useState("2");
  const [creatingDefaults, setCreatingDefaults] = useState(false);
  const [qrTable, setQrTable] = useState<ShopTable | null>(null);

  const loadTables = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", "/api/shop-tables", token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت میزها"));
        return;
      }
      setTables(extractShopTables(res));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setShopCode(getAdminShopCode() || "");
    loadTables();
  }, [loadTables]);

  const openCreate = () => {
    setEditing(null);
    const next = tables.length ? Math.max(...tables.map((t) => t.number)) + 1 : 1;
    setTableNumber(String(next));
    setTableName("");
    setDialogOpen(true);
  };

  const openEdit = (table: ShopTable) => {
    setEditing(table);
    setTableNumber(String(table.number));
    setTableName(table.name || table.label || "");
    setDialogOpen(true);
  };

  const saveTable = async () => {
    const number = Number(tableNumber);
    if (!Number.isInteger(number) || number < 1) {
      toast.error("شماره میز باید عدد مثبت باشد");
      return;
    }
    const token = tokenCode();
    if (!token) return;
    const body = {
      number,
      table_number: number,
      name: tableName.trim() || `میز ${number}`,
      label: tableName.trim() || `میز ${number}`,
    };
    setSaving(true);
    try {
      const res = editing
        ? await FetchWithJwtClient("PUT", `/api/shop-tables/${editing.id}`, token, {}, { body: JSON.stringify(body) })
        : await FetchWithJwtClient("POST", "/api/shop-tables", token, {}, { body: JSON.stringify(body) });
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ذخیره میز ناموفق بود"));
        return;
      }
      toast.success(editing ? "میز ویرایش شد" : "میز ساخته شد");
      setDialogOpen(false);
      await loadTables();
    } finally {
      setSaving(false);
    }
  };

  const createDefaults = async () => {
    const count = Number(defaultsCount);
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      toast.error("تعداد میز باید بین ۱ تا ۵۰ باشد");
      return;
    }
    const token = tokenCode();
    if (!token) return;
    setCreatingDefaults(true);
    try {
      const res = await FetchWithJwtClient(
        "POST",
        "/api/shop-tables/create-defaults",
        token,
        {},
        { body: JSON.stringify({ count }) },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ساخت میزهای پیش‌فرض ناموفق بود"));
        return;
      }
      toast.success(`${count} میز ساخته شد`);
      await loadTables();
    } finally {
      setCreatingDefaults(false);
    }
  };

  const deleteTable = async (table: ShopTable) => {
    if (!window.confirm(`میز «${shopTableDisplayName(table)}» حذف شود؟`)) return;
    const token = tokenCode();
    if (!token) return;
    const res = await FetchWithJwtClient("DELETE", `/api/shop-tables/${table.id}`, token);
    if (res?.hasError) {
      toast.error(getApiErrorMessage(res, "حذف میز ناموفق بود"));
      return;
    }
    toast.success("میز حذف شد");
    await loadTables();
  };

  const copyLink = async (table: ShopTable) => {
    if (!shopCode.trim()) {
      toast.error("کد فروشگاه را وارد کنید تا لینک ساخته شود");
      return;
    }
    const url = tableReservAbsoluteUrl(shopCode.trim(), table.number);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("لینک کپی شد");
    } catch {
      toast.error(url);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Typography sx={{ fontWeight: 800, mb: 1, fontSize: 18 }}>میزهای فروشگاه</Typography>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, mb: 2 }}>
        برای هر میز یک لینک QR بسازید تا مشتری از روی میز سفارش حضوری ثبت کند.
      </Typography>

      <TextField
        size="small"
        fullWidth
        label="کد فروشگاه در آدرس (مثل lymak)"
        value={shopCode}
        onChange={(e) => setShopCode(e.target.value)}
        sx={{
          mb: 2,
          "& .MuiOutlinedInput-root": {
            color: "var(--admin-text)",
            backgroundColor: "var(--admin-surface)",
            "& fieldset": { borderColor: "var(--admin-border)" },
          },
          "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
        }}
      />

      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ ...adminButtonStartIconSx, bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
        >
          میز جدید
        </Button>
        <TextField
          size="small"
          type="number"
          value={defaultsCount}
          onChange={(e) => setDefaultsCount(e.target.value)}
          sx={{
            width: 88,
            "& .MuiOutlinedInput-root": {
              color: "var(--admin-text)",
              backgroundColor: "var(--admin-surface)",
              "& fieldset": { borderColor: "var(--admin-border)" },
            },
          }}
        />
        <Button
          variant="outlined"
          disabled={creatingDefaults}
          onClick={createDefaults}
          sx={{ borderColor: "var(--admin-accent)", color: "var(--admin-accent)" }}
        >
          {creatingDefaults ? "..." : "ساخت پیش‌فرض"}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : tables.length === 0 ? (
        <Card sx={{ backgroundColor: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
          <CardContent>
            <Typography sx={{ color: "var(--admin-text-secondary)" }}>
              هنوز میزی تعریف نشده. با «ساخت پیش‌فرض» میز ۱ و ۲ ساخته می‌شود.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        tables.map((table) => {
          const url = shopCode.trim() ? tableReservAbsoluteUrl(shopCode.trim(), table.number) : "";
          return (
            <Card
              key={table.id}
              sx={{ mb: 1.25, backgroundColor: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
            >
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TableRestaurantIcon sx={{ color: "var(--admin-accent)" }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }}>{shopTableDisplayName(table)}</Typography>
                    <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 12 }}>
                      شماره {table.number}
                      {url ? ` · ${url.replace(/^https?:\/\/[^/]+/, "")}` : ""}
                    </Typography>
                  </Box>
                  <IconButton onClick={() => setQrTable(table)} sx={{ color: "var(--admin-accent)" }}>
                    <QrCode2Icon />
                  </IconButton>
                  <IconButton onClick={() => copyLink(table)} sx={{ color: "var(--admin-text)" }}>
                    <ContentCopyIcon />
                  </IconButton>
                  <IconButton onClick={() => openEdit(table)} sx={{ color: "var(--admin-text)" }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => deleteTable(table)} sx={{ color: "#e57373" }}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          );
        })
      )}

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? "ویرایش میز" : "میز جدید"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
          <TextField
            label="شماره میز"
            type="number"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          />
          <TextField
            label="نام نمایشی (مثلاً VIP)"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>انصراف</Button>
          <Button onClick={saveTable} disabled={saving} variant="contained">
            {saving ? "..." : "ذخیره"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(qrTable)} onClose={() => setQrTable(null)} fullWidth maxWidth="xs">
        <DialogTitle>QR کد {qrTable ? shopTableDisplayName(qrTable) : ""}</DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          {qrTable && shopCode.trim() ? (
            <>
              <Box
                component="img"
                alt="QR"
                src={tableQrImageUrl(tableReservAbsoluteUrl(shopCode.trim(), qrTable.number), 240)}
                sx={{ width: 240, height: 240, mx: "auto", display: "block" }}
              />
              <Typography sx={{ mt: 1.5, fontSize: 13, direction: "ltr" }}>
                {tableReservAbsoluteUrl(shopCode.trim(), qrTable.number)}
              </Typography>
            </>
          ) : (
            <Typography>ابتدا کد فروشگاه را وارد کنید.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          {qrTable && <Button onClick={() => copyLink(qrTable)}>کپی لینک</Button>}
          <Button onClick={() => setQrTable(null)}>بستن</Button>
        </DialogActions>
      </Dialog>
      <ToastContainer position="bottom-center" autoClose={3000} />
    </Box>
  );
}
