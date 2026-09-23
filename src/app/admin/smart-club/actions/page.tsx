"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import {
  bulkSmartActions,
  toFaNum,
  fetchSmartActions,
  type SmartAction,
} from "@/app/lib/smartCustomer";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";

const cellSx = {
  color: "var(--admin-text)",
  fontSize: 13,
  borderColor: "var(--admin-border)",
  py: 1,
} as const;

const headSx = {
  ...cellSx,
  fontWeight: 700,
  bgcolor: "var(--admin-surface-alt)",
  whiteSpace: "nowrap",
} as const;

const checkboxSx = {
  color: "var(--admin-text-muted)",
  "&.Mui-checked": { color: "var(--admin-accent)" },
  "&.MuiCheckbox-indeterminate": { color: "var(--admin-accent)" },
} as const;

export default function SmartClubActionsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SmartAction[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState<{ id: number; anchor: HTMLElement } | null>(null);
  const [confirm, setConfirm] = useState<{ op: "execute" | "dismiss"; ids: number[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSmartActions("suggested");
      const list = res.data || [];
      setRows(list);
      setSelected((prev) => prev.filter((id) => list.some((row) => row.id === id)));
    } catch (e) {
      toast.error(getApiErrorMessage(e, "خطا در دریافت پیشنهادها"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const allIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const allSelected = allIds.length > 0 && selected.length === allIds.length;
  const someSelected = selected.length > 0 && selected.length < allIds.length;

  const toggleAll = () => {
    setSelected(allSelected ? [] : allIds);
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const runBulk = async (op: "execute" | "dismiss", ids: number[]) => {
    if (ids.length === 0) return;
    setBusy(true);
    setMenu(null);
    setConfirm(null);
    try {
      const res = await bulkSmartActions(op, ids);
      toast.success(res.message || (op === "execute" ? "اجرا شد" : "رد شد"));
      setSelected([]);
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, op === "execute" ? "اجرا ناموفق بود" : "رد ناموفق بود"));
    } finally {
      setBusy(false);
    }
  };

  const confirmLabel =
    confirm?.op === "execute"
      ? `اجرا روی ${toFaNum(confirm.ids.length)} پیشنهاد؟ اعتبار و پیامک در صورت وجود ارسال می‌شود.`
      : `رد ${toFaNum(confirm?.ids.length || 0)} پیشنهاد؟`;

  return (
    <Box sx={{ ...adminPageSx, p: 1.5, pb: 10 }}>
      <ToastContainer position="top-center" rtl />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 17, color: "var(--admin-text)" }}>
            پیشنهادهای اقدام
          </Typography>
          <Typography sx={{ color: "var(--admin-text)", opacity: 0.7, fontSize: 12, mt: 0.25 }}>
            چند مورد را تیک بزنید و با هم اجرا یا رد کنید
          </Typography>
        </Box>
        {selected.length > 0 ? (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              size="small"
              disabled={busy}
              onClick={() => setConfirm({ op: "execute", ids: selected })}
              sx={adminButtonStartIconSx}
            >
              اجرا ({toFaNum(selected.length)})
            </Button>
            <Button
              variant="outlined"
              size="small"
              disabled={busy}
              onClick={() => setConfirm({ op: "dismiss", ids: selected })}
              sx={{ color: "var(--admin-error)", borderColor: "var(--admin-error)" }}
            >
              رد ({toFaNum(selected.length)})
            </Button>
          </Box>
        ) : null}
      </Box>

      {loading ? (
        <CircularProgress />
      ) : rows.length === 0 ? (
        <Typography sx={{ color: "var(--admin-text)", opacity: 0.75 }}>پیشنهاد فعالی نیست.</Typography>
      ) : (
        <Box sx={{ overflowX: "auto", border: "1px solid var(--admin-border)", borderRadius: 2, bgcolor: "var(--admin-surface)" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={headSx}>
                  <Checkbox
                    size="small"
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleAll}
                    sx={checkboxSx}
                  />
                </TableCell>
                <TableCell sx={headSx}>مشتری</TableCell>
                <TableCell sx={headSx}>پیشنهاد</TableCell>
                <TableCell sx={headSx}>ارزش تقریبی</TableCell>
                <TableCell sx={headSx}>زمان پیشنهادی</TableCell>
                <TableCell sx={headSx} align="center">
                  عملیات
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const checked = selected.includes(row.id);
                const credit = Number(row.payload?.credit || 0);
                return (
                  <TableRow key={row.id} hover selected={checked}>
                    <TableCell padding="checkbox" sx={cellSx}>
                      <Checkbox
                        size="small"
                        checked={checked}
                        onChange={() => toggleOne(row.id)}
                        sx={checkboxSx}
                      />
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Typography fontWeight={600} sx={{ color: "var(--admin-text)", fontSize: 13 }}>
                        {row.name || "—"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "var(--admin-text)", opacity: 0.7, display: "block" }}>
                        {row.phone}
                      </Typography>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{row.title}</Typography>
                      {row.reason ? (
                        <Typography variant="caption" sx={{ opacity: 0.7, display: "block" }}>
                          {row.reason}
                        </Typography>
                      ) : null}
                      {credit >= 0.01 ? (
                        <Typography variant="caption" sx={{ opacity: 0.75, display: "block" }}>
                          اعتبار {toFaNum(credit)} تومان
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell sx={{ ...cellSx, whiteSpace: "nowrap" }}>
                      {toFaNum(row.estimated_revenue)} تومان
                    </TableCell>
                    <TableCell sx={{ ...cellSx, whiteSpace: "nowrap" }}>
                      {row.suggested_send_at || "—"}
                    </TableCell>
                    <TableCell sx={cellSx} align="center">
                      <IconButton
                        size="small"
                        aria-label="عملیات"
                        disabled={busy}
                        onClick={(e) => setMenu({ id: row.id, anchor: e.currentTarget })}
                        sx={{ color: "var(--admin-text)" }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      <Menu
        anchorEl={menu?.anchor ?? null}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              bgcolor: "var(--admin-surface)",
              color: "var(--admin-text)",
              border: "1px solid var(--admin-border)",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (!menu) return;
            setConfirm({ op: "execute", ids: [menu.id] });
            setMenu(null);
          }}
        >
          اجرا
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menu) return;
            setConfirm({ op: "dismiss", ids: [menu.id] });
            setMenu(null);
          }}
          sx={{ color: "var(--admin-error)" }}
        >
          رد
        </MenuItem>
      </Menu>

      <Dialog
        open={Boolean(confirm)}
        onClose={() => !busy && setConfirm(null)}
        slotProps={{
          paper: {
            sx: {
              bgcolor: "var(--admin-surface)",
              color: "var(--admin-text)",
              border: "1px solid var(--admin-border)",
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16 }}>تأیید عملیات</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14 }}>{confirmLabel}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)} disabled={busy} sx={{ color: "var(--admin-text)" }}>
            انصراف
          </Button>
          <Button
            variant="contained"
            disabled={busy || !confirm}
            onClick={() => confirm && void runBulk(confirm.op, confirm.ids)}
            color={confirm?.op === "dismiss" ? "error" : "primary"}
          >
            {busy ? "در حال انجام..." : "تأیید"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
