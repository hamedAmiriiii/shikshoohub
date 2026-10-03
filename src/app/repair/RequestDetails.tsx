"use client";

import { Divider, Link as MuiLink, Stack, Step, StepLabel, Stepper, Typography } from "@mui/material";
import { formatFaDate, formatToman, type RepairRequest } from "@/app/lib/repair/api";
import { LocationView, mapSourceFrom } from "./NeshanMap";
import { useRepairAuth } from "./RepairAuth";
import { InfoRow, Section, StatusChip } from "./ui";

const FLOW: { key: keyof RepairRequest; label: string }[] = [
  { key: "created_at", label: "ثبت" },
  { key: "assigned_at", label: "ارجاع" },
  { key: "invoiced_at", label: "صدور هزینه" },
  { key: "completed_at", label: "پرداخت و پایان" },
];

export function RequestTimeline({ request }: { request: RepairRequest }) {
  if (request.status === "canceled") {
    return (
      <Typography color="error" variant="body2">
        لغو شده در {formatFaDate(request.canceled_at)}
        {request.cancel_reason ? ` — ${request.cancel_reason}` : ""}
      </Typography>
    );
  }
  const active = FLOW.reduce((acc, step, index) => (request[step.key] ? index : acc), 0);

  return (
    <Stepper activeStep={request.status === "completed" ? FLOW.length : active + 1} alternativeLabel sx={{ "& .MuiStepLabel-label": { fontSize: 12 } }}>
      {FLOW.map((step) => (
        <Step key={step.label}>
          <StepLabel optional={request[step.key] ? <Typography variant="caption">{formatFaDate(request[step.key] as string, false)}</Typography> : undefined}>
            {step.label}
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}

export function RequestInfo({ request, showCustomer = false }: { request: RepairRequest; showCustomer?: boolean }) {
  const { config } = useRepairAuth();
  const point =
    request.latitude !== null && request.longitude !== null ? { lat: request.latitude, lng: request.longitude } : null;

  return (
    <Section
      title={`درخواست #${request.id}${request.category ? ` · ${request.category}` : ""}`}
      action={<StatusChip status={request.status} label={request.status_label} />}
    >
      <Typography sx={{ whiteSpace: "pre-wrap", mb: 1.5 }}>{request.description}</Typography>
      <Divider sx={{ mb: 1 }} />
      <InfoRow label="آدرس" value={request.address} />
      {point && config && (
        <Stack sx={{ my: 1 }}>
          <LocationView source={mapSourceFrom(config)} point={point} />
        </Stack>
      )}
      <InfoRow
        label="تماس"
        value={
          <>
            {request.contact_name ? `${request.contact_name} — ` : ""}
            <MuiLink href={`tel:${request.contact_phone}`} dir="ltr">
              {request.contact_phone}
            </MuiLink>
          </>
        }
      />
      {showCustomer && request.customer && (
        <InfoRow label="حساب مشتری" value={`${request.customer.name || "—"} (${request.customer.phone})`} />
      )}
      {request.preferred_time && <InfoRow label="زمان مناسب" value={request.preferred_time} />}
      <InfoRow
        label="تعمیرکار"
        value={
          request.technician ? (
            <>
              {request.technician.name}
              {request.technician.specialty ? ` (${request.technician.specialty})` : ""} —{" "}
              <MuiLink href={`tel:${request.technician.phone}`} dir="ltr">
                {request.technician.phone}
              </MuiLink>
            </>
          ) : (
            "هنوز ارجاع نشده"
          )
        }
      />
      <InfoRow label="تاریخ ثبت" value={formatFaDate(request.created_at)} />
      <Divider sx={{ my: 1.5 }} />
      <RequestTimeline request={request} />
    </Section>
  );
}

export function CostBreakdown({ request, showShares = false }: { request: RepairRequest; showShares?: boolean }) {
  if (!request.total_amount) return null;
  return (
    <Section title="هزینه">
      <Stack>
        <InfoRow label="اجرت" value={formatToman(request.labor_amount)} />
        <InfoRow label="قطعات" value={formatToman(request.parts_amount)} />
        <Divider sx={{ my: 0.5 }} />
        <InfoRow label="جمع کل" value={<b>{formatToman(request.total_amount)}</b>} />
        {request.cost_description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
            {request.cost_description}
          </Typography>
        )}
        {showShares && request.technician_share !== undefined && (
          <>
            <Divider sx={{ my: 1 }} />
            <InfoRow label={`سهم تعمیرکار (${request.share_percent ?? 0}٪ اجرت + قطعات)`} value={formatToman(request.technician_share)} />
            {request.platform_share !== undefined && <InfoRow label="سهم مجموعه" value={formatToman(request.platform_share)} />}
          </>
        )}
        {request.paid_at && (
          <>
            <Divider sx={{ my: 1 }} />
            <InfoRow label="روش پرداخت" value={request.payment_method_label || "—"} />
            <InfoRow label="زمان پرداخت" value={formatFaDate(request.paid_at)} />
            {request.payment_ref && <InfoRow label="شمارهٔ پیگیری" value={request.payment_ref} />}
          </>
        )}
      </Stack>
    </Section>
  );
}
