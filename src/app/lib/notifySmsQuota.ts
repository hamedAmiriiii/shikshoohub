import { toast } from "react-toastify";

export const SMS_QUOTA_SIDE_EFFECT_NOTICE =
  "عملیات انجام شد ولی شارژ پیامک تمام شده و پیامک ارسال نشد.";

export function notifySmsQuotaIfExhausted(res: unknown) {
  if (!res || typeof res !== "object") return;
  const r = res as Record<string, unknown>;
  if (r.sms_quota_exhausted === true) {
    const msg =
      typeof r.sms_error === "string" && r.sms_error.trim()
        ? r.sms_error
        : SMS_QUOTA_SIDE_EFFECT_NOTICE;
    toast.warn(msg);
    return;
  }
  if (r.sms_sent === false && typeof r.sms_error === "string" && r.sms_error.trim()) {
    toast.warn(r.sms_error);
  }
}
