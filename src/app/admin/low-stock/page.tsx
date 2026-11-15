"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { tableCellClasses } from "@mui/material/TableCell";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { formatKg, materialUnitFromCode, type RawMaterialUnit } from "@/app/lib/productionCosting";

type LowStockKind = "product" | "raw_material";

type LowStockItem = {
  kind: LowStockKind;
  id: number;
  name: string;
  unit_type?: string | null;
  purchased: number;
  remaining: number;
  used: number;
  used_ratio: number;
  remaining_ratio: number;
  status?: "finished" | "running_out" | string;
};

type LowStockReport = {
  has_report?: boolean;
  can_calculate?: boolean;
  calculated_at?: string | null;
  calculated_date?: string | null;
  threshold_used_ratio?: number;
  items?: LowStockItem[];
  counts?: { products?: number; raw_materials?: number; total?: number };
  message?: string;
};

const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontWeight: 600,
    fontSize: 13,
    padding: "10px 12px",
    whiteSpace: "nowrap",
  },
  [`&.${tableCellClasses.body}`]: {
    color: "var(--admin-text)",
    fontSize: 13,
    padding: "10px 12px",
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  backgroundColor: "var(--admin-surface)",
  "&:nth-of-type(even)": {
    backgroundColor: "var(--admin-surface-alt)",
  },
  "&:hover": {
    backgroundColor: "var(--admin-menu-hover)",
  },
}));

function asUnit(unit?: string | null): RawMaterialUnit {
  if (unit === "piece" || unit === "liter") return unit;
  return "kg";
}

function kindLabel(kind: LowStockKind) {
  return kind === "raw_material" ? "مواد اولیه" : "کالای عادی";
}

function percentFa(ratio: number) {
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(Math.round((ratio || 0) * 100));
}

function formatCalculatedAt(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(d);
}

function normalizeReport(raw: unknown): LowStockReport {
  if (!raw || typeof raw !== "object") {
    return { has_report: false, can_calculate: true, items: [], counts: { total: 0, products: 0, raw_materials: 0 } };
  }
  const row = raw as LowStockReport & { report?: LowStockReport };
  if (row.report && typeof row.report === "object") {
    return { ...row.report, message: row.message };
  }
  return row;
}

