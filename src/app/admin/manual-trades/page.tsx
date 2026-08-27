"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DescriptionIcon from "@mui/icons-material/Description";
import FilterListIcon from "@mui/icons-material/FilterList";
import DeleteIcon from "@mui/icons-material/Delete";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import BottomSheetModal from "@/app/coponent/BottomSheetModal";
import ManualTradeCard from "./ManualTradeCard";
import ManualTradeFormSheet from "./ManualTradeFormSheet";
import {
  MANUAL_TRADE_TYPE_OPTIONS,
  buildManualTradesUrl,
  extractManualTradeList,
  formatNumber,
  parseAmount,
  type ManualTrade,
  type ManualTradeType,
} from "@/app/lib/manualTrades";

export default function ManualTradesPage() {
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState<ManualTrade[]>([]);
  const [typeFilter, setTypeFilter] = useState<ManualTradeType | "all">("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ManualTrade | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ManualTrade | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasFilters = typeFilter !== "all";

  const loadTrades = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", buildManualTradesUrl(typeFilter), token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت لیست اسناد"));
        setTrades([]);
        return;
      }
      setTrades(extractManualTradeList(res));
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const totals = useMemo(() => {
    let purchases = 0;
    let sales = 0;
    for (const trade of trades) {
      const amount = parseAmount(trade.amount);
      if (trade.type === "sale") sales += amount;
      else purchases += amount;
    }
    return { purchases, sales, count: trades.length };
  }, [trades]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (trade: ManualTrade) => {
    setEditing(trade);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSaved = async () => {
    closeForm();
    await loadTrades();
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      const res = await FetchWithJwtClient(
        "DELETE",
        `/api/manual-trades/${deleteTarget.id}`,
        tokenCode(),
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در حذف سند"));
        return;
      }
      toast.success("سند حذف شد");
      setDeleteTarget(null);
      await loadTrades();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <ToastContainer position="top-center" rtl autoClose={3000} />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <DescriptionIcon sx={{ color: "var(--admin-accent)", fontSize: 30 }} />
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 20 }}>
            ثبت سند
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            onClick={() => setFilterSheetOpen(true)}
            sx={{
              color: hasFilters ? "var(--admin-accent)" : "var(--admin-text)",
              bgcolor: hasFilters ? "rgba(120, 181, 104, 0.2)" : "var(--admin-icon-bg)",
              border: "1px solid var(--admin-border)",
              borderRadius: "12px",
            }}
            size="small"
            title="فیلتر"
          >
            <FilterListIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{
              ...adminButtonStartIconSx,
              bgcolor: "var(--admin-accent)",
              color: "#fff",
              borderRadius: "12px",
              "&:hover": { bgcolor: "var(--admin-accent-hover)" },
            }}
          >
            ثبت سند
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          px: 1,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
          {totals.count.toLocaleString("fa-IR")} مورد
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Typography sx={{ color: "#ff9800", fontWeight: 700, fontSize: 13 }}>
            خرید: {formatNumber(totals.purchases)} تومان
          </Typography>
          <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: 13 }}>
            فروش: {formatNumber(totals.sales)} تومان
          </Typography>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : trades.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 6,
            color: "var(--admin-text-muted)",
            border: "1px dashed var(--admin-border)",
            borderRadius: "12px",
          }}
        >
          سندی یافت نشد
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 1.5,
            alignItems: "stretch",
          }}
        >
          {trades.map((trade) => (
            <ManualTradeCard
              key={trade.id}
              trade={trade}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </Box>
      )}

      <ManualTradeFormSheet
        open={formOpen}
        onClose={closeForm}
        editing={editing}
        defaultType={typeFilter === "sale" ? "sale" : "purchase"}
        onSaved={handleSaved}
      />

      <BottomSheetModal open={filterSheetOpen} onClose={() => setFilterSheetOpen(false)}>
        <Box sx={{ p: 2, direction: "rtl" }}>
          <Typography sx={{ color: "#000", mb: 1, fontSize: 14, fontWeight: 600 }}>
            نوع سند
          </Typography>
          <RadioGroup
            row
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ManualTradeType | "all")}
            sx={{ mb: 2, justifyContent: "space-around" }}
          >
            <FormControlLabel
              value="all"
              control={<Radio sx={{ color: "#1f9ad1", "&.Mui-checked": { color: "#1f9ad1" } }} />}
              label="همه"
              sx={{ color: "#000" }}
            />
            {MANUAL_TRADE_TYPE_OPTIONS.map((o) => (
              <FormControlLabel
                key={o.value}
                value={o.value}
                control={<Radio sx={{ color: "#1f9ad1", "&.Mui-checked": { color: "#1f9ad1" } }} />}
                label={o.label}
                sx={{ color: "#000" }}
              />
            ))}
          </RadioGroup>
          {hasFilters ? (
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={() => {
                setTypeFilter("all");
                setFilterSheetOpen(false);
              }}
              sx={{
                color: "#ff4444",
                borderColor: "#ff4444",
                "&:hover": {
                  borderColor: "#ff6666",
                  backgroundColor: "rgba(255, 68, 68, 0.1)",
                },
              }}
            >
              حذف فیلتر
            </Button>
          ) : null}
        </Box>
      </BottomSheetModal>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => (deleting ? null : setDeleteTarget(null))}
        PaperProps={{
          sx: {
            backgroundColor: "var(--admin-surface)",
            borderRadius: "16px",
            direction: "rtl",
            minWidth: { xs: "280px", sm: "360px" },
            border: "1px solid var(--admin-border)",
          },
        }}
      >
        <DialogTitle sx={{ color: "var(--admin-text)", textAlign: "center", fontSize: "18px", fontWeight: 700 }}>
          تایید حذف سند
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "var(--admin-text-muted)", textAlign: "center" }}>
            آیا از حذف این سند مطمئن هستید؟
            {deleteTarget ? (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1.25,
                  backgroundColor: "var(--admin-surface-alt)",
                  borderRadius: "8px",
                  color: "var(--admin-text)",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {deleteTarget.title || "—"}
                </Typography>
                {deleteTarget.amount != null ? (
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--admin-text-secondary)", display: "block", mt: 0.5 }}
                  >
                    مبلغ: {formatNumber(parseAmount(deleteTarget.amount))} تومان
                  </Typography>
                ) : null}
              </Box>
            ) : null}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", px: 2, pb: 2, gap: 1.5 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            variant="outlined"
            disabled={deleting}
            sx={{
              color: "var(--admin-text)",
              borderColor: "#666",
              minWidth: 100,
              "&:hover": {
                borderColor: "#888",
                backgroundColor: "var(--admin-surface-alt)",
              },
            }}
          >
            انصراف
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : undefined}
            sx={{
              backgroundColor: "#ff4444",
              minWidth: 100,
              "&:hover": { backgroundColor: "#cc0000" },
            }}
          >
            {deleting ? "در حال حذف..." : "حذف"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
