"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  MenuItem,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import HistoryIcon from "@mui/icons-material/History";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { formatAmountNumber, parseAmountInput } from "@/app/lib/amountInput";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";

type ConsumableLot = {
  id: number;
  quantity: number;
  remaining: number;
  unit_cost: number;
  purchased_at?: string | null;
  invoice_id?: number | null;
};

type QtyUnit = "piece" | "kg" | "liter";

const UNIT_LABEL: Record<QtyUnit, string> = {
  piece: "عدد",
  kg: "کیلو",
  liter: "لیتر",
};

function asQtyUnit(value: unknown): QtyUnit {
  if (value === "kg" || value === "liter" || value === "piece") return value;
  return "piece";
}

function formatQty(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 3 }).format(Math.round(value * 1000) / 1000);
}

type ConsumableMaterial = {
  id: number;
  name: string;
  unit_type?: string | null;
  note?: string | null;
  stock?: number;
  stock_value?: number;
  next_unit_cost?: number | null;
  open_lots_count?: number;
  lots?: ConsumableLot[];
};

type WithdrawalRow = {
  id: number;
  consumable_material_id: number;
  material_name?: string | null;
  quantity: number;
  total_cost: number;
  withdrawn_at?: string | null;
  note?: string | null;
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "var(--admin-text)",
    backgroundColor: "var(--admin-surface-alt)",
    fontSize: 13,
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)", fontSize: 13 },
} as const;

const cellSx = {
  color: "var(--admin-text)",
  fontSize: 12,
  py: 0.9,
  px: 1.25,
  textAlign: "center" as const,
  whiteSpace: "nowrap" as const,
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("fa-IR");
  } catch {
    return value;
  }
}

