"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Collapse,
  Chip,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import BottomSheetModal from "@/app/coponent/BottomSheetModal";
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

export default function ExpensesByCategoryPage() {
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [data, setData] = useState<CategoryReport | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("month");
  const [dateRange, setDateRange] = useState<any[]>([]);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<CategoryNode | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [items, setItems] = useState<CategoryExpenseItem[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<CategoryReport["selected_account"]>(null);

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
        params.push(`filter=${filterMode}`);
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
      const res = await apiRequestError("Get", {}, {}, buildUrl(), true, true, token);
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
      setData(res as CategoryReport);
      setSelectedNode(null);
      setItems([]);
      setSelectedMeta(null);
      setDetailOpen(false);
    } catch {
      toast.error("خطا در دریافت گزارش دسته‌بندی هزینه‌ها");
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleSelectNode = async (node: CategoryNode) => {
    setSelectedNode(node);
    setDetailOpen(true);
    setDetailLoading(true);
    const token = tokenCode();
    try {
      const res = await apiRequestError("Get", {}, {}, buildUrl(node.id), true, true, token);
      if (res.hasError) {
        toast.error("خطا در دریافت هزینه‌های این دسته");
        return;
      }
      const report = res as CategoryReport;
      setItems(report.items || []);
      setSelectedMeta(report.selected_account);
    } catch {
      toast.error("خطا در دریافت هزینه‌های این دسته");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleClearFilters = () => {
    setDateRange([]);
    setFilterMode("month");
    setFilterSheetOpen(false);
  };

  const hasActiveFilters = filterMode !== "month" || dateRange.length > 0;

  const FilterComponent = () => (
    <Box sx={{ padding: "16px" }}>
      <Box sx={{ marginBottom: "16px" }}>
        <Typography sx={{ color: "#000", fontSize: "14px", mb: 1 }}>فیلتر بر اساس تاریخ (از - تا):</Typography>
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
            height: "50px",
            borderRadius: "15px",
            backgroundColor: "var(--admin-surface)",
            width: "100%",
          }}
          className="rmdp-mobile"
          placeholder="انتخاب بازه تاریخ"
        />
      </Box>

      <Box sx={{ marginTop: "16px" }}>
        <Typography sx={{ color: "#000", marginBottom: "8px", fontSize: "14px" }}>فیلتر زمانی:</Typography>
        <RadioGroup
          row
          value={filterMode === "range" ? "month" : filterMode}
          onChange={(e) => {
            setFilterMode(e.target.value as FilterMode);
            setDateRange([]);
          }}
          sx={{ justifyContent: "space-around", flexWrap: "wrap", "& .MuiFormControlLabel-root": { margin: 0 } }}
        >
          <FormControlLabel value="today" control={<Radio sx={{ color: "#1f9ad1", "&.Mui-checked": { color: "#1f9ad1" } }} />} label="روزانه" sx={{ color: "#000" }} disabled={dateRange.length === 2} />
          <FormControlLabel value="week" control={<Radio sx={{ color: "#1f9ad1", "&.Mui-checked": { color: "#1f9ad1" } }} />} label="هفتگی" sx={{ color: "#000" }} disabled={dateRange.length === 2} />
          <FormControlLabel value="month" control={<Radio sx={{ color: "#1f9ad1", "&.Mui-checked": { color: "#1f9ad1" } }} />} label="ماهانه" sx={{ color: "#000" }} disabled={dateRange.length === 2} />
          <FormControlLabel value="year" control={<Radio sx={{ color: "#1f9ad1", "&.Mui-checked": { color: "#1f9ad1" } }} />} label="سالانه" sx={{ color: "#000" }} disabled={dateRange.length === 2} />
        </RadioGroup>
      </Box>

      {hasActiveFilters && (
        <Box sx={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={handleClearFilters}
            sx={{
              color: "var(--admin-error)",
              borderColor: "var(--admin-error)",
              "&:hover": { borderColor: "#ff6666", backgroundColor: "var(--admin-error-bg)" },
            }}
          >
            بازگشت به ماه جاری
          </Button>
        </Box>
      )}
    </Box>
  );

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
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AccountTreeIcon sx={{ color: "var(--admin-accent)", fontSize: 22 }} />
          <Box>
            <Typography sx={{ color: "var(--admin-text)", fontSize: 16, fontWeight: 700 }}>
              هزینه به تفکیک دسته
            </Typography>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
              {FILTER_LABEL[filterMode]} · جاری
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={() => setFilterSheetOpen(true)}
          sx={{
            bgcolor: hasActiveFilters ? "var(--admin-accent)" : "var(--admin-surface)",
            color: hasActiveFilters ? "#fff" : "var(--admin-text)",
            border: "1px solid var(--admin-border)",
            "&:hover": { bgcolor: hasActiveFilters ? "var(--admin-accent-hover)" : "var(--admin-surface-alt)" },
          }}
        >
          <FilterListIcon />
        </IconButton>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
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
              <Box
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  borderRadius: "10px",
                  p: 1,
                  display: "flex",
                }}
              >
                <AttachMoneyIcon sx={{ color: "#fff" }} />
              </Box>
              <Box>
                <Typography sx={{ color: "#fff", fontSize: 13, opacity: 0.9 }}>جمع هزینه‌ها</Typography>
                <Typography sx={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>
                  {formatNumber(data.total_amount)}
                  <Box component="span" sx={{ fontSize: 13, fontWeight: 500, mr: 0.75 }}>
                    تومان
                  </Box>
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`${formatNumber(data.total_count)} مورد`}
              sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700 }}
            />
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "14px",
              bgcolor: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 15, mb: 1.5 }}>
              درخت دسته‌بندی
            </Typography>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 1.5 }}>
              روی هر دسته کلیک کنید تا هزینه‌های همان بخش دیده شود.
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
        </>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh" }}>
          <Typography sx={{ color: "var(--admin-text)", fontSize: 16 }}>داده‌ای برای نمایش وجود ندارد</Typography>
        </Box>
      )}

      <BottomSheetModal open={filterSheetOpen} onClose={() => setFilterSheetOpen(false)}>
        <FilterComponent />
      </BottomSheetModal>

      <BottomSheetModal open={detailOpen} onClose={() => setDetailOpen(false)}>
        <Box sx={{ p: 2, pb: 4 }}>
          <Typography sx={{ color: "#000", fontWeight: 800, fontSize: 15, mb: 0.5 }}>
            {selectedMeta?.name || selectedNode?.name || "هزینه‌های دسته"}
          </Typography>
          {(selectedMeta?.code || selectedNode?.code) && (
            <Typography sx={{ color: "#666", fontSize: 12, mb: 1.5 }}>
              کد {selectedMeta?.code || selectedNode?.code}
              {" · "}
              {formatNumber(selectedMeta?.amount ?? selectedNode?.amount ?? 0)} تومان
              {" · "}
              {formatNumber(selectedMeta?.count ?? selectedNode?.count ?? 0)} مورد
            </Typography>
          )}

          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} sx={{ color: "#1f9ad1" }} />
            </Box>
          ) : items.length === 0 ? (
            <Typography sx={{ color: "#666", fontSize: 13, textAlign: "center", py: 3 }}>
              هزینه‌ای در این دسته نیست
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {items.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 1.5,
                    borderRadius: "12px",
                    bgcolor: "#f7f9fc",
                    border: "1px solid #e3e8f0",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.5 }}>
                    <Typography sx={{ color: "#111", fontWeight: 700, fontSize: 13, flex: 1 }}>
                      {item.title}
                    </Typography>
                    <Typography sx={{ color: "#e53935", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap" }}>
                      {formatNumber(item.amount)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
                    <Typography sx={{ color: "#666", fontSize: 11 }}>{item.date}</Typography>
                    {item.type && (
                      <Chip label={item.type} size="small" sx={{ height: 20, fontSize: 10, bgcolor: "#e8f4fb" }} />
                    )}
                    {item.user_name && (
                      <Typography sx={{ color: "#666", fontSize: 11 }}>{item.user_name}</Typography>
                    )}
                    {item.accounting_account && (
                      <Typography sx={{ color: "#888", fontSize: 11 }}>
                        {item.accounting_account.code} · {item.accounting_account.name}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </BottomSheetModal>

      <ToastContainer autoClose={3000} style={{ marginBottom: "76px", borderRadius: "15px" }} position="bottom-right" />
    </Box>
  );
}
