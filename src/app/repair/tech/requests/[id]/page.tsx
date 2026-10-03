"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Alert, Button, Stack } from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import MapIcon from "@mui/icons-material/Map";
import { toast } from "react-toastify";
import { isRepairError, repairApi, type RepairRequest } from "@/app/lib/repair/api";
import CostForm, { type CostFormValues } from "../../../CostForm";
import { CostBreakdown, RequestInfo } from "../../../RequestDetails";
import { Loader, useRequireRole } from "../../../ui";

export default function TechnicianJobPage() {
  const { id } = useParams<{ id: string }>();
  const { allowed } = useRequireRole(["technician"]);
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await repairApi.techRequest(id);
    if (isRepairError(res)) setError(res.message);
    else setRequest(res.request);
  }, [id]);

  useEffect(() => {
    if (allowed) void load();
  }, [allowed, load]);

  if (!allowed) return <Loader />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!request) return <Loader />;

  const start = async () => {
    setBusy(true);
    const res = await repairApi.techStart(request.id);
    setBusy(false);
    if (isRepairError(res)) return void toast.error(res.message);
    toast.success(res.message);
    setRequest(res.request);
  };

  const saveCost = async (values: CostFormValues) => {
    setBusy(true);
    const res = await repairApi.techSetCost(request.id, values);
    setBusy(false);
    if (isRepairError(res)) return void toast.error(res.message);
    toast.success(res.message);
    setRequest(res.request);
  };

  const canEditCost = ["assigned", "in_progress", "invoiced"].includes(request.status);

  return (
    <Stack spacing={2}>
      <RequestInfo request={request} showCustomer />
      <Stack direction="row" spacing={1}>
        <Button fullWidth variant="outlined" startIcon={<PhoneIcon />} href={`tel:${request.contact_phone}`}>
          تماس با مشتری
        </Button>
        {(request.latitude === null || request.longitude === null) && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<MapIcon />}
            href={`https://neshan.org/maps/search/${encodeURIComponent(request.address)}`}
            target="_blank"
          >
            جستجوی آدرس در نشان
          </Button>
        )}
      </Stack>

      {request.status === "assigned" && (
        <Button variant="contained" size="large" onClick={() => void start()} disabled={busy}>
          شروع کار
        </Button>
      )}

      <CostBreakdown request={request} showShares />

      {canEditCost && <CostForm request={request} busy={busy} onSubmit={(v) => void saveCost(v)} />}
      {request.status === "invoiced" && <Alert severity="info">هزینه برای مشتری ارسال شده و منتظر پرداخت است.</Alert>}
      {request.status === "payment_review" && <Alert severity="info">مشتری رسید پرداخت فرستاده؛ منتظر تأیید مدیر.</Alert>}
      {request.status === "completed" && <Alert severity="success">پرداخت ثبت شد و سهم شما به کیف پول اضافه شد.</Alert>}
    </Stack>
  );
}