export default function ConsumablesPage() {
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<ConsumableMaterial[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<WithdrawalRow[]>([]);
  const [historySummary, setHistorySummary] = useState({ count: 0, total_cost: 0, total_quantity: 0 });
  const [historyQuery, setHistoryQuery] = useState("");

  const [withdrawTarget, setWithdrawTarget] = useState<ConsumableMaterial | null>(null);
  const [withdrawQty, setWithdrawQty] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [withdrawSaving, setWithdrawSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<ConsumableMaterial | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState<QtyUnit>("piece");
  const [editWarehouse, setEditWarehouse] = useState<"consumable" | "raw">("consumable");
  const [editSaving, setEditSaving] = useState(false);

  const loadMaterials = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      setMaterials([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await FetchWithJwtClient(
        "GET",
        `/api/consumable-materials?with_all_lots=1&search=${encodeURIComponent(query.trim())}`,
        token
      );
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت انبار مواد مصرفی"));
        setMaterials([]);
        return;
      }
      const rows = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setMaterials(rows as ConsumableMaterial[]);
    } catch {
      toast.error("خطا در دریافت انبار مواد مصرفی");
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadHistory = useCallback(async () => {
    const token = tokenCode();
    if (!token) return;
    setHistoryLoading(true);
    try {
      const res = await FetchWithJwtClient(
        "GET",
        `/api/consumable-withdrawals?paginate=1&per_page=50&search=${encodeURIComponent(historyQuery.trim())}`,
        token
      );
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت هیستوری برداشت"));
        setHistory([]);
        return;
      }
      setHistory(Array.isArray(res.data) ? res.data : []);
      setHistorySummary({
        count: Number(res.summary?.count) || 0,
        total_cost: Number(res.summary?.total_cost) || 0,
        total_quantity: Number(res.summary?.total_quantity) || 0,
      });
    } catch {
      toast.error("خطا در دریافت هیستوری برداشت");
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadMaterials();
    }, 280);
    return () => clearTimeout(timer);
  }, [loadMaterials]);

  useEffect(() => {
    if (tab !== 1) return;
    const timer = setTimeout(() => {
      void loadHistory();
    }, 280);
    return () => clearTimeout(timer);
  }, [tab, loadHistory]);

  const totals = useMemo(() => {
    const stock = materials.reduce((sum, row) => sum + (Number(row.stock) || 0), 0);
    const value = materials.reduce((sum, row) => sum + (Number(row.stock_value) || 0), 0);
    return { stock, value, count: materials.length };
  }, [materials]);

  const previewCost = useMemo(() => {
    if (!withdrawTarget) return 0;
    const piece = asQtyUnit(withdrawTarget.unit_type) === "piece";
    const rawNeed = parseAmountInput(withdrawQty) || parseFloat(withdrawQty) || 0;
    let need = piece ? Math.floor(rawNeed) : Math.round(rawNeed * 1000) / 1000;
    if (need <= 0) return 0;
    const lots = [...(withdrawTarget.lots || [])]
      .filter((lot) => Number(lot.remaining) > 0)
      .sort((a, b) => {
        const ta = a.purchased_at ? new Date(a.purchased_at).getTime() : 0;
        const tb = b.purchased_at ? new Date(b.purchased_at).getTime() : 0;
        if (ta !== tb) return ta - tb;
        return a.id - b.id;
      });
    let cost = 0;
    for (const lot of lots) {
      if (need <= 0) break;
      const take = Math.min(Number(lot.remaining) || 0, need);
      cost += take * (Number(lot.unit_cost) || 0);
      need -= take;
    }
    return Math.round(cost);
  }, [withdrawTarget, withdrawQty]);

  const openWithdraw = (row: ConsumableMaterial) => {
    setWithdrawTarget(row);
    setWithdrawQty("");
    setWithdrawNote("");
  };

  const submitWithdraw = async () => {
    if (!withdrawTarget) return;
    const piece = asQtyUnit(withdrawTarget.unit_type) === "piece";
    const rawQty = parseAmountInput(withdrawQty) || parseFloat(withdrawQty) || 0;
    const qty = piece ? Math.floor(rawQty) : Math.round(rawQty * 1000) / 1000;
    if (qty <= 0) {
      toast.error(piece ? "تعداد برداشت را وارد کنید" : "مقدار برداشت را وارد کنید");
      return;
    }
    setWithdrawSaving(true);
    try {
      const res = await FetchWithJwtClient("POST", `/api/consumable-materials/${withdrawTarget.id}/withdraw`, {
        quantity: qty,
        note: withdrawNote.trim() || "",
      });
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "برداشت انجام نشد"));
        return;
      }
      toast.success(
        `${formatQty(qty)} ${UNIT_LABEL[asQtyUnit(withdrawTarget.unit_type)]} «${withdrawTarget.name}» برداشت شد · ${formatAmountNumber(
          Number(res.total_cost) || previewCost
        )} تومان`
      );
      setWithdrawTarget(null);
      await loadMaterials();
      if (tab === 1) await loadHistory();
    } finally {
      setWithdrawSaving(false);
    }
  };

  const openEdit = (row: ConsumableMaterial) => {
    setEditTarget(row);
    setEditName(row.name);
    setEditUnit(asQtyUnit(row.unit_type));
    setEditWarehouse("consumable");
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    const name = editName.trim();
    if (!name) {
      toast.error("نام کالا را وارد کنید");
      return;
    }
    setEditSaving(true);
    try {
      const moving = editWarehouse === "raw";
      const res = await FetchWithJwtClient(
        moving ? "POST" : "PUT",
        moving
          ? `/api/consumable-materials/${editTarget.id}/move-to-raw`
          : `/api/consumable-materials/${editTarget.id}`,
        { name, unit_type: editUnit }
      );
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, moving ? "انتقال انجام نشد" : "ویرایش انجام نشد"));
        return;
      }
      toast.success(moving ? "کالا به انبار مواد اولیه منتقل شد" : "کالای انبار مصرفی ویرایش شد");
      setEditTarget(null);
      await loadMaterials();
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, pt: { xs: 1.25, md: 2 }, pb: { xs: "100px", md: 4 } }}>
      <ToastContainer position="top-center" autoClose={2500} rtl />
      <Container maxWidth="xl" sx={{ px: { xs: 1.25, md: 2 } }}>
        <Box sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 0.75 }}>
          <Inventory2Icon sx={{ fontSize: 20, color: "var(--admin-accent)" }} />
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "var(--admin-text)" }}>
            انبار مواد مصرفی
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 1,
            mb: 1.5,
          }}
        >
          {[
            { label: "تعداد اقلام", value: formatAmountNumber(totals.count) },
            { label: "جمع مقدار", value: formatQty(totals.stock) },
            { label: "ارزش موجودی (تومان)", value: formatAmountNumber(totals.value) },
          ].map((card) => (
            <Paper
              key={card.label}
              elevation={0}
              sx={{
                p: 1.25,
                borderRadius: 2,
                border: "1px solid var(--admin-border)",
                bgcolor: "var(--admin-surface)",
              }}
            >
              <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", mb: 0.35 }}>
                {card.label}
              </Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: "var(--admin-text)" }}>
                {card.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 1.5,
            minHeight: 36,
            "& .MuiTab-root": { minHeight: 36, fontSize: 13, fontWeight: 700 },
            "& .Mui-selected": { color: "var(--admin-accent) !important" },
            "& .MuiTabs-indicator": { backgroundColor: "var(--admin-accent)" },
          }}
        >
          <Tab icon={<Inventory2Icon sx={{ fontSize: 16 }} />} iconPosition="start" label="موجودی" />
          <Tab icon={<HistoryIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="هیستوری برداشت" />
        </Tabs>

        {tab === 0 ? (
          <>
            <TextField
              size="small"
              label="جستجوی نام کالا"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ ...fieldSx, mb: 1.5, minWidth: { xs: "100%", sm: 280 } }}
            />

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress size={28} sx={{ color: "var(--admin-accent)" }} />
              </Box>
            ) : materials.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: "center",
                  border: "1px solid var(--admin-border)",
                  borderRadius: 2,
                  bgcolor: "var(--admin-surface)",
                }}
              >
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
                  هنوز ماده مصرفی ثبت نشده. از فاکتور خرید با سوییچ «مواد مصرفی» خرید ثبت کنید.
                </Typography>
              </Paper>
            ) : (
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: "1px solid var(--admin-border)", borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "var(--admin-surface-alt)" }}>
                      <TableCell sx={{ ...cellSx, fontWeight: 800 }}>نام کالا</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 800 }}>واحد</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 800 }}>موجودی</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 800 }}>فی تمام‌شده بعدی</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 800 }}>ارزش موجودی</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 800 }}>عملیات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {materials.map((row) => {
                      const open = expandedId === row.id;
                      return (
                        <Fragment key={row.id}>
                          <TableRow hover>
                            <TableCell sx={cellSx}>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => setExpandedId(open ? null : row.id)}
                                  sx={{ color: "var(--admin-text-muted)", p: 0.25 }}
                                >
                                  {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                </IconButton>
                                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{row.name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={cellSx}>{UNIT_LABEL[asQtyUnit(row.unit_type)]}</TableCell>
                            <TableCell sx={{ ...cellSx, fontWeight: 800 }}>
                              {formatQty(Number(row.stock) || 0)}
                            </TableCell>
                            <TableCell sx={cellSx}>
                              {row.next_unit_cost != null
                                ? formatAmountNumber(Number(row.next_unit_cost))
                                : "—"}
                            </TableCell>
                            <TableCell sx={cellSx}>
                              {formatAmountNumber(Number(row.stock_value) || 0)}
                            </TableCell>
                            <TableCell sx={cellSx}>
                              <Button
                                size="small"
                                variant="text"
                                startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />}
                                onClick={() => openEdit(row)}
                                sx={{ ...adminButtonStartIconSx, fontSize: 11, minHeight: 28, color: "var(--admin-text)" }}
                              >
                                ویرایش
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<RemoveCircleOutlineIcon sx={{ fontSize: 15 }} />}
                                disabled={!row.stock}
                                onClick={() => openWithdraw(row)}
                                sx={{
                                  ...adminButtonStartIconSx,
                                  fontSize: 11,
                                  minHeight: 28,
                                  borderColor: "var(--admin-accent-border)",
                                  color: "var(--admin-accent)",
                                }}
                              >
                                برداشت
                              </Button>
                            </TableCell>
                          </TableRow>
                          {open ? (
                            <TableRow>
                              <TableCell colSpan={6} sx={{ bgcolor: "var(--admin-surface-alt)", py: 1.25 }}>
                                {(row.lots || []).length === 0 ? (
                                  <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", textAlign: "center" }}>
                                    لاتی ثبت نشده
                                  </Typography>
                                ) : (
                                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.65 }}>
                                    {(row.lots || []).map((lot) => (
                                      <Box
                                        key={lot.id}
                                        sx={{
                                          display: "grid",
                                          gridTemplateColumns: {
                                            xs: "1fr 1fr",
                                            sm: "1.2fr 1fr 1fr 1fr 1fr",
                                          },
                                          gap: 0.75,
                                          px: 1,
                                          py: 0.65,
                                          borderRadius: 1.25,
                                          border: "1px solid var(--admin-border)",
                                          bgcolor: "var(--admin-surface)",
                                          fontSize: 11.5,
                                          color: "var(--admin-text)",
                                        }}
                                      >
                                        <span>لات #{lot.id}</span>
                                        <span>خرید: {formatQty(Number(lot.quantity))}</span>
                                        <span>مانده: {formatQty(Number(lot.remaining))}</span>
                                        <span>فی تمام‌شده: {formatAmountNumber(Number(lot.unit_cost))}</span>
                                        <span>{formatDateTime(lot.purchased_at)}</span>
                                      </Box>
                                    ))}
                                  </Box>
                                )}
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        ) : (
          <>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5, alignItems: "center" }}>
              <TextField
                size="small"
                label="جستجو در هیستوری"
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                sx={{ ...fieldSx, minWidth: { xs: "100%", sm: 280 } }}
              />
              <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                {formatAmountNumber(historySummary.count)} برداشت · جمع مبلغ{" "}
                {formatAmountNumber(historySummary.total_cost)} تومان
              </Typography>
            </Box>

            {historyLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress size={28} sx={{ color: "var(--admin-accent)" }} />
              </Box>
            ) : history.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: "center",
                  border: "1px solid var(--admin-border)",
                  borderRadius: 2,
                  bgcolor: "var(--admin-surface)",
                }}
              >
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
                  هنوز برداشتی ثبت نشده است.
                </Typography>
              </Paper>
            ) : (
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: "1px solid var(--admin-border)", borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "var(--admin-surface-alt)" }}>
                      <TableCell sx={{ ...cellSx, fontWeight: 800 }}>تاریخ</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 800 }}>نام کالا</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 800 }}>مقدار</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 800 }}>مبلغ (FIFO)</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 800 }}>توضیح</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={cellSx}>{formatDateTime(row.withdrawn_at)}</TableCell>
                        <TableCell sx={{ ...cellSx, fontWeight: 700 }}>{row.material_name || "—"}</TableCell>
                        <TableCell sx={cellSx}>{formatQty(Number(row.quantity) || 0)}</TableCell>
                        <TableCell sx={{ ...cellSx, color: "var(--admin-accent)", fontWeight: 800 }}>
                          {formatAmountNumber(Number(row.total_cost) || 0)}
                        </TableCell>
                        <TableCell sx={{ ...cellSx, whiteSpace: "normal", maxWidth: 220 }}>
                          {row.note || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Container>

      <Dialog
        open={Boolean(withdrawTarget)}
        onClose={withdrawSaving ? undefined : () => setWithdrawTarget(null)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: "var(--admin-surface)",
            borderRadius: 2.5,
            border: "1px solid var(--admin-border)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 15, color: "var(--admin-text)" }}>
          برداشت «{withdrawTarget?.name}»
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.25, pt: 1 }}>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
            موجودی فعلی: {formatQty(Number(withdrawTarget?.stock) || 0)}{" "}
            {UNIT_LABEL[asQtyUnit(withdrawTarget?.unit_type)]} · کسر از لات‌های قدیمی‌تر
            (FIFO)
          </Typography>
          <TextField
            size="small"
            label={asQtyUnit(withdrawTarget?.unit_type) === "piece" ? "تعداد برداشت" : "مقدار برداشت"}
            value={withdrawQty}
            onChange={(e) =>
              setWithdrawQty(
                asQtyUnit(withdrawTarget?.unit_type) === "piece"
                  ? e.target.value.replace(/[^\d]/g, "")
                  : e.target.value.replace(/[^\d.]/g, "")
              )
            }
            sx={fieldSx}
            autoFocus
          />
          <TextField
            size="small"
            label="توضیح (اختیاری)"
            value={withdrawNote}
            onChange={(e) => setWithdrawNote(e.target.value)}
            sx={fieldSx}
          />
          <Box
            sx={{
              p: 1.1,
              borderRadius: 1.5,
              border: "1px solid var(--admin-border)",
              bgcolor: "var(--admin-surface-alt)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>مبلغ تمام‌شده تقریبی</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: "var(--admin-accent)" }}>
              {formatAmountNumber(previewCost)} تومان
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setWithdrawTarget(null)} disabled={withdrawSaving} sx={{ color: "var(--admin-text-muted)" }}>
            انصراف
          </Button>
          <Button
            variant="contained"
            onClick={() => void submitWithdraw()}
            disabled={withdrawSaving}
            sx={{
              backgroundColor: "var(--admin-accent)",
              fontWeight: 800,
              "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
            }}
          >
            {withdrawSaving ? "در حال ثبت..." : "ثبت برداشت"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(editTarget)}
        onClose={editSaving ? undefined : () => setEditTarget(null)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: "var(--admin-surface)",
            borderRadius: 2.5,
            border: "1px solid var(--admin-border)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 15, color: "var(--admin-text)" }}>
          ویرایش «{editTarget?.name}»
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.25, pt: 1 }}>
          <TextField
            size="small"
            label="نام کالا"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            sx={fieldSx}
            autoFocus
          />
          <TextField
            select
            size="small"
            label="واحد"
            value={editUnit}
            onChange={(e) => setEditUnit(asQtyUnit(e.target.value))}
            sx={fieldSx}
          >
            <MenuItem value="piece">عدد</MenuItem>
            <MenuItem value="kg">کیلو</MenuItem>
            <MenuItem value="liter">لیتر</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="انبار"
            value={editWarehouse}
            onChange={(e) => setEditWarehouse(e.target.value === "raw" ? "raw" : "consumable")}
            sx={fieldSx}
          >
            <MenuItem value="consumable">انبار مواد مصرفی</MenuItem>
            <MenuItem value="raw">انبار مواد اولیه</MenuItem>
          </TextField>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", lineHeight: 1.7 }}>
            {editWarehouse === "raw"
              ? "با ذخیره، فقط همین کالا با موجودی دست‌نخورده‌اش به انبار مواد اولیه می‌رود. اگر فاکتورش کالاهای مصرفی دیگری هم داشته باشد، آن کالاها در انبار مصرفی می‌مانند."
              : "اگر واحد اشتباه ثبت شده و هنوز برداشت یا استفاده در فرمول تولید ندارد، همان مقدار با واحد جدید خوانده می‌شود. مقدار کیلو و لیتر می‌تواند اعشار داشته باشد، مثل ۲٫۵."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setEditTarget(null)} disabled={editSaving} sx={{ color: "var(--admin-text-muted)" }}>
            انصراف
          </Button>
          <Button
            variant="contained"
            onClick={() => void submitEdit()}
            disabled={editSaving}
            sx={{
              backgroundColor: "var(--admin-accent)",
              fontWeight: 800,
              "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
            }}
          >
            {editSaving ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
