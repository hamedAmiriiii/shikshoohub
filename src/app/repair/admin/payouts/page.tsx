"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { toast } from "react-toastify";
import {
  formatFaDate,
  formatFaNumber,
  formatToman,
  isRepairError,
  repairApi,
  type RepairBalanceRow,
  type RepairPayout,
} from "@/app/lib/repair/api";
import { EmptyState, Loader, MoneyField, Section, useRequireRole } from "../../ui";

type PayoutForm = {
  technicianId: number;
  name: string;
  amount: number;
  method: string;
  note: string;
  cardNumber: string | null;
  sheba: string | null;
};

function PayoutsContent() {
  const { allowed } = useRequireRole(["admin"]);
  const params = useSearchParams();
  const focusId = params.get("technician_id");
  const [rows, setRows] = useState<RepairBalanceRow[] | null>(null);
  const [payouts, setPayouts] = useState<RepairPayout[]>([]);
  const [form, setForm] = useState<PayoutForm | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [balances, history] = await Promise.all([repairApi.adminBalances(), repairApi.adminPayouts(focusId || undefined)]);
    setRows(isRepairError(balances) ? [] : balances.rows);
    setPayouts(isRepairError(history) ? [] : history.payouts);
  }, [focusId]);

  useEffect(() => {
    if (allowed) void load();
  }, [allowed, load]);

  if (!allowed || rows === null) return <Loader />;

  const save = async () => {
    if (!form || form.amount <= 0) return;
    setBusy(true);
    const res = await repairApi.adminCreatePayout({
      technician_id: form.technicianId,
      amount: form.amount,
      method: form.method.trim() || undefined,
      note: form.note.trim() || undefined,
    });
    setBusy(false);
    if (isRepairError(res)) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    setForm(null);
    void load();
  };

  const remove = async (payout: RepairPayout) => {
    if (!window.confirm(`تسویهٔ ${formatToman(payout.amount)} حذف شود؟`)) return;
    const res = await repairApi.adminDeletePayout(payout.id);
    if (isRepairError(res)) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    void load();
  };

  const visibleRows = focusId ? rows.filter((r) => String(r.technician.id) === focusId) : rows;
  const totalBalance = rows.reduce((sum, r) => sum + Math.max(0, r.balance), 0);

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="caption" color="text.secondary">
          جمع مانده قابل پرداخت به تعمیرکاران
        </Typography>
        <Typography variant="h6" fontWeight={800}>
          {formatToman(totalBalance)}
        </Typography>
      </Paper>

      <Section title="مانده هر تعمیرکار">
        {visibleRows.length === 0 ? (
          <EmptyState text="تعمیرکاری ثبت نشده است." />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>تعمیرکار</TableCell>
                  <TableCell align="center">کار</TableCell>
                  <TableCell>سهم کارکرد</TableCell>
                  <TableCell>پرداخت‌شده</TableCell>
                  <TableCell>مانده</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleRows.map((r) => (
                  <TableRow key={r.technician.id}>
                    <TableCell>{r.technician.name}</TableCell>
                    <TableCell align="center">{formatFaNumber(r.completed_jobs)}</TableCell>
                    <TableCell>{formatToman(r.earned)}</TableCell>
                    <TableCell>{formatToman(r.paid)}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: r.balance > 0 ? "success.main" : r.balance < 0 ? "error.main" : undefined }}>
                      {formatToman(r.balance)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          setForm({
                            technicianId: r.technician.id,
                            name: r.technician.name || "",
                            amount: Math.max(0, r.balance),
                            method: "کارت به کارت",
                            note: "",
                            cardNumber: r.technician.card_number,
                            sheba: r.technician.sheba ?? null,
                          })
                        }
                      >
                        تسویه
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Section>

      <Section title="سوابق تسویه">
        {payouts.length === 0 ? (
          <EmptyState text="تسویه‌ای ثبت نشده است." />
        ) : (
          <Stack>
            {payouts.map((p) => (
              <Stack key={p.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                <div>
                  <Typography variant="body2" fontWeight={700}>
                    {p.technician_name} — {formatToman(p.amount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFaDate(p.paid_on, false)}
                    {p.method ? ` · ${p.method}` : ""}
                    {p.note ? ` · ${p.note}` : ""}
                  </Typography>
                </div>
                <IconButton size="small" onClick={() => void remove(p)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )}
      </Section>

      <Dialog open={form !== null} onClose={() => setForm(null)} fullWidth maxWidth="xs">
        <DialogTitle>تسویه با {form?.name}</DialogTitle>
        {form && (
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {form.cardNumber && (
                <Typography variant="body2">
                  شماره کارت: <b dir="ltr">{form.cardNumber.replace(/(\d{4})(?=\d)/g, "$1-")}</b>
                </Typography>
              )}
              {form.sheba && (
                <Typography variant="body2">
                  شبا: <b dir="ltr">{form.sheba}</b>
                </Typography>
              )}
              {!form.cardNumber && !form.sheba && (
                <Typography variant="body2" color="warning.main">
                  تعمیرکار شماره کارت یا شبا ثبت نکرده است.
                </Typography>
              )}
              <MoneyField label="مبلغ پرداختی" value={form.amount} onChange={(amount) => setForm({ ...form, amount })} fullWidth size="small" />
              <TextField label="روش پرداخت" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} fullWidth size="small" />
              <TextField label="توضیح / شماره پیگیری" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} fullWidth size="small" />
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setForm(null)}>انصراف</Button>
          <Button variant="contained" onClick={() => void save()} disabled={busy || !form || form.amount <= 0}>
            ثبت تسویه
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default function RepairPayoutsPage() {
  return (
    <Suspense fallback={<Loader />}>
      <PayoutsContent />
    </Suspense>
  );
}
