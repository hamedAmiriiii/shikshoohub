"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import {
  fetchSmartCustomers,
  SMART_SEGMENT_LABELS,
  SMART_TAG_LABELS,
  smartSegmentLabel,
  toFaNum,
  type SmartCustomerRow,
} from "@/app/lib/smartCustomer";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";

const fieldSx = {
  minWidth: 180,
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text)" },
  "& .MuiSelect-icon": { color: "var(--admin-text)" },
} as const;

export default function SmartClubCustomersPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SmartCustomerRow[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({ ...SMART_SEGMENT_LABELS });
  const [segment, setSegment] = useState(searchParams.get("segment") || "");
  const [tag, setTag] = useState(searchParams.get("tag") || "");
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSmartCustomers({
        segment: segment || undefined,
        tag: tag || undefined,
        search: search || undefined,
        per_page: 50,
      });
      setRows(res.data || []);
      setTotal(res.total || 0);
      setLabels({ ...SMART_SEGMENT_LABELS, ...(res.segment_labels || {}) });
    } catch (e) {
      toast.error(getApiErrorMessage(e, "خطا در دریافت مشتریان"));
    } finally {
      setLoading(false);
    }
  }, [segment, tag, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const segmentOptions = useMemo(() => {
    const keys = Object.keys({ ...SMART_SEGMENT_LABELS, ...labels });
    return keys.map((key) => ({ key, label: smartSegmentLabel(key, labels) }));
  }, [labels]);

  const selectedGroup = segment ? smartSegmentLabel(segment, labels) : "";

  return (
    <Box sx={{ ...adminPageSx, p: 1.5, pb: 10 }}>
      <ToastContainer position="top-center" rtl />
      <Typography sx={{ fontWeight: 800, fontSize: 17, color: "var(--admin-text)", mb: 0.25 }}>
        لیست مشتریان
      </Typography>
      <Typography sx={{ color: "var(--admin-text)", opacity: 0.7, fontSize: 12, mb: 1.5 }}>
        ببین کی تازه خریده، کی دیر اومده و کی مشتری ثابتته
        {selectedGroup ? ` · الان: ${selectedGroup}` : ""}
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <TextField
          select
          size="small"
          label="گروه مشتری"
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          sx={fieldSx}
        >
          <MenuItem value="">همه</MenuItem>
          {segmentOptions.map((item) => (
            <MenuItem key={item.key} value={item.key}>
              {item.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="وضعیت"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          sx={fieldSx}
        >
          <MenuItem value="">همه</MenuItem>
          {Object.entries(SMART_TAG_LABELS).map(([k, v]) => (
            <MenuItem key={k} value={k}>
              {v}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="جستجوی نام یا شماره"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ ...fieldSx, minWidth: 220 }}
        />
        <Button variant="contained" onClick={() => void load()}>
          نمایش
        </Button>
      </Box>
      <Typography sx={{ fontSize: 13, color: "var(--admin-text)", mb: 1 }}>
        {toFaNum(total)} مشتری
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ overflowX: "auto", border: "1px solid var(--admin-border)", borderRadius: 2, bgcolor: "var(--admin-surface)" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "var(--admin-text)", fontWeight: 700 }}>مشتری</TableCell>
                <TableCell sx={{ color: "var(--admin-text)", fontWeight: 700 }}>گروه</TableCell>
                <TableCell sx={{ color: "var(--admin-text)", fontWeight: 700 }}>چند روزه نیومده</TableCell>
                <TableCell sx={{ color: "var(--admin-text)", fontWeight: 700 }}>چند بار خریده</TableCell>
                <TableCell sx={{ color: "var(--admin-text)", fontWeight: 700 }}>جمع خرید</TableCell>
                <TableCell sx={{ color: "var(--admin-text)", fontWeight: 700 }}>معمولاً هر چند روز یک‌بار</TableCell>
                <TableCell sx={{ color: "var(--admin-text)", fontWeight: 700 }}>امتیاز خرید</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.phone}>
                  <TableCell>
                    <Typography fontWeight={600} sx={{ color: "var(--admin-text)" }}>
                      {r.name || "—"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--admin-text)", opacity: 0.7 }}>
                      {r.phone}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: "var(--admin-text)" }}>
                    {r.segment_label || smartSegmentLabel(r.primary_segment, labels)}
                  </TableCell>
                  <TableCell sx={{ color: "var(--admin-text)" }}>{toFaNum(r.recency_days)}</TableCell>
                  <TableCell sx={{ color: "var(--admin-text)" }}>{toFaNum(r.frequency)}</TableCell>
                  <TableCell sx={{ color: "var(--admin-text)" }}>{toFaNum(r.monetary)}</TableCell>
                  <TableCell sx={{ color: "var(--admin-text)" }}>
                    {r.avg_days_between != null ? toFaNum(r.avg_days_between) : "—"}
                  </TableCell>
                  <TableCell sx={{ color: "var(--admin-text)" }}>
                    {r.rfm_scores
                      ? `${r.rfm_scores.R || "-"}-${r.rfm_scores.F || "-"}-${r.rfm_scores.M || "-"}`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
