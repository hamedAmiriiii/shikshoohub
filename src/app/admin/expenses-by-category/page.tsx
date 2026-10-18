"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Button,
  Collapse,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PrintIcon from "@mui/icons-material/Print";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ClearIcon from "@mui/icons-material/Clear";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type FilterMode = "today" | "week" | "month" | "year" | "range";

interface CategoryNode {
  id: number;
  parent_id: number | null;
  code: string;
  name: string;
  level: string;
  kind: string;
  amount: number;
  count: number;
  direct_amount: number;
  direct_count: number;
  children: CategoryNode[];
}

interface CategoryExpenseItem {
  id: number;
  title: string;
  amount: number;
  type: string | null;
  date: string;
  user_name: string | null;
  accounting_account_id: number;
  accounting_account: { id: number; code: string; name: string } | null;
}

interface CategoryReport {
  tree: CategoryNode[];
  total_amount: number;
  total_count: number;
  items: CategoryExpenseItem[];
  selected_account: {
    id: number;
    code: string;
    name: string;
    amount: number;
    count: number;
  } | null;
  meta?: { accounting_ready?: boolean; filter?: string };
}

const formatNumber = (num: number) => new Intl.NumberFormat("fa-IR").format(num);

const FILTER_LABEL: Record<FilterMode, string> = {
  today: "امروز",
  week: "این هفته",
  month: "ماه جاری",
  year: "سال جاری",
  range: "بازه انتخابی",
};

const FILTER_CHIPS: Array<{ value: FilterMode; label: string }> = [
  { value: "today", label: "روزانه" },
  { value: "week", label: "هفتگی" },
  { value: "month", label: "ماهانه" },
  { value: "year", label: "سالانه" },
];

function flattenTree(
  nodes: CategoryNode[],
  depth = 0,
): Array<CategoryNode & { depth: number }> {
  const rows: Array<CategoryNode & { depth: number }> = [];
  for (const node of nodes) {
    rows.push({ ...node, depth });
    if (node.children?.length) {
      rows.push(...flattenTree(node.children, depth + 1));
    }
  }
  return rows;
}

function CategoryTreeNode({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: CategoryNode;
  depth: number;
  selectedId: number | null;
  onSelect: (node: CategoryNode) => void;
}) {
  const hasChildren = node.children.length > 0;
  const [open, setOpen] = useState(depth < 2 || node.amount > 0);
  const selected = selectedId === node.id;
  const color = node.kind === "expense" ? "#e53935" : "#1e88e5";

  return (
    <Box>
      <Box
        onClick={() => onSelect(node)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          py: 0.85,
          px: 1,
          mr: depth * 1.25,
          mb: 0.5,
          borderRadius: "10px",
          cursor: "pointer",
          bgcolor: selected ? `${color}22` : depth === 0 ? `${color}14` : "var(--admin-surface)",
          border: `1px solid ${selected ? color : "var(--admin-border)"}`,
          borderInlineStart: `3px solid ${color}`,
          transition: "background-color .15s, border-color .15s",
          "&:hover": { bgcolor: `${color}18` },
        }}
      >
        {hasChildren ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            sx={{ color: "var(--admin-text-muted)", p: 0.25 }}
          >
            {open ? <ExpandMoreIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        ) : (
          <Box sx={{ width: 28 }} />
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              color: "var(--admin-text)",
              fontSize: depth === 0 ? 14 : 13,
              fontWeight: depth === 0 ? 800 : selected ? 700 : 500,
              lineHeight: 1.35,
            }}
          >
            <Box component="span" sx={{ color: "var(--admin-text-muted)", fontWeight: 600, ml: 0.5 }}>
              {node.code}
            </Box>
            {node.name}
          </Typography>
          {node.count > 0 && (
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.15 }}>
              {formatNumber(node.count)} مورد
            </Typography>
          )}
        </Box>

        <Typography
          sx={{
            color: node.amount > 0 ? color : "var(--admin-text-muted)",
            fontWeight: 700,
            fontSize: 13,
            whiteSpace: "nowrap",
          }}
        >
          {formatNumber(node.amount)}
        </Typography>
      </Box>

      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </Collapse>
      )}
    </Box>
  );
}

