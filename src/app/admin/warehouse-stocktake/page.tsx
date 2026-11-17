"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { tableCellClasses } from "@mui/material/TableCell";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PrintIcon from "@mui/icons-material/Print";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import {
  extractList,
  formatKg,
  isFinalProducedGood,
  materialUnitLabel,
  type ProducedGood,
  type RawMaterial,
} from "@/app/lib/productionCosting";
import { readShopFeatures, SHOP_FEATURES_CHANGED_EVENT } from "@/app/lib/shopFeatures";

type WarehouseKey = "raw" | "produced_final" | "produced_semi" | "consumable";

type StockRow = {
  key: string;
  warehouse: WarehouseKey;
  id: number;
  name: string;
  unitLabel: string;
  qty: number;
};

type ConsumableRow = {
  id: number;
  name: string;
  unit_type?: string | null;
  stock?: number;
};

const WAREHOUSE_LABEL: Record<WarehouseKey, string> = {
  raw: "انبار مواد اولیه",
  produced_final: "کالای تولیدی آماده",
  produced_semi: "کالای تولیدی نیمه‌آماده",
  consumable: "انبار مواد مصرفی",
};

const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontWeight: 700,
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
}));

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printStocktake(input: {
  title: string;
  hideStock: boolean;
  warehouses: string[];
  rows: StockRow[];
}) {
  const stockHeader = input.hideStock ? "" : "<th>موجودی سیستم</th>";
  const body = input.rows
    .map((row, index) => {
      const stockCell = input.hideStock
        ? ""
        : `<td>${escapeHtml(formatKg(row.qty))} ${escapeHtml(row.unitLabel)}</td>`;
      return `<tr>
        <td>${escapeHtml(new Intl.NumberFormat("fa-IR").format(index + 1))}</td>
        <td>${escapeHtml(String(row.id))}</td>
        <td style="text-align:right">${escapeHtml(row.name)}</td>
        <td>${escapeHtml(WAREHOUSE_LABEL[row.warehouse])}</td>
        <td>${escapeHtml(row.unitLabel)}</td>
        ${stockCell}
        <td class="blank">&nbsp;</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(input.title)}</title>
  <style>
    body { font-family: Tahoma, Arial, sans-serif; color: #111; padding: 14px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .meta { font-size: 12px; color: #444; margin-bottom: 12px; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #222; padding: 6px 5px; text-align: center; vertical-align: middle; }
    th { background: #f2f2f2; font-weight: 800; }
    td.blank { min-width: 90px; height: 22px; }
    @media print {
      body { padding: 0; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(input.title)}</h1>
  <div class="meta">
    تاریخ چاپ: ${escapeHtml(
      new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Tehran",
      }).format(new Date()),
    )}
    <br/>
    انبارها: ${escapeHtml(input.warehouses.join("، ") || "—")}
    ${input.hideStock ? "<br/>موجودی سیستم در این گزارش نمایش داده نشده است." : ""}
  </div>
  <table>
    <thead>
      <tr>
        <th>ردیف</th>
        <th>شناسه</th>
        <th>نام</th>
        <th>انبار</th>
        <th>واحد</th>
        ${stockHeader}
        <th>موجودی واقعی</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:0;top:0;width:900px;height:700px;border:0;opacity:0;pointer-events:none;z-index:-1";
  const cleanup = () => window.setTimeout(() => iframe.remove(), 400);
  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      iframe.remove();
      return;
    }
    frameWindow.addEventListener("afterprint", cleanup, { once: true });
    frameWindow.focus();
    frameWindow.print();
  };
  document.body.appendChild(iframe);
  iframe.srcdoc = html;
}

export default function WarehouseStocktakePage() {
  const [producedEnabled, setProducedEnabled] = useState(
    () => readShopFeatures().produced_goods_enabled,
  );
  const [selected, setSelected] = useState<Record<WarehouseKey, boolean>>({
    raw: true,
    produced_final: true,
    produced_semi: true,
    consumable: true,
  });
  const [hideStock, setHideStock] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [producedGoods, setProducedGoods] = useState<ProducedGood[]>([]);
  const [consumables, setConsumables] = useState<ConsumableRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sync = () => setProducedEnabled(readShopFeatures().produced_goods_enabled);
    sync();
    window.addEventListener(SHOP_FEATURES_CHANGED_EVENT, sync);
    return () => window.removeEventListener(SHOP_FEATURES_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => {
    setSelected((prev) => {
      if (!producedEnabled) {
        return { ...prev, raw: false, produced_final: false, produced_semi: false };
      }
      if (!prev.raw && !prev.produced_final && !prev.produced_semi) {
        return { ...prev, raw: true, produced_final: true, produced_semi: true };
      }
      return prev;
    });
  }, [producedEnabled]);

  const load = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      return;
    }
    setLoading(true);
    try {
      const tasks: Array<Promise<unknown>> = [
        producedEnabled
          ? FetchWithJwtClient("GET", "/api/raw-materials", token)
          : Promise.resolve(null),
        producedEnabled
          ? FetchWithJwtClient("GET", "/api/produced-goods", token)
          : Promise.resolve(null),
        FetchWithJwtClient("GET", "/api/consumable-materials", token),
      ];

      const [rawRes, producedRes, consumableRes] = await Promise.all(tasks);

      if (rawRes && typeof rawRes === "object" && (rawRes as { hasError?: boolean }).hasError) {
        toast.error(getApiErrorMessage(rawRes, "خطا در دریافت مواد اولیه"));
        setRawMaterials([]);
      } else if (rawRes) {
        setRawMaterials(extractList<RawMaterial>(rawRes));
      } else {
        setRawMaterials([]);
      }

      if (producedRes && typeof producedRes === "object" && (producedRes as { hasError?: boolean }).hasError) {
        toast.error(getApiErrorMessage(producedRes, "خطا در دریافت کالای تولیدی"));
        setProducedGoods([]);
      } else if (producedRes) {
        setProducedGoods(extractList<ProducedGood>(producedRes));
      } else {
        setProducedGoods([]);
      }

      if (
        consumableRes &&
        typeof consumableRes === "object" &&
        (consumableRes as { hasError?: boolean }).hasError
      ) {
        toast.error(getApiErrorMessage(consumableRes, "خطا در دریافت مواد مصرفی"));
        setConsumables([]);
      } else if (consumableRes) {
        setConsumables(extractList<ConsumableRow>(consumableRes));
      } else {
        setConsumables([]);
      }

      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [producedEnabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const list: StockRow[] = [];
    const q = search.trim().toLowerCase();

    if (producedEnabled && selected.raw) {
      for (const item of rawMaterials) {
        list.push({
          key: `raw-${item.id}`,
          warehouse: "raw",
          id: item.id,
          name: item.name || "—",
          unitLabel: materialUnitLabel(item),
          qty: Number(item.stock_kg) || 0,
        });
      }
    }

    if (producedEnabled && selected.produced_final) {
      for (const item of producedGoods) {
        if (!isFinalProducedGood(item)) continue;
        list.push({
          key: `pf-${item.id}`,
          warehouse: "produced_final",
          id: item.id,
          name: item.name || "—",
          unitLabel: materialUnitLabel(item),
          qty: Number(item.stock_kg) || 0,
        });
      }
    }

    if (producedEnabled && selected.produced_semi) {
      for (const item of producedGoods) {
        if (isFinalProducedGood(item)) continue;
        list.push({
          key: `ps-${item.id}`,
          warehouse: "produced_semi",
          id: item.id,
          name: item.name || "—",
          unitLabel: materialUnitLabel(item),
          qty: Number(item.stock_kg) || 0,
        });
      }
    }

    if (selected.consumable) {
      for (const item of consumables) {
        list.push({
          key: `c-${item.id}`,
          warehouse: "consumable",
          id: item.id,
          name: item.name || "—",
          unitLabel: materialUnitLabel(item),
          qty: Number(item.stock) || 0,
        });
      }
    }

    const filtered = q
      ? list.filter(
          (row) =>
            row.name.toLowerCase().includes(q) ||
            String(row.id).includes(q) ||
            WAREHOUSE_LABEL[row.warehouse].includes(search.trim()),
        )
      : list;

    return filtered.sort((a, b) => {
      if (a.warehouse !== b.warehouse) {
        return a.warehouse.localeCompare(b.warehouse);
      }
      return a.name.localeCompare(b.name, "fa");
    });
  }, [
    consumables,
    producedEnabled,
    producedGoods,
    rawMaterials,
    search,
    selected,
  ]);

  const selectedWarehouseLabels = useMemo(
    () =>
      (Object.keys(selected) as WarehouseKey[])
        .filter((key) => selected[key] && (producedEnabled || key === "consumable"))
        .map((key) => WAREHOUSE_LABEL[key]),
    [producedEnabled, selected],
  );

  const counts = useMemo(() => {
    const out: Partial<Record<WarehouseKey, number>> = {};
    for (const row of rows) {
      out[row.warehouse] = (out[row.warehouse] || 0) + 1;
    }
    return out;
  }, [rows]);

  const toggleWarehouse = (key: WarehouseKey) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrint = () => {
    if (rows.length === 0) {
      toast.info("موردی برای چاپ نیست");
      return;
    }
    setPrinting(true);
    try {
      printStocktake({
        title: "گزارش انبارداری",
        hideStock,
        warehouses: selectedWarehouseLabels,
        rows,
      });
    } finally {
      window.setTimeout(() => setPrinting(false), 500);
    }
  };

  const warehouseOptions: Array<{ key: WarehouseKey; disabled?: boolean }> = [
    { key: "raw", disabled: !producedEnabled },
    { key: "produced_final", disabled: !producedEnabled },
    { key: "produced_semi", disabled: !producedEnabled },
    { key: "consumable" },
  ];

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
            <FactCheckIcon sx={{ color: "var(--admin-accent)", fontSize: 22 }} />
            <Typography sx={{ color: "var(--admin-text)", fontSize: 18, fontWeight: 800 }}>
              انبارداری
            </Typography>
          </Box>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12.5, mt: 0.5, maxWidth: 620 }}>
            گزارش موجودی انبارها برای شمارش فیزیکی. ستون «موجودی واقعی» در چاپ خالی است تا بعد از پرینت پر شود.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            disabled={loading}
            onClick={() => void load()}
            sx={{
              color: "var(--admin-text)",
              borderColor: "var(--admin-border)",
              fontWeight: 700,
            }}
          >
            بروزرسانی
          </Button>
          <Button
            variant="contained"
            startIcon={printing ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
            disabled={printing || loading || rows.length === 0}
            onClick={handlePrint}
            sx={{
              background: "var(--admin-accent)",
              "&:hover": { background: "var(--admin-accent-hover)" },
              fontWeight: 700,
            }}
          >
            چاپ گزارش
          </Button>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 13, mb: 1 }}>
          انتخاب انبار
        </Typography>
        <FormGroup row sx={{ gap: 0.5, mb: 1.5 }}>
          {warehouseOptions.map(({ key, disabled }) => (
            <FormControlLabel
              key={key}
              disabled={disabled}
              control={
                <Checkbox
                  checked={Boolean(selected[key]) && !disabled}
                  onChange={() => toggleWarehouse(key)}
                  sx={{ color: "var(--admin-accent)", "&.Mui-checked": { color: "var(--admin-accent)" } }}
                />
              }
              label={
                <Typography sx={{ fontSize: 13, color: disabled ? "var(--admin-text-muted)" : "var(--admin-text)" }}>
                  {WAREHOUSE_LABEL[key]}
                  {counts[key] != null ? ` (${new Intl.NumberFormat("fa-IR").format(counts[key] || 0)})` : ""}
                </Typography>
              }
            />
          ))}
        </FormGroup>

        {!producedEnabled ? (
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 1.5 }}>
            برای مواد اولیه و کالای تولیدی، قابلیت تولید فروشگاه باید فعال باشد.
          </Typography>
        ) : null}

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={hideStock}
                onChange={(_, checked) => setHideStock(checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--admin-accent)" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "var(--admin-accent)",
                  },
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: 13, color: "var(--admin-text)" }}>
                عدم نمایش موجودی انبار
              </Typography>
            }
          />
          <TextField
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو نام یا شناسه"
            sx={{
              minWidth: { xs: "100%", sm: 240 },
              "& .MuiOutlinedInput-root": {
                background: "var(--admin-surface-alt)",
                color: "var(--admin-text)",
                "& fieldset": { borderColor: "var(--admin-border)" },
              },
              "& .MuiInputBase-input": { fontSize: 13 },
            }}
          />
        </Box>
      </Paper>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Chip
          label={`جمع ردیف‌ها: ${new Intl.NumberFormat("fa-IR").format(rows.length)}`}
          sx={{ fontWeight: 700, background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
        />
        {hideStock ? (
          <Chip
            label="موجودی سیستم مخفی است"
            sx={{ fontWeight: 700, background: "rgba(239, 108, 0, 0.12)", color: "#ef6c00" }}
          />
        ) : null}
      </Box>

      {loading && !loaded ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : rows.length === 0 ? (
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
            موردی برای نمایش نیست
          </Typography>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
            حداقل یک انبار را انتخاب کنید یا عبارت جستجو را تغییر دهید.
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ borderRadius: 2, border: "1px solid var(--admin-border)", overflowX: "auto" }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <StyledTableCell align="center">ردیف</StyledTableCell>
                <StyledTableCell align="center">شناسه</StyledTableCell>
                <StyledTableCell align="center">نام</StyledTableCell>
                <StyledTableCell align="center">انبار</StyledTableCell>
                <StyledTableCell align="center">واحد</StyledTableCell>
                {!hideStock ? <StyledTableCell align="center">موجودی سیستم</StyledTableCell> : null}
                <StyledTableCell align="center">موجودی واقعی</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <StyledTableRow key={row.key}>
                  <StyledTableCell align="center">
                    {new Intl.NumberFormat("fa-IR").format(index + 1)}
                  </StyledTableCell>
                  <StyledTableCell align="center">{row.id}</StyledTableCell>
                  <StyledTableCell align="center">
                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{row.name}</Typography>
                  </StyledTableCell>
                  <StyledTableCell align="center">{WAREHOUSE_LABEL[row.warehouse]}</StyledTableCell>
                  <StyledTableCell align="center">{row.unitLabel}</StyledTableCell>
                  {!hideStock ? (
                    <StyledTableCell align="center">
                      {formatKg(row.qty)} {row.unitLabel}
                    </StyledTableCell>
                  ) : null}
                  <StyledTableCell
                    align="center"
                    sx={{
                      minWidth: 96,
                      borderBottom: "1px dashed var(--admin-border)",
                      background: "rgba(0,0,0,0.02)",
                    }}
                  >
                    {" "}
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
