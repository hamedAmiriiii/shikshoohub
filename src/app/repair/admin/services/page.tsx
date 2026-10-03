"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { toast } from "react-toastify";
import { formatFaNumber, isRepairError, repairApi, toLatinDigits, type RepairAdminService } from "@/app/lib/repair/api";
import { EmptyState, Loader, useRequireRole } from "../../ui";

type FormState = { id?: number; name: string; sort_order: string; is_active: boolean };

export default function RepairServicesPage() {
  const { allowed } = useRequireRole(["admin"]);
  const [rows, setRows] = useState<RepairAdminService[] | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await repairApi.adminServices();
    setRows(isRepairError(res) ? [] : res.services);
  }, []);

  useEffect(() => {
    if (allowed) void load();
  }, [allowed, load]);

  if (!allowed || rows === null) return <Loader />;

  const save = async () => {
    if (!form || !form.name.trim()) {
      toast.error("نام خدمت را وارد کنید.");
      return;
    }
    const body = {
      name: form.name.trim(),
      is_active: form.is_active,
      sort_order: form.sort_order.trim() ? Number(toLatinDigits(form.sort_order)) || 0 : undefined,
    };
    setBusy(true);
    const res = form.id ? await repairApi.adminUpdateService(form.id, body) : await repairApi.adminCreateService(body);
    setBusy(false);
    if (isRepairError(res)) return void toast.error(res.message);
    toast.success(res.message);
    setForm(null);
    void load();
  };

  const toggle = async (row: RepairAdminService) => {
    const res = await repairApi.adminUpdateService(row.id, { is_active: !row.is_active });
    if (isRepairError(res)) return void toast.error(res.message);
    void load();
  };

  const remove = async (row: RepairAdminService) => {
    if (!window.confirm(`«${row.name}» حذف شود؟`)) return;
    const res = await repairApi.adminDeleteService(row.id);
    if (isRepairError(res)) return void toast.error(res.message);
    toast.success(res.message);
    void load();
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={800}>
          نوع خدمات
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setForm({ name: "", sort_order: "", is_active: true })}>
          خدمت جدید
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        مشتری هنگام ثبت درخواست یکی از خدمات فعال را انتخاب می‌کند و تعمیرکاران هم خدماتی را که انجام می‌دهند تیک می‌زنند.
      </Typography>

      {rows.length === 0 ? (
        <EmptyState text="هنوز خدمتی تعریف نشده است." />
      ) : (
        rows.map((row) => (
          <Paper key={row.id} variant="outlined" sx={{ p: 1.5, borderRadius: 3, opacity: row.is_active ? 1 : 0.6 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography fontWeight={700}>{row.name}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Chip size="small" variant="outlined" label={`${formatFaNumber(row.technicians_count)} تعمیرکار`} />
                  <Chip size="small" variant="outlined" label={`${formatFaNumber(row.requests_count)} درخواست`} />
                </Stack>
              </Stack>
              <Switch checked={row.is_active} onChange={() => void toggle(row)} />
              <Tooltip title="ویرایش">
                <IconButton
                  size="small"
                  onClick={() => setForm({ id: row.id, name: row.name, sort_order: String(row.sort_order), is_active: row.is_active })}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={row.requests_count > 0 ? "درخواست دارد؛ غیرفعالش کنید" : "حذف"}>
                <span>
                  <IconButton size="small" disabled={row.requests_count > 0} onClick={() => void remove(row)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Paper>
        ))
      )}

      <Dialog open={form !== null} onClose={() => setForm(null)} fullWidth maxWidth="xs">
        <DialogTitle>{form?.id ? "ویرایش خدمت" : "خدمت جدید"}</DialogTitle>
        {form && (
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="نام خدمت" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth size="small" autoFocus />
              <TextField
                label="ترتیب نمایش"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                fullWidth
                size="small"
                inputMode="numeric"
              />
              <FormControlLabel
                control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />}
                label="فعال"
              />
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setForm(null)}>انصراف</Button>
          <Button variant="contained" onClick={() => void save()} disabled={busy}>
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
