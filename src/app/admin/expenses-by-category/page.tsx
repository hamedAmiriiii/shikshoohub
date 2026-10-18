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
    if (node.children?.length) rows.push(...flattenTree(node.children, depth + 1));
  }
  return rows;
}

function categoryLabelOf(item: CategoryExpenseItem) {
  if (!item.accounting_account) return "—";
  return item.accounting_account.name;
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
  const [open, setOpen] = useState(depth < 1 || node.amount > 0);
  const selected = selectedId === node.id;
  const color = node.kind === "expense" ? "#e53935" : "#1e88e5";

  return (
    <Box>
      <Box
        onClick={() => onSelect(node)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.4,
          py: 0.35,
          px: 0.6,
          mr: depth * 0.9,
          mb: 0.3,
          borderRadius: "7px",
          cursor: "pointer",
          bgcolor: selected ? `${color}22` : "transparent",
          border: selected ? `1px solid ${color}` : "1px solid transparent",
          "&:hover": { bgcolor: `${color}14` },
        }}
      >
        {hasChildren ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            sx={{ color: "var(--admin-text-muted)", p: 0.1 }}
          >
            {open ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronLeftIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        ) : (
          <Box sx={{ width: 22 }} />
        )}
        <Typography
          sx={{
            flex: 1,
            minWidth: 0,
            color: "var(--admin-text)",
            fontSize: 11.5,
            fontWeight: selected || depth === 0 ? 700 : 500,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={`${node.code} ${node.name}`}
        >
          {node.name}
        </Typography>
        <Typography
          sx={{
            color: node.amount > 0 ? color : "var(--admin-text-muted)",
            fontWeight: 700,
            fontSize: 11,
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

function printExpenseList(input: {
  periodLabel: string;
  categoryLabel: string;
  totalAmount: number;
  items: CategoryExpenseItem[];
}) {
  const rows = input.items
    .map(
      (item) => `<tr>
        <td style="text-align:right">${item.date || ""}</td>
        <td style="text-align:right">${item.title || ""}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>لیست هزینه‌ها</title>
  <style>
    body { font-family: Tahoma, Arial, sans-serif; color: #111; padding: 16px; }
    h1 { font-size: 16px; margin: 0 0 6px; }
    .meta { font-size: 12px; color: #555; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; }
    th { background: #f3f5f8; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>لیست هزینه‌ها</h1>
  <div class="meta">بازه: ${input.periodLabel} · ${input.categoryLabel} · جمع: ${formatNumber(input.totalAmount)} تومان</div>
  <table>
    <thead><tr><th>تاریخ</th><th>عنوان هزینه</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="2" style="text-align:center">موردی نیست</td></tr>`}</tbody>
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
    ["کد", "نام دسته", "تعداد", "مبلغ (تومان)"],
  ];
  for (const row of input.treeRows) {
    summaryRows.push([row.code, `${"  ".repeat(row.depth)}${row.name}`, row.count, Math.round(row.amount)]);
  }

  const itemRows: Array<Array<string | number>> = [
    ["تاریخ", "عنوان", "دسته‌بندی", "ثبت‌کننده", "مبلغ (تومان)"],
  ];
  for (const item of input.items) {
    itemRows.push([
      item.date || "",
      item.title || "",
      categoryLabelOf(item),
      item.user_name || "",
      Math.round(item.amount),
    ]);
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  const itemsSheet = XLSX.utils.aoa_to_sheet(itemRows);
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
      if (accountId) params.push(`account_id=${accountId}`);
      return `/api/expenses-by-category?${params.join("&")}`;
    },
    [filterMode, dateRange],
  );

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const token = tokenCode();
    try {
      const res = await apiRequestError("Get", {}, {}, buildUrl(selectedNode?.id ?? null), true, true, token);
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
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

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
  const categoryLabel = selectedNode ? selectedNode.name : "همه دسته‌ها";
  const reportTotalAmount = selectedNode ? selectedNode.amount : data?.total_amount || 0;
  const reportTotalCount = selectedNode ? selectedNode.count : data?.total_count || 0;

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
            disabled={!data || loading}
            onClick={() =>
              printExpenseList({
                periodLabel,
                categoryLabel,
                totalAmount: listTotal,
                items,
              })
            }
            sx={{ borderColor: "var(--admin-border)", color: "var(--admin-text)" }}
          >
            پرینت
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<FileDownloadIcon />}
            disabled={!data || loading}
            onClick={() => {
              void downloadCategoryExcel({
                periodLabel,
                categoryLabel,
                totalAmount: reportTotalAmount,
                totalCount: reportTotalCount,
                treeRows,
                items,
              })
                .then(() => toast.success("فایل اکسل آماده شد"))
                .catch(() => toast.error("خطا در ساخت فایل اکسل"));
            }}
            sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
          >
            اکسل
          </Button>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: "14px",
          bgcolor: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 280px" },
            gap: 1.5,
            alignItems: "start",
          }}
        >
          <Box>
            <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 13, mb: 1 }}>
              فیلتر زمانی
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.25 }}>
              {FILTER_CHIPS.map((chip) => {
                const active = filterMode === chip.value && dateRange.length !== 2;
                return (
                  <Chip
                    key={chip.value}
                    size="small"
                    label={chip.label}
                    onClick={() => {
                      setFilterMode(chip.value);
                      setDateRange([]);
                    }}
                    sx={{
                      bgcolor: active ? "var(--admin-accent)" : "var(--admin-surface-alt)",
                      color: active ? "#fff" : "var(--admin-text)",
                      fontWeight: 600,
                      height: 28,
                    }}
                  />
                );
              })}
              {(filterMode !== "month" || dateRange.length > 0 || selectedNode) && (
                <Chip
                  size="small"
                  icon={<ClearIcon sx={{ fontSize: "14px !important" }} />}
                  label="پاک کردن"
                  onClick={handleResetPeriod}
                  sx={{ bgcolor: "var(--admin-error-bg)", color: "var(--admin-error)", fontWeight: 600, height: 28 }}
                />
              )}
            </Box>
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
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "var(--admin-surface-alt)",
                width: "100%",
                border: "1px solid var(--admin-border)",
              }}
              className="rmdp-mobile"
              placeholder="از تاریخ — تا تاریخ"
            />
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.75 }}>
              بازه: {periodLabel}
              {selectedNode ? ` · دسته: ${selectedNode.name}` : ""}
            </Typography>
          </Box>

          <Box
            sx={{
              border: "1px solid var(--admin-border)",
              borderRadius: "10px",
              bgcolor: "var(--admin-surface-alt)",
              p: 1,
              maxHeight: { xs: 220, md: 260 },
              overflow: "auto",
            }}
          >
            <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 12, mb: 0.75 }}>
              دسته‌بندی
            </Typography>
            {loading && !data ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={20} sx={{ color: "var(--admin-accent)" }} />
              </Box>
            ) : !data?.tree?.length ? (
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, textAlign: "center", py: 1 }}>
                دسته‌ای نیست
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
          </Box>
        </Box>
      </Paper>

      {loading && !data ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "30vh" }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : data ? (
        <>
          <Paper
            elevation={0}
            sx={{
              p: 1.75,
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
              <Box sx={{ bgcolor: "rgba(255,255,255,0.2)", borderRadius: "10px", p: 0.9, display: "flex" }}>
                <AttachMoneyIcon sx={{ color: "#fff", fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ color: "#fff", fontSize: 12, opacity: 0.9 }}>
                  {selectedNode ? `جمع ${selectedNode.name}` : "جمع کل هزینه‌ها"}
                </Typography>
                <Typography sx={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>
                  {formatNumber(reportTotalAmount)}
                  <Box component="span" sx={{ fontSize: 12, fontWeight: 500, mr: 0.75 }}>
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
            ref={listRef}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "14px",
              bgcolor: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
              <Box>
                <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 15 }}>
                  لیست هزینه‌ها
                </Typography>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                  {categoryLabel} · جمع: {formatNumber(listTotal)} تومان
                </Typography>
              </Box>
              {selectedNode && (
                <Button size="small" onClick={() => setSelectedNode(null)} sx={{ color: "var(--admin-accent)" }}>
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
                      <TableCell sx={{ color: "var(--admin-text)", fontWeight: 700 }}>دسته‌بندی</TableCell>
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
                          {categoryLabelOf(item)}
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
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "30vh" }}>
          <Typography sx={{ color: "var(--admin-text)", fontSize: 16 }}>داده‌ای برای نمایش وجود ندارد</Typography>
        </Box>
      )}

      <ToastContainer autoClose={3000} style={{ marginBottom: "76px", borderRadius: "15px" }} position="bottom-right" />
    </Box>
  );
}
