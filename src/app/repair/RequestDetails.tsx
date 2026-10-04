"use client";

import { Box, Button, Divider, Link as MuiLink, Stack, Step, StepLabel, Stepper, Typography } from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUserOutlined";
import { formatFaDate, formatToman, type RepairRequest } from "@/app/lib/repair/api";
import { LocationView, mapSourceFrom } from "./NeshanMap";
import { RatingBadge } from "./Rating";
import { useRepairAuth } from "./RepairAuth";
import { TechnicianPhoto } from "./TechIdentity";
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
    <Stepper
      activeStep={request.status === "completed" ? FLOW.length : active + 1}
      alternativeLabel
      sx={{
        "& .MuiStepLabel-label": { fontSize: 12 },
        // MUI بدون پلاگین RTL خط را با left/right می‌گذارد و در راست‌به‌چپ یک مرحله جابه‌جا می‌شود
        "& .MuiStepConnector-root": {
          left: "auto",
          right: "auto",
          insetInlineStart: "calc(-50% + 20px)",
          insetInlineEnd: "calc(50% + 20px)",
        },
      }}
    >
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

export function RequestInfo({
  request,
  showCustomer = false,
  showRouting = false,
}: {
  request: RepairRequest;
  showCustomer?: boolean;
  showRouting?: boolean;
}) {
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
          <LocationView source={mapSourceFrom(config)} point={point} showRouting={showRouting} />
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
      {request.preferred_time && <InfoRow label="زمان مراجعه" value={request.preferred_time} />}
      {request.technician ? (
        <TechnicianCard technician={request.technician} forCustomer={!showCustomer} />
      ) : (
        <InfoRow label="تعمیرکار" value="هنوز ارجاع نشده" />
      )}
      <InfoRow label="تاریخ ثبت" value={formatFaDate(request.created_at)} />
      <Divider sx={{ my: 1.5 }} />
      <RequestTimeline request={request} />
    </Section>
  );
}

function TechnicianCard({
  technician,
  forCustomer,
}: {
  technician: NonNullable<RepairRequest["technician"]>;
  forCustomer: boolean;
}) {
  return (
    <Box sx={{ my: 1, p: 1.5, borderRadius: 3, bgcolor: "action.hover" }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <TechnicianPhoto name={technician.name} photoUrl={technician.photo_url} size={forCustomer ? 72 : 52} />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            تعمیرکار
          </Typography>
          <Typography fontWeight={800} noWrap>
            {technician.name || "—"}
          </Typography>
          {technician.specialty && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {technician.specialty}
            </Typography>
          )}
          {(technician.rating_count ?? 0) > 0 && (
            <RatingBadge avg={technician.rating_avg ?? null} count={technician.rating_count ?? 0} />
          )}
        </Box>
        <Button
          href={`tel:${technician.phone}`}
          variant="outlined"
          size="small"
          startIcon={<PhoneIcon />}
          sx={{ flexShrink: 0, borderRadius: 3 }}
        >
          تماس
        </Button>
      </Stack>
      {forCustomer && (
        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1.25, color: "success.dark" }}>
          <VerifiedUserIcon fontSize="small" sx={{ mt: 0.25 }} />
          <Typography variant="caption" sx={{ lineHeight: 1.9 }}>
            {technician.photo_url
              ? "برای امنیت شما: هنگام مراجعه، چهرهٔ تعمیرکار را با این عکس مقایسه کنید و در صورت مغایرت در را باز نکنید و با پشتیبانی تماس بگیرید."
              : "برای امنیت شما: هنگام مراجعه، نام تعمیرکار را بپرسید و در صورت مغایرت با پشتیبانی تماس بگیرید."}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}

export function CostBreakdown({
  request,
  showShares = false,
  forTechnician = false,
}: {
  request: RepairRequest;
  showShares?: boolean;
  forTechnician?: boolean;
}) {
  if (!request.total_amount) return null;

  if (forTechnician) {
    return (
      <Section title="هزینه">
        <Stack>
          <InfoRow label="مبلغ کل" value={<b>{formatToman(request.total_amount)}</b>} />
          <InfoRow label="هزینه (اجرت)" value={formatToman(request.labor_amount)} />
          <InfoRow label="هزینهٔ قطعات" value={formatToman(request.parts_amount)} />
          {request.technician_share !== undefined && (
            <>
              <Divider sx={{ my: 0.5 }} />
              <InfoRow
                label="سهم تعمیرکار"
                value={
                  <Typography component="span" fontWeight={800} color="success.main">
                    {formatToman(request.technician_share)}
                  </Typography>
                }
              />
            </>
          )}
          {request.cost_description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
              {request.cost_description}
            </Typography>
          )}
          {request.paid_at && (
            <>
              <Divider sx={{ my: 1 }} />
              <InfoRow label="روش پرداخت" value={request.payment_method_label || "—"} />
              <InfoRow label="زمان پرداخت" value={formatFaDate(request.paid_at)} />
            </>
          )}
        </Stack>
      </Section>
    );
  }

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
