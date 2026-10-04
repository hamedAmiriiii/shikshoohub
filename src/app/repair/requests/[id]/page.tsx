"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Alert,
  Button,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { toast } from "react-toastify";
import {
  formatToman,
  isRepairError,
  readFileAsDataUrl,
  repairApi,
  type RepairPaymentOptions,
  type RepairRequest,
} from "@/app/lib/repair/api";
import { RatingDialog, RatingStars } from "../../Rating";
import { CostBreakdown, RequestInfo } from "../../RequestDetails";
import { Loader, Section, useRequireRole } from "../../ui";

type PayMethod = "online" | "card";

export default function MyRepairRequestPage() {
  const { id } = useParams<{ id: string }>();
  const { allowed } = useRequireRole(["customer"]);
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [payment, setPayment] = useState<RepairPaymentOptions | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [ratingOpen, setRatingOpen] = useState(false);
  const [method, setMethod] = useState<PayMethod>("online");
  const dismissKey = `repair_rate_later_${id}`;

  useEffect(() => {
    if (request?.can_rate && !window.sessionStorage.getItem(dismissKey)) setRatingOpen(true);
  }, [request?.can_rate, dismissKey]);

  const closeRating = () => {
    window.sessionStorage.setItem(dismissKey, "1");
    setRatingOpen(false);
  };

  const load = useCallback(async () => {
    const res = await repairApi.myRequest(id);
    if (isRepairError(res)) {
      setError(res.message);
      return;
    }
    setRequest(res.request);
    setPayment(res.payment);
    if (!res.payment.online_enabled && res.payment.card_enabled) setMethod("card");
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
            {payment.online_enabled && payment.card_enabled && (
              <ToggleButtonGroup
                exclusive
                fullWidth
                color="primary"
                value={method}
                onChange={(_, value: PayMethod | null) => value && setMethod(value)}
              >
                <ToggleButton value="online" sx={{ gap: 1, py: 1.25, fontWeight: 700 }}>
                  <CreditCardIcon fontSize="small" />
                  پرداخت آنلاین
                </ToggleButton>
                <ToggleButton value="card" sx={{ gap: 1, py: 1.25, fontWeight: 700 }}>
                  <ReceiptLongIcon fontSize="small" />
                  کارت به کارت
                </ToggleButton>
              </ToggleButtonGroup>
            )}
            {method === "online" && payment.online_enabled && (
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  با زدن دکمهٔ زیر به درگاه بانکی منتقل می‌شوید و پس از پرداخت به همین صفحه برمی‌گردید.
                </Typography>
                <Button variant="contained" size="large" onClick={() => void payOnline()} disabled={busy}>
                  پرداخت آنلاین {formatToman(request.total_amount)}
                </Button>
              </Stack>
            )}
            {method === "card" && payment.card_enabled && (
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
      {request.status === "completed" && (
        <Alert
          severity="success"
          action={
            request.can_rate ? (
              <Button color="inherit" size="small" onClick={() => setRatingOpen(true)}>
                ثبت امتیاز
              </Button>
            ) : undefined
          }
        >
          کار انجام و پرداخت ثبت شد. سپاس از اعتماد شما.
        </Alert>
      )}
      {request.rating ? (
        <Section title="امتیاز شما">
          <Stack spacing={1}>
            <RatingStars value={request.rating} />
            {request.review && (
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {request.review}
              </Typography>
            )}
          </Stack>
        </Section>
      ) : null}
      {request.can_rate && (
        <RatingDialog
          request={request}
          open={ratingOpen}
          onClose={closeRating}
          onRated={(updated) => {
            setRequest(updated);
            setRatingOpen(false);
          }}
        />
      )}

      {(request.status === "pending" || request.status === "assigned") && (
        <Button color="error" onClick={() => void cancel()} disabled={busy}>
          لغو درخواست
        </Button>
      )}
    </Stack>
  );
}