export default function LowStockPage() {
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [report, setReport] = useState<LowStockReport | null>(null);
  const [filter, setFilter] = useState<"all" | LowStockKind>("all");

  const load = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", "/api/low-stock-report", token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت گزارش"));
        return;
      }
      const parsed = normalizeReport(res);
      setReport(parsed);
      if (parsed.message && !parsed.has_report) {
        toast.info(parsed.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const calculate = async () => {
    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      return;
    }
    setCalculating(true);
    try {
      const res = await FetchWithJwtClient("POST", "/api/low-stock-report/calculate", token, {});
      if (res?.hasError) {
        const parsed = normalizeReport(res);
        if (parsed.has_report) setReport(parsed);
        toast.error(getApiErrorMessage(res, "محاسبه انجام نشد"));
        return;
      }
      const parsed = normalizeReport(res);
      setReport(parsed);
      toast.success(parsed.message || "لیست بروزرسانی شد");
    } finally {
      setCalculating(false);
    }
  };

  const items = useMemo(() => {
    const list = Array.isArray(report?.items) ? report!.items! : [];
    if (filter === "all") return list;
    return list.filter((row) => row.kind === filter);
  }, [report, filter]);

  const canCalculate = Boolean(report?.can_calculate ?? true);
  const calculatedLabel = formatCalculatedAt(report?.calculated_at);
  const thresholdPct = percentFa(Number(report?.threshold_used_ratio ?? 0.5));

  return (
    <Box
      sx={{
        width: "100%",
        direction: "rtl",
        padding: "16px",
        paddingBottom: "100px",
        minHeight: "100vh",
        background: "var(--admin-bg-gradient)",
      }}
    >
      <ToastContainer position="top-center" rtl autoClose={3500} />

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WarningAmberIcon sx={{ color: "var(--admin-warning-strong)", fontSize: 22 }} />
            <Typography sx={{ color: "var(--admin-text)", fontSize: 18, fontWeight: 800 }}>
              کالاهای رو به اتمام
            </Typography>
          </Box>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12.5, mt: 0.5, maxWidth: 560 }}>
            کالاهای عادی و مواد اولیه که نسبت به مقدار خرید، بخش زیادی مصرف شده‌اند (حداقل {thresholdPct}٪).
            کالای تولیدی در این لیست نیست. محاسبه سنگین است و روزی یک‌بار قابل اجراست.
          </Typography>
          {calculatedLabel ? (
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mt: 0.75 }}>
              آخرین محاسبه: {calculatedLabel}
            </Typography>
          ) : (
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mt: 0.75 }}>
              هنوز محاسبه نشده — یک‌بار «محاسبه» را بزنید.
            </Typography>
          )}
        </Box>

        <Button
          variant="contained"
          startIcon={calculating ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
          disabled={calculating || loading || !canCalculate}
          onClick={() => void calculate()}
          sx={{
            background: "var(--admin-accent)",
            "&:hover": { background: "var(--admin-accent-hover)" },
            fontWeight: 700,
          }}
        >
          {canCalculate ? "محاسبه" : "امروز محاسبه شده"}
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Chip
          label={`همه (${report?.counts?.total ?? 0})`}
          onClick={() => setFilter("all")}
          color={filter === "all" ? "primary" : "default"}
          variant={filter === "all" ? "filled" : "outlined"}
        />
        <Chip
          label={`کالای عادی (${report?.counts?.products ?? 0})`}
          onClick={() => setFilter("product")}
          color={filter === "product" ? "primary" : "default"}
          variant={filter === "product" ? "filled" : "outlined"}
        />
        <Chip
          label={`مواد اولیه (${report?.counts?.raw_materials ?? 0})`}
          onClick={() => setFilter("raw_material")}
          color={filter === "raw_material" ? "primary" : "default"}
          variant={filter === "raw_material" ? "filled" : "outlined"}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : !report?.has_report ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            textAlign: "center",
          }}
        >
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, mb: 0.5 }}>
            هنوز گزارشی نیست
          </Typography>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
            با دکمه محاسبه، لیست کالاهای رو به اتمام ساخته می‌شود و تا محاسبه بعدی نگه داشته می‌شود.
          </Typography>
        </Paper>
      ) : items.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            textAlign: "center",
          }}
        >
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, mb: 0.5 }}>
            موردی در این فیلتر نیست
          </Typography>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
            {filter === "all"
              ? "بر اساس آخرین محاسبه، کالایی رو به اتمام تشخیص داده نشد."
              : "برای این دسته موردی در آخرین محاسبه نیست."}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: "1px solid var(--admin-border)" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <StyledTableCell align="center">ردیف</StyledTableCell>
                <StyledTableCell align="center">نام</StyledTableCell>
                <StyledTableCell align="center">نوع</StyledTableCell>
                <StyledTableCell align="center">خرید</StyledTableCell>
                <StyledTableCell align="center">مصرف</StyledTableCell>
                <StyledTableCell align="center">باقی‌مانده</StyledTableCell>
                <StyledTableCell align="center">درصد مصرف</StyledTableCell>
                <StyledTableCell align="center">وضعیت</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row, index) => {
                const unit = materialUnitFromCode(asUnit(row.unit_type));
                const finished = row.status === "finished" || Number(row.remaining) <= 0;
                return (
                  <StyledTableRow key={`${row.kind}-${row.id}`}>
                    <StyledTableCell align="center">{index + 1}</StyledTableCell>
                    <StyledTableCell align="center">
                      <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{row.name}</Typography>
                    </StyledTableCell>
                    <StyledTableCell align="center">{kindLabel(row.kind)}</StyledTableCell>
                    <StyledTableCell align="center">
                      {formatKg(row.purchased)} {unit}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {formatKg(row.used)} {unit}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {formatKg(row.remaining)} {unit}
                    </StyledTableCell>
                    <StyledTableCell align="center">{percentFa(row.used_ratio)}٪</StyledTableCell>
                    <StyledTableCell align="center">
                      <Chip
                        size="small"
                        label={finished ? "تمام شده" : "رو به اتمام"}
                        sx={{
                          fontWeight: 700,
                          background: finished ? "rgba(239, 83, 80, 0.16)" : "rgba(239, 108, 0, 0.16)",
                          color: finished ? "#c62828" : "#ef6c00",
                        }}
                      />
                    </StyledTableCell>
                  </StyledTableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
