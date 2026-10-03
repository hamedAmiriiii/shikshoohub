"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Alert, Button, Divider, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { toast } from "react-toastify";
import {
  formatToman,
  isRepairError,
  readFileAsDataUrl,
  repairApi,
  type RepairPaymentOptions,
  type RepairRequest,
} from "@/app/lib/repair/api";
import { CostBreakdown, RequestInfo } from "../../RequestDetails";
import { Loader, Section, useRequireRole } from "../../ui";

export default function MyRepairRequestPage() {
  const { id } = useParams<{ id: string }>();
  const { allowed } = useRequireRole(["customer"]);
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [payment, setPayment] = useState<RepairPaymentOptions | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [paymentRef, setPaymentRef] = useState("");

  const load = useCallback(async () => {
    const res = await repairApi.myRequest(id);
    if (isRepairError(res)) {
      setError(res.message);
      return;
    }
    setRequest(res.request);
    setPayment(res.payment);
  }, [id]);

  useEffect(() => {
    if (!allowed) return;
    const params = new URLSearchParams(window.location.search);
    const result = params.get("payment");
    if (result === "ok") toast.success("پرداخت با موفقیت انجام شد.");
    else if (result === "failed") toast.error(params.get("message") || "پرداخت ناموفق بود.");
    if (result) window.history.replaceState(null, "", window.location.pathname);
    void load();
  }, [allowed, load]);

  if (!allowed) return <Loader />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!request || !payment) return <Loader />;

  const payOnline = async () => {
    setBusy(true);
    const res = await repairApi.payOnline(request.id, `${window.location.origin}${window.location.pathname}`);
    if (isRepairError(res)) {
      setBusy(false);
      toast.error(res.message);
      return;
    }
    window.location.href = res.payment_url;
  };

  const sendReceipt = async () => {
    if (!file) {
      toast.error("تصویر رسید را انتخاب کنید.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم فایل نباید بیشتر از ۵ مگابایت باشد.");
      return;
    }
    setBusy(true);
    const dataUrl = await readFileAsDataUrl(file);
    const res = await repairApi.uploadReceipt(request.id, dataUrl, paymentRef.trim());
    setBusy(false);
    if (isRepairError(res)) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    setRequest(res.request);
    setFile(null);
  };

  const cancel = async () => {
    if (!window.confirm("درخواست لغو شود؟")) return;
    setBusy(true);
    const res = await repairApi.cancelMyRequest(request.id);
    setBusy(false);
    if (isRepairError(res)) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    setRequest(res.request);
  };

  const copyCard = () => {
    void navigator.clipboard?.writeText(payment.card_number.replace(/\D/g, ""));
    toast.info("شماره کارت کپی شد.");
  };

  return (
    <Stack spacing={2}>
      <RequestInfo request={request} />
      <CostBreakdown request={request} />

      {request.status === "invoiced" && (
        <Section title={`پرداخت ${formatToman(request.total_amount)}`}>
          <Stack spacing={2}>
            {request.receipt_reject_reason && <Alert severity="warning">رسید قبلی تأیید نشد: {request.receipt_reject_reason}</Alert>}
            {payment.online_enabled && (
              <Button variant="contained" size="large" onClick={() => void payOnline()} disabled={busy}>
                پرداخت آنلاین
              </Button>
            )}
            {payment.online_enabled && payment.card_enabled && <Divider>یا</Divider>}
            {payment.card_enabled && (
              <Stack spacing={1.5}>
                <Typography variant="body2">مبلغ را به کارت زیر واریز کنید و تصویر رسید را بفرستید:</Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ bgcolor: "action.hover", p: 1.5, borderRadius: 2 }}>
                  <Typography fontWeight={800} dir="ltr" sx={{ flexGrow: 1, letterSpacing: 2, textAlign: "center" }}>
                    {payment.card_number}
                  </Typography>
                  <Tooltip title="کپی">
                    <IconButton size="small" onClick={copyCard}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                {(payment.card_holder || payment.bank_name) && (
                  <Typography variant="body2" color="text.secondary">
                    {payment.card_holder}
                    {payment.bank_name ? ` — ${payment.bank_name}` : ""}
                  </Typography>
                )}
                <Button variant="outlined" component="label">
                  {file ? file.name : "انتخاب تصویر رسید"}
                  <input hidden type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </Button>
                <TextField
                  label="شمارهٔ پیگیری (اختیاری)"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  size="small"
                />
                <Button variant="contained" color="secondary" onClick={() => void sendReceipt()} disabled={busy || !file}>
                  ارسال رسید
                </Button>
              </Stack>
            )}
            {!payment.online_enabled && !payment.card_enabled && (
              <Alert severity="info">برای پرداخت با پشتیبانی تماس بگیرید.</Alert>
            )}
          </Stack>
        </Section>
      )}

      {request.status === "payment_review" && (
        <Alert severity="info">رسید پرداخت شما ثبت شد و در حال بررسی است.</Alert>
      )}
      {request.status === "completed" && <Alert severity="success">کار انجام و پرداخت ثبت شد. سپاس از اعتماد شما.</Alert>}

      {(request.status === "pending" || request.status === "assigned") && (
        <Button color="error" onClick={() => void cancel()} disabled={busy}>
          لغو درخواست
        </Button>
      )}
    </Stack>
  );
}
