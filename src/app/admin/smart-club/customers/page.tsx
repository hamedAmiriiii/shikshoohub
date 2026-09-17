"use client";

import { useCallback, useEffect, useState } from "react";
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
  toFaNum,
  type SmartCustomerRow,
} from "@/app/lib/smartCustomer";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";

export default function SmartClubCustomersPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SmartCustomerRow[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [segment, setSegment] = useState(searchParams.get("segment") || "");
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSmartCustomers({
        segment: segment || undefined,
        search: search || undefined,
        per_page: 50,
      });
      setRows(res.data || []);
      setTotal(res.total || 0);
      setLabels(res.segment_labels || {});
    } catch (e) {
      toast.error(getApiErrorMessage(e, "خطا در دریافت مشتریان"));
    } finally {
      setLoading(false);
    }
  }, [segment, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Box sx={adminPageSx}>
      <ToastContainer position="top-center" rtl />
      <Typography variant="h5" fontWeight={800} mb={2}>
        مشتریان RFM
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <TextField
          select
          size="small"
          label="سگمنت"
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">همه</MenuItem>
          {Object.entries(labels).map(([k, v]) => (
            <MenuItem key={k} value={k}>
              {v}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="جستجو نام/شماره"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button variant="contained" onClick={() => void load()}>
          فیلتر
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={1}>
        {toFaNum(total)} مشتری
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ overflowX: "auto", border: "1px solid var(--admin-border)", borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>مشتری</TableCell>
                <TableCell>سگمنت</TableCell>
                <TableCell>R (روز)</TableCell>
                <TableCell>F</TableCell>
                <TableCell>M</TableCell>
                <TableCell>میانگین فاصله</TableCell>
                <TableCell>RFM</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.phone}>
                  <TableCell>
                    <Typography fontWeight={600}>{r.name || "—"}</Typography>
                    <Typography variant="caption">{r.phone}</Typography>
                  </TableCell>
                  <TableCell>{r.segment_label || r.primary_segment}</TableCell>
                  <TableCell>{toFaNum(r.recency_days)}</TableCell>
                  <TableCell>{toFaNum(r.frequency)}</TableCell>
                  <TableCell>{toFaNum(r.monetary)}</TableCell>
                  <TableCell>
                    {r.avg_days_between != null ? toFaNum(r.avg_days_between) : "—"}
                  </TableCell>
                  <TableCell>
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
