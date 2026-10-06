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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import {
  extractShopTables,
  getAdminShopCode,
  shopPlaceNoun,
  shopTableDisplayName,
  tableQrImageUrl,
  tableReservAbsoluteUrl,
  type ShopPlaceKind,
  composeTableQrPoster,
  downloadDataUrl,
  readTableQrPosterTheme,
  writeTableQrPosterTheme,
  type ShopTable,
  type TableQrPosterTheme,
} from "@/app/lib/shopTables";

export default function ShopTablesPage() {
  const [placeKind, setPlaceKind] = useState<ShopPlaceKind>("table");
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
  const [qrPoster, setQrPoster] = useState("");
  const [qrPosterLoading, setQrPosterLoading] = useState(false);
  const [qrTheme, setQrTheme] = useState<TableQrPosterTheme>(() => readTableQrPosterTheme());

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
    const ofKind = tables.filter((t) => (t.kind || "table") === placeKind);
    const next = ofKind.length ? Math.max(...ofKind.map((t) => t.number)) + 1 : 1;
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
      toast.error(`شماره ${shopPlaceNoun(placeKind)} باید عدد مثبت باشد`);
      return;
    }
    const token = tokenCode();
    if (!token) return;
    const body = {
      number,
      table_number: number,
      kind: editing?.kind || placeKind,
      name: tableName.trim() || `${shopPlaceNoun(editing?.kind || placeKind)} ${number}`,
      label: tableName.trim() || `${shopPlaceNoun(editing?.kind || placeKind)} ${number}`,
    };
    setSaving(true);
    try {
      const res = editing
        ? await FetchWithJwtClient("PUT", `/api/shop-tables/${editing.id}`, token, {}, { body: JSON.stringify(body) })
        : await FetchWithJwtClient("POST", "/api/shop-tables", token, {}, { body: JSON.stringify(body) });
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, `ذخیره ${shopPlaceNoun(placeKind)} ناموفق بود`));
        return;
      }
      toast.success(editing ? `${shopPlaceNoun(editing.kind || placeKind)} ویرایش شد` : `${shopPlaceNoun(placeKind)} ساخته شد`);
      setDialogOpen(false);
      await loadTables();
    } finally {
      setSaving(false);
    }
  };

  const createDefaults = async () => {
    const count = Number(defaultsCount);
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      toast.error(`تعداد ${shopPlaceNoun(placeKind)} باید بین ۱ تا ۵۰ باشد`);
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
        { body: JSON.stringify({ count, kind: placeKind }) },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ساخت پیش‌فرض ناموفق بود"));
        return;
      }
      toast.success(`${count} ${shopPlaceNoun(placeKind)} ساخته شد`);
      await loadTables();
    } finally {
      setCreatingDefaults(false);
    }
  };

  const deleteTable = async (table: ShopTable) => {
    if (!window.confirm(`${shopPlaceNoun(table.kind)} «${shopTableDisplayName(table)}» حذف شود؟`)) return;
    const token = tokenCode();
    if (!token) return;
    const res = await FetchWithJwtClient("DELETE", `/api/shop-tables/${table.id}`, token);
    if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "حذف ناموفق بود"));
      return;
    }
    toast.success("حذف شد");
    await loadTables();
  };

  useEffect(() => {
    if (!qrTable || !shopCode.trim()) {
      setQrPoster("");
      setQrPosterLoading(false);
      return;
    }
    let cancelled = false;
    setQrPoster("");
    setQrPosterLoading(true);
    const title = shopTableDisplayName(qrTable);
    const url = tableReservAbsoluteUrl(shopCode.trim(), qrTable.number, qrTable.kind || "table");
    void composeTableQrPoster(url, title, "", 240, qrTheme)
      .then((dataUrl) => {
        if (!cancelled) setQrPoster(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrPoster("");
      })
      .finally(() => {
        if (!cancelled) setQrPosterLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [qrTable, shopCode, qrTheme]);

  const downloadQr = () => {
    if (!qrTable || !qrPoster) {
      toast.error("تصویر QR آماده نیست");
      return;
    }
    downloadDataUrl(qrPoster, `${shopTableDisplayName(qrTable)}.svg`);
    toast.success("دانلود شد");
  };

  const copyLink = async (table: ShopTable) => {
    if (!shopCode.trim()) {
      toast.error("کد فروشگاه را وارد کنید تا لینک ساخته شود");
      return;
    }
    const url = tableReservAbsoluteUrl(shopCode.trim(), table.number, table.kind || "table");
    try {
      await navigator.clipboard.writeText(url);
      toast.success("لینک کپی شد");
    } catch {
      toast.error(url);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Typography sx={{ fontWeight: 800, mb: 1, fontSize: 18 }}>میز و اتاق</Typography>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, mb: 2 }}>
        میز و اتاق جدا تعریف می‌شوند. هر دو در صورت فعال بودن رستوران/کافه منو را می‌بینند؛ خدمات اتاق هم در صورت فعال بودن جداگانه نمایش داده می‌شود.
      </Typography>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={placeKind}
        onChange={(_, value: ShopPlaceKind | null) => {
          if (value) setPlaceKind(value);
        }}
        sx={{
          mb: 2,
          "& .MuiToggleButton-root": {
            color: "var(--admin-text)",
            borderColor: "var(--admin-border)",
            "&.Mui-selected": {
              bgcolor: "var(--admin-accent)",
              color: "var(--admin-on-accent)",
              "&:hover": { bgcolor: "var(--admin-accent-hover)" },
            },
          },
        }}
      >
        <ToggleButton value="table">میزها</ToggleButton>
        <ToggleButton value="room">اتاق‌ها</ToggleButton>
      </ToggleButtonGroup>

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
          {placeKind === "room" ? "اتاق جدید" : "میز جدید"}
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
      ) : tables.filter((t) => (t.kind || "table") === placeKind).length === 0 ? (
        <Card sx={{ backgroundColor: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
          <CardContent>
            <Typography sx={{ color: "var(--admin-text-secondary)" }}>
              هنوز {shopPlaceNoun(placeKind)}ی تعریف نشده. با «ساخت پیش‌فرض» شماره ۱ و ۲ ساخته می‌شود.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
              lg: "repeat(5, minmax(0, 1fr))",
            },
            gap: 1.25,
          }}
        >
          {tables.filter((t) => (t.kind || "table") === placeKind).map((table) => {
            const url = shopCode.trim() ? tableReservAbsoluteUrl(shopCode.trim(), table.number, table.kind || "table") : "";
            return (
              <Card
                key={table.id}
                sx={{
                  backgroundColor: "var(--admin-surface)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: "14px",
                  boxShadow: "none",
                  height: "100%",
                  transition: "border-color 0.15s ease",
                  "&:hover": { borderColor: "var(--admin-accent)" },
                }}
              >
                <CardContent
                  sx={{
                    py: 1.75,
                    px: 1.5,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: 1,
                    "&:last-child": { pb: 1.75 },
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "12px",
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "rgba(var(--admin-accent-rgb, 0, 150, 136), 0.12)",
                      backgroundColor: "var(--admin-surface-alt)",
                      border: "1px solid var(--admin-border)",
                    }}
                  >
                    {table.kind === "room" ? (
                      <MeetingRoomIcon sx={{ color: "var(--admin-accent)", fontSize: 26 }} />
                    ) : (
                      <TableRestaurantIcon sx={{ color: "var(--admin-accent)", fontSize: 26 }} />
                    )}
                  </Box>
                  <Box sx={{ minWidth: 0, width: "100%" }}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: 15,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "var(--admin-text)",
                      }}
                    >
                      {shopTableDisplayName(table)}
                    </Typography>
                    <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 12, mt: 0.35 }}>
                      شماره {table.number}
                    </Typography>
                    {url ? (
                      <Typography
                        sx={{
                          color: "var(--admin-text-muted)",
                          fontSize: 10,
                          mt: 0.35,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          direction: "ltr",
                        }}
                        title={url}
                      >
                        {url.replace(/^https?:\/\/[^/]+/, "")}
                      </Typography>
                    ) : null}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      flexWrap: "wrap",
                      gap: 0.25,
                      mt: "auto",
                      pt: 0.5,
                    }}
                  >
                    <IconButton size="small" onClick={() => setQrTable(table)} sx={{ color: "var(--admin-accent)" }}>
                      <QrCode2Icon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => copyLink(table)} sx={{ color: "var(--admin-text)" }}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => openEdit(table)} sx={{ color: "var(--admin-text)" }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => deleteTable(table)} sx={{ color: "var(--admin-error-soft)" }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>
          {editing
            ? `ویرایش ${shopPlaceNoun(editing.kind || placeKind)}`
            : `${shopPlaceNoun(placeKind)} جدید`}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
          <TextField
            label={`شماره ${shopPlaceNoun(editing?.kind || placeKind)}`}
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
              {qrPosterLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={28} sx={{ color: "var(--admin-accent)" }} />
                </Box>
              ) : (
                <Box
                  component="img"
                  alt={qrTable ? shopTableDisplayName(qrTable) : "QR"}
                  src={
                    qrPoster ||
                    tableQrImageUrl(tableReservAbsoluteUrl(shopCode.trim(), qrTable.number, qrTable.kind || "table"), 240)
                  }
                  sx={{
                    width: qrPoster ? 280 : 240,
                    height: "auto",
                    mx: "auto",
                    display: "block",
                    bgcolor: qrPoster ? "transparent" : "#fff",
                    borderRadius: 2,
                  }}
                />
              )}
              <Typography sx={{ mt: 2, mb: 1, fontSize: 12, color: "var(--admin-text-secondary)" }}>
                تم
              </Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={qrTheme}
                onChange={(_, value: TableQrPosterTheme | null) => {
                  if (!value) return;
                  setQrTheme(value);
                  writeTableQrPosterTheme(value);
                }}
                sx={{
                  "& .MuiToggleButton-root": {
                    color: "var(--admin-text)",
                    borderColor: "var(--admin-border)",
                    "&.Mui-selected": {
                      bgcolor: "var(--admin-accent)",
                      color: "var(--admin-on-accent)",
                      "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                    },
                  },
                }}
              >
                <ToggleButton value="luxury">لوکس</ToggleButton>
                <ToggleButton value="simple">ساده</ToggleButton>
              </ToggleButtonGroup>
            </>
          ) : (
            <Typography>ابتدا کد فروشگاه را وارد کنید.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          {qrTable && shopCode.trim() ? (
            <Button
              startIcon={<DownloadIcon />}
              onClick={downloadQr}
              disabled={!qrPoster}
              sx={adminButtonStartIconSx}
            >
              دانلود
            </Button>
          ) : null}
          {qrTable && <Button onClick={() => copyLink(qrTable)}>کپی لینک</Button>}
          <Button onClick={() => setQrTable(null)}>بستن</Button>
        </DialogActions>
      </Dialog>
      <ToastContainer position="bottom-center" autoClose={3000} />
    </Box>
  );
}