function printCategoryReport(input: {
  periodLabel: string;
  categoryLabel: string;
  totalAmount: number;
  totalCount: number;
  treeRows: Array<CategoryNode & { depth: number }>;
  items: CategoryExpenseItem[];
}) {
  const treeHtml = input.treeRows
    .map((row) => {
      const pad = "&nbsp;".repeat(row.depth * 4);
      return `<tr>
        <td style="text-align:right">${pad}${row.code} — ${row.name}</td>
        <td style="text-align:center">${formatNumber(row.count)}</td>
        <td style="text-align:left">${formatNumber(row.amount)}</td>
      </tr>`;
    })
    .join("");

  const itemsHtml = input.items
    .map(
      (item) => `<tr>
        <td style="text-align:right">${item.date || ""}</td>
        <td style="text-align:right">${item.title || ""}</td>
        <td style="text-align:right">${item.accounting_account ? `${item.accounting_account.code} — ${item.accounting_account.name}` : ""}</td>
        <td style="text-align:right">${item.user_name || ""}</td>
        <td style="text-align:left">${formatNumber(item.amount)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>گزارش هزینه به تفکیک دسته</title>
  <style>
    body { font-family: Tahoma, Arial, sans-serif; color: #111; padding: 16px; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    .meta { font-size: 12px; color: #555; margin-bottom: 16px; }
    .summary { display: flex; gap: 24px; margin-bottom: 18px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; }
    th { background: #f3f5f8; }
    h2 { font-size: 14px; margin: 18px 0 8px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>گزارش هزینه به تفکیک دسته</h1>
  <div class="meta">بازه: ${input.periodLabel} · دسته: ${input.categoryLabel} · فقط هزینه‌های جاری</div>
  <div class="summary">
    <div>جمع مبلغ: <strong>${formatNumber(input.totalAmount)}</strong> تومان</div>
    <div>تعداد: <strong>${formatNumber(input.totalCount)}</strong> مورد</div>
  </div>
  <h2>گزارش دسته‌بندی</h2>
  <table>
    <thead><tr><th>دسته</th><th>تعداد</th><th>مبلغ (تومان)</th></tr></thead>
    <tbody>${treeHtml || `<tr><td colspan="3" style="text-align:center">موردی نیست</td></tr>`}</tbody>
  </table>
  <h2>لیست هزینه‌ها</h2>
  <table>
    <thead><tr><th>تاریخ</th><th>عنوان</th><th>حساب</th><th>ثبت‌کننده</th><th>مبلغ (تومان)</th></tr></thead>
    <tbody>${itemsHtml || `<tr><td colspan="5" style="text-align:center">موردی نیست</td></tr>`}</tbody>
  </table>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) return;
    frameWindow.focus();
    frameWindow.print();
    setTimeout(() => iframe.remove(), 1000);
  };
  document.body.appendChild(iframe);
  iframe.srcdoc = html;
}

async function downloadCategoryExcel(input: {
  periodLabel: string;
  categoryLabel: string;
  totalAmount: number;
  totalCount: number;
  treeRows: Array<CategoryNode & { depth: number }>;
  items: CategoryExpenseItem[];
}) {
  const XLSX = await import("xlsx");

  const summaryRows: Array<Array<string | number>> = [
    ["گزارش هزینه به تفکیک دسته"],
    ["بازه", input.periodLabel],
    ["دسته", input.categoryLabel],
    ["جمع مبلغ (تومان)", Math.round(input.totalAmount)],
    ["تعداد", input.totalCount],
    [],
    ["کد", "نام دسته", "سطح", "تعداد", "مبلغ (تومان)"],
  ];
  for (const row of input.treeRows) {
    summaryRows.push([
      row.code,
      `${"  ".repeat(row.depth)}${row.name}`,
      row.level,
      row.count,
      Math.round(row.amount),
    ]);
  }

  const itemRows: Array<Array<string | number>> = [
    ["تاریخ", "عنوان", "کد حساب", "نام حساب", "ثبت‌کننده", "مبلغ (تومان)"],
  ];
  for (const item of input.items) {
    itemRows.push([
      item.date || "",
      item.title || "",
      item.accounting_account?.code || "",
      item.accounting_account?.name || "",
      item.user_name || "",
      Math.round(item.amount),
    ]);
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 12 }, { wch: 28 }, { wch: 12 }, { wch: 10 }, { wch: 16 }];
  const itemsSheet = XLSX.utils.aoa_to_sheet(itemRows);
  itemsSheet["!cols"] = [{ wch: 12 }, { wch: 28 }, { wch: 10 }, { wch: 22 }, { wch: 16 }, { wch: 14 }];

  const book = XLSX.utils.book_new();
  book.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(book, summarySheet, "گزارش دسته");
  XLSX.utils.book_append_sheet(book, itemsSheet, "لیست هزینه‌ها");
  XLSX.writeFile(book, `هزینه-تفکیک-دسته-${Date.now()}.xlsx`);
}

export default function ExpensesByCategoryPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CategoryReport | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("month");
  const [dateRange, setDateRange] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<CategoryNode | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const buildUrl = useCallback(
    (accountId?: number | null) => {
      const params: string[] = [];
      if (filterMode === "range" && dateRange.length === 2) {
        const from_date = {
          year: dateRange[0].year,
          month: dateRange[0].month.number,
          day: dateRange[0].day,
        };
        const to_date = {
          year: dateRange[1].year,
          month: dateRange[1].month.number,
          day: dateRange[1].day,
        };
        params.push(
          `filter=range&from_date=${encodeURIComponent(JSON.stringify(from_date))}&to_date=${encodeURIComponent(JSON.stringify(to_date))}`,
        );
      } else {
        params.push(`filter=${filterMode === "range" ? "month" : filterMode}`);
      }
      if (accountId) {
        params.push(`account_id=${accountId}`);
      }
      return `/api/expenses-by-category?${params.join("&")}`;
    },
    [filterMode, dateRange],
  );

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const token = tokenCode();
    try {
      const url = buildUrl(selectedNode?.id ?? null);
      const res = await apiRequestError("Get", {}, {}, url, true, true, token);
      if (res.hasError) {
        let message = "خطا در دریافت گزارش";
        try {
          message = JSON.parse(res.errorText)?.message || message;
        } catch {
          /* ignore */
        }
        toast.error(message);
        return;
      }
      const report = res as CategoryReport;
      setData(report);
      if (selectedNode && report.selected_account) {
        setSelectedNode((prev) =>
          prev
            ? {
                ...prev,
                amount: report.selected_account!.amount,
                count: report.selected_account!.count,
                name: report.selected_account!.name,
                code: report.selected_account!.code,
              }
            : prev,
        );
      }
    } catch {
      toast.error("خطا در دریافت گزارش دسته‌بندی هزینه‌ها");
    } finally {
      setLoading(false);
    }
  }, [buildUrl, selectedNode?.id]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  const handleSelectNode = (node: CategoryNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
    setTimeout(() => {
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleClearCategory = () => setSelectedNode(null);

  const handleResetPeriod = () => {
    setDateRange([]);
    setFilterMode("month");
    setSelectedNode(null);
  };

  const treeRows = useMemo(() => flattenTree(data?.tree || []), [data?.tree]);
  const items = data?.items || [];
  const listTotal = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [items],
  );
  const periodLabel =
    filterMode === "range" && dateRange.length === 2
      ? `${dateRange[0].year}/${dateRange[0].month.number}/${dateRange[0].day} تا ${dateRange[1].year}/${dateRange[1].month.number}/${dateRange[1].day}`
      : FILTER_LABEL[filterMode];
  const categoryLabel = selectedNode
    ? `${selectedNode.code} — ${selectedNode.name}`
    : "همه دسته‌ها";
  const reportTotalAmount = selectedNode ? selectedNode.amount : data?.total_amount || 0;
  const reportTotalCount = selectedNode ? selectedNode.count : data?.total_count || 0;

  const handlePrint = () => {
    if (!data) return;
    printCategoryReport({
      periodLabel,
      categoryLabel,
      totalAmount: reportTotalAmount,
      totalCount: reportTotalCount,
      treeRows,
      items,
    });
  };

  const handleExcel = async () => {
    if (!data) return;
    try {
      await downloadCategoryExcel({
        periodLabel,
        categoryLabel,
        totalAmount: reportTotalAmount,
        totalCount: reportTotalCount,
        treeRows,
        items,
      });
      toast.success("فایل اکسل آماده شد");
    } catch {
      toast.error("خطا در ساخت فایل اکسل");
    }
  };

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
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, gap: 1, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AccountTreeIcon sx={{ color: "var(--admin-accent)", fontSize: 22 }} />
          <Typography sx={{ color: "var(--admin-text)", fontSize: 16, fontWeight: 700 }}>
            هزینه به تفکیک دسته
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={!data || loading}
            sx={{ borderColor: "var(--admin-border)", color: "var(--admin-text)" }}
          >
            پرینت
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={() => void handleExcel()}
            disabled={!data || loading}
            sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
          >
            اکسل
          </Button>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: "14px",
          bgcolor: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 14, mb: 1.25 }}>
          فیلتر
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
          {FILTER_CHIPS.map((chip) => {
            const active = filterMode === chip.value && dateRange.length !== 2;
            return (
              <Chip
                key={chip.value}
                label={chip.label}
                onClick={() => {
                  setFilterMode(chip.value);
                  setDateRange([]);
                }}
                sx={{
                  bgcolor: active ? "var(--admin-accent)" : "var(--admin-surface-alt)",
                  color: active ? "#fff" : "var(--admin-text)",
                  fontWeight: 600,
                }}
              />
            );
          })}
          {(filterMode !== "month" || dateRange.length > 0 || selectedNode) && (
            <Chip
              icon={<ClearIcon sx={{ fontSize: "16px !important" }} />}
              label="پاک کردن"
              onClick={handleResetPeriod}
              sx={{ bgcolor: "var(--admin-error-bg)", color: "var(--admin-error)", fontWeight: 600 }}
            />
          )}
        </Box>
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 0.75 }}>
          بازه دلخواه:
        </Typography>
        <DatePicker
          range
          value={dateRange}
          onChange={(dates: any) => {
            setDateRange(dates || []);
            if (dates?.length === 2) setFilterMode("range");
          }}
          calendar={persian}
          locale={persian_fa}
          calendarPosition="bottom-center"
          style={{
            height: "44px",
            borderRadius: "12px",
            backgroundColor: "var(--admin-surface-alt)",
            width: "100%",
            border: "1px solid var(--admin-border)",
          }}
          className="rmdp-mobile"
          placeholder="از تاریخ — تا تاریخ"
        />
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mt: 1 }}>
          بازه فعال: {periodLabel}
          {selectedNode ? ` · دسته انتخاب‌شده: ${categoryLabel}` : ""}
        </Typography>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh" }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : data ? (
        <>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: "14px",
              background: "linear-gradient(135deg, var(--admin-accent) 0%, var(--admin-accent-hover) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box sx={{ bgcolor: "rgba(255,255,255,0.2)", borderRadius: "10px", p: 1, display: "flex" }}>
                <AttachMoneyIcon sx={{ color: "#fff" }} />
              </Box>
              <Box>
                <Typography sx={{ color: "#fff", fontSize: 13, opacity: 0.9 }}>
                  {selectedNode ? `جمع ${selectedNode.name}` : "جمع کل هزینه‌ها"}
                </Typography>
                <Typography sx={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>
                  {formatNumber(reportTotalAmount)}
                  <Box component="span" sx={{ fontSize: 13, fontWeight: 500, mr: 0.75 }}>
                    تومان
                  </Box>
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`${formatNumber(reportTotalCount)} مورد`}
              sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700 }}
            />
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: "14px",
              bgcolor: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 15, mb: 0.5 }}>
              گزارش دسته‌بندی
            </Typography>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 1.5 }}>
              روی هر دسته کلیک کنید تا لیست هزینه‌های همان بخش پایین صفحه فیلتر شود.
            </Typography>

            {data.tree.length === 0 ? (
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, py: 4, textAlign: "center" }}>
                در این بازه هزینه‌ای ثبت نشده است
              </Typography>
            ) : (
              data.tree.map((node) => (
                <CategoryTreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  selectedId={selectedNode?.id ?? null}
                  onSelect={handleSelectNode}
                />
              ))
            )}
          </Paper>

          <Paper
            ref={listRef}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "14px",
              bgcolor: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
              <Box>
                <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 15 }}>
                  لیست هزینه‌ها
                </Typography>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                  {categoryLabel} · جمع لیست: {formatNumber(listTotal)} تومان
                </Typography>
              </Box>
              {selectedNode && (
                <Button size="small" onClick={handleClearCategory} sx={{ color: "var(--admin-accent)" }}>
                  نمایش همه
                </Button>
              )}
            </Box>

            {items.length === 0 ? (
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, py: 3, textAlign: "center" }}>
                هزینه‌ای برای نمایش نیست
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: "var(--admin-text)", fontWeight: 700 }}>تاریخ</TableCell>
                      <TableCell sx={{ color: "var(--admin-text)", fontWeight: 700 }}>عنوان</TableCell>
                      <TableCell sx={{ color: "var(--admin-text)", fontWeight: 700 }}>حساب</TableCell>
                      <TableCell sx={{ color: "var(--admin-text)", fontWeight: 700 }}>ثبت‌کننده</TableCell>
                      <TableCell align="left" sx={{ color: "var(--admin-text)", fontWeight: 700 }}>
                        مبلغ
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ color: "var(--admin-text)", whiteSpace: "nowrap" }}>{item.date}</TableCell>
                        <TableCell sx={{ color: "var(--admin-text)" }}>{item.title}</TableCell>
                        <TableCell sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                          {item.accounting_account
                            ? `${item.accounting_account.code} — ${item.accounting_account.name}`
                            : "—"}
                        </TableCell>
                        <TableCell sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                          {item.user_name || "—"}
                        </TableCell>
                        <TableCell align="left" sx={{ color: "#e53935", fontWeight: 700, whiteSpace: "nowrap" }}>
                          {formatNumber(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} sx={{ color: "var(--admin-text)", fontWeight: 800 }}>
                        مجموع
                      </TableCell>
                      <TableCell align="left" sx={{ color: "var(--admin-accent)", fontWeight: 800, whiteSpace: "nowrap" }}>
                        {formatNumber(listTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh" }}>
          <Typography sx={{ color: "var(--admin-text)", fontSize: 16 }}>داده‌ای برای نمایش وجود ندارد</Typography>
        </Box>
      )}

      <ToastContainer autoClose={3000} style={{ marginBottom: "76px", borderRadius: "15px" }} position="bottom-right" />
    </Box>
  );
}
