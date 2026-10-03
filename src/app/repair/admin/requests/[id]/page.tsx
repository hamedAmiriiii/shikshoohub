"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import {
  formatFaDate,
  formatToman,
  isRepairError,
  repairApi,
  type RepairApiError,
  type RepairRequest,
  type RepairTechnician,
} from "@/app/lib/repair/api";
import CostForm, { type CostFormValues } from "../../../CostForm";
import { CostBreakdown, RequestInfo } from "../../../RequestDetails";
import { Loader, Section, useRequireRole } from "../../../ui";

type ActionResult = { message?: string; request: RepairRequest } | RepairApiError;

export default function AdminRepairRequestPage() {
  const { id } = useParams<{ id: string }>();
  const { allowed } = useRequireRole(["admin"]);
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [technicians, setTechnicians] = useState<RepairTechnician[]>([]);
  const [technicianId, setTechnicianId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<null | "reject" | "cancel" | "paid">(null);
  const [dialogText, setDialogText] = useState("");
  const [showAllTechnicians, setShowAllTechnicians] = useState(false);

  const load = useCallback(async () => {
    const res = await repairApi.adminRequest(id);
    if (isRepairError(res)) {
      setError(res.message);
      return;
    }
    setRequest(res.request);
    setTechnicianId(res.request.technician ? String(res.request.technician.id) : "");
    setNote(res.request.admin_note || "");
  }, [id]);

  useEffect(() => {
    if (!allowed) return;
    void load();
    void repairApi.adminTechnicians().then((res) => {
      if (!isRepairError(res)) {
        setTechnicians(res.technicians.filter((t) => t.is_active && t.approval_status === "approved"));
      }
    });
  }, [allowed, load]);

  if (!allowed) return <Loader />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!request) return <Loader />;

  const run = async (action: () => Promise<ActionResult>) => {
    setBusy(true);
    const res = await action();
    setBusy(false);
    if (isRepairError(res)) {
      toast.error(res.message);
      return false;
    }
    if (res.message) toast.success(res.message);
    setRequest(res.request);
    return true;
  };

  const canAssign = ["pending", "assigned", "in_progress"].includes(request.status);
  const matchingTechnicians = request.service_id
    ? technicians.filter((t) => t.service_ids.includes(request.service_id as number))
    : technicians;
  const technicianOptions =
    showAllTechnicians || !request.service_id
      ? technicians
      : technicians.filter((t) => matchingTechnicians.includes(t) || String(t.id) === technicianId);
  const canEditCost = Boolean(request.technician) && ["assigned", "in_progress", "invoiced", "payment_review"].includes(request.status);
  const awaitingPayment = request.status === "invoiced" || request.status === "payment_review";
  const isOpen = request.status !== "completed" && request.status !== "canceled";

  const submitDialog = async () => {
    const text = dialogText.trim() || undefined;
    let ok = false;
    if (dialog === "reject") ok = await run(() => repairApi.adminRejectReceipt(request.id, text));
    if (dialog === "cancel") ok = await run(() => repairApi.adminCancel(request.id, text));
    if (dialog === "paid") ok = await run(() => repairApi.adminMarkPaid(request.id, text));
    if (ok) {
      setDialog(null);
      setDialogText("");
    }
  };

  return (
    <Stack spacing={2}>
      <RequestInfo request={request} showCustomer />

      {canAssign && (
        <Section title={request.technician ? "تغییر تعمیرکار" : "ارجاع به تعمیرکار"}>
          {technicians.length === 0 ? (
            <Alert severity="warning">ابتدا از بخش «تعمیرکاران» تعمیرکار فعال اضافه کنید.</Alert>
          ) : (
            <Stack spacing={1}>
            {request.service_id && (
              <FormControlLabel
                control={<Switch size="small" checked={showAllTechnicians} onChange={(e) => setShowAllTechnicians(e.target.checked)} />}
                label={
                  <Typography variant="body2">
                    نمایش همهٔ تعمیرکاران ({matchingTechnicians.length} نفر «{request.category}» را انجام می‌دهند)
                  </Typography>
                }
              />
            )}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField select label="تعمیرکار" value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} fullWidth size="small">
                {technicianOptions.length === 0 && (
                  <MenuItem disabled value="">
                    تعمیرکاری برای این خدمت ثبت نشده؛ «نمایش همه» را بزنید.
                  </MenuItem>
                )}
                {technicianOptions.map((t) => (
                  <MenuItem key={t.id} value={String(t.id)}>
                    {t.name} {t.specialty ? `(${t.specialty})` : ""} — {t.open_requests ?? 0} کار باز
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                disabled={busy || !technicianId || String(request.technician?.id || "") === technicianId}
                onClick={() => void run(() => repairApi.adminAssign(request.id, Number(technicianId)))}
                sx={{ flexShrink: 0 }}
              >
                ارجاع و پیامک
              </Button>
            </Stack>
            </Stack>
          )}
        </Section>
      )}

      <CostBreakdown request={request} showShares />

      {request.status === "payment_review" && (
        <Section title="رسید کارت به کارت">
          <Stack spacing={1.5}>
            <Typography variant="body2">
              ارسال‌شده در {formatFaDate(request.receipt_submitted_at)}
              {request.payment_ref ? ` — پیگیری: ${request.payment_ref}` : ""}
            </Typography>
            {request.receipt_url && (
              <Box component="a" href={request.receipt_url} target="_blank" rel="noreferrer">
                {/\.pdf($|\?)/i.test(request.receipt_url) ? (
                  "مشاهدهٔ فایل رسید"
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={request.receipt_url} alt="رسید" style={{ maxWidth: "100%", maxHeight: 360, borderRadius: 8 }} />
                )}
              </Box>
            )}
            <Typography variant="body2">مبلغ فاکتور: {formatToman(request.total_amount)}</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" color="success" disabled={busy} onClick={() => void run(() => repairApi.adminApproveReceipt(request.id))}>
                تأیید پرداخت
              </Button>
              <Button variant="outlined" color="error" disabled={busy} onClick={() => setDialog("reject")}>
                رد رسید
              </Button>
            </Stack>
          </Stack>
        </Section>
      )}

      {canEditCost && (
        <CostForm
          request={request}
          withShare
          busy={busy}
          onSubmit={(values: CostFormValues) => void run(() => repairApi.adminSetCost(request.id, values))}
        />
      )}

      <Section title="یادداشت مدیر">
        <Stack spacing={1}>
          <TextField value={note} onChange={(e) => setNote(e.target.value)} multiline minRows={2} fullWidth size="small" />
          <Button
            size="small"
            sx={{ alignSelf: "flex-start" }}
            disabled={busy || note === (request.admin_note || "")}
            onClick={() => void run(() => repairApi.adminNote(request.id, note))}
          >
            ذخیرهٔ یادداشت
          </Button>
        </Stack>
      </Section>

      {isOpen && (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {awaitingPayment && (
            <Button variant="outlined" disabled={busy} onClick={() => setDialog("paid")}>
              ثبت پرداخت نقدی/دستی
            </Button>
          )}
          <Button color="error" disabled={busy} onClick={() => setDialog("cancel")}>
            لغو درخواست
          </Button>
        </Stack>
      )}

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          {dialog === "reject" ? "رد رسید" : dialog === "cancel" ? "لغو درخواست" : "ثبت پرداخت دستی"}
        </DialogTitle>
        <DialogContent>
          {dialog === "paid" && (
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              مبلغ {formatToman(request.total_amount)} دریافت‌شده ثبت و کار تکمیل می‌شود.
            </Typography>
          )}
          <TextField
            autoFocus
            fullWidth
            size="small"
            label={dialog === "paid" ? "شمارهٔ پیگیری / توضیح (اختیاری)" : "علت (برای مشتری پیامک می‌شود)"}
            value={dialogText}
            onChange={(e) => setDialogText(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>انصراف</Button>
          <Button variant="contained" color={dialog === "paid" ? "primary" : "error"} disabled={busy} onClick={() => void submitDialog()}>
            تأیید
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
