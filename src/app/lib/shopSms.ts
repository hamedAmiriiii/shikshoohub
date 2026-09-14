/** پسوند لغو که به انتهای هر پیامک اضافه می‌شود */
export const SMS_CANCEL_SUFFIX = 'لغو11';

/** هر واحد پیامک = حداکثر ۷۰ کاراکتر (متن + پسوند) */
export const SMS_CHARS_PER_UNIT = 70;

export const SMS_DELIVERY_STATUS_LABELS: Record<string, string> = {
  ENQUEUED: 'در صف ارسال',
  SENT: 'ارسال‌شده به مخابرات',
  DELIVERED: 'تحویل داده شده',
  FAILED: 'خطا از اپراتور',
  FILTERED: 'فیلتر شده',
  BLACKLIST: 'بلک‌لیست',
  UNDELIVERED: 'تحویل نشده',
  SCHEDULED: 'زمان‌بندی‌شده',
  INVALID_NUMBER: 'شماره نامعتبر',
  PENDING: 'در انتظار تایید',
  REJECTED: 'رد شده',
  INAPPROPRIATE_CONTENT: 'متن نامناسب',
  SEND_FAILED: 'خطا در ارسال',
  UNKNOWN: 'نامشخص',
};

export const SMS_FINAL_DELIVERY_STATUSES = new Set([
  'DELIVERED',
  'FAILED',
  'FILTERED',
  'BLACKLIST',
  'INVALID_NUMBER',
  'REJECTED',
  'INAPPROPRIATE_CONTENT',
  'SEND_FAILED',
]);

export function formatSmsDeliveryStatus(status?: string | null, label?: string | null): string {
  if (label && String(label).trim()) return String(label);
  if (!status) return SMS_DELIVERY_STATUS_LABELS.UNKNOWN;
  return SMS_DELIVERY_STATUS_LABELS[status] || status;
}

export function getSmsDeliveryStatusColor(
  status?: string | null,
): 'success' | 'warning' | 'error' | 'info' | 'default' {
  switch (status) {
    case 'DELIVERED':
      return 'success';
    case 'ENQUEUED':
    case 'SENT':
    case 'SCHEDULED':
    case 'PENDING':
    case 'UNDELIVERED':
      return 'warning';
    case 'FAILED':
    case 'FILTERED':
    case 'BLACKLIST':
    case 'INVALID_NUMBER':
    case 'REJECTED':
    case 'INAPPROPRIATE_CONTENT':
    case 'SEND_FAILED':
      return 'error';
    default:
      return 'default';
  }
}

export function canRefreshSmsDeliveryStatus(log: {
  delivery_status?: string | null;
  reference_id?: string | number | null;
  batch_id?: string | number | null;
}): boolean {
  const status = log.delivery_status || '';
  if (status && SMS_FINAL_DELIVERY_STATUSES.has(status)) return false;
  return Boolean(log.reference_id || log.batch_id);
}

/** تعداد کاراکتر کامل پیامک (متن + پسوند لغو) */
export function getSmsFullText(message: string): string {
  return `${message}${SMS_CANCEL_SUFFIX}`;
}

/** واحد پیامک برای یک متن */
export function calcSmsUnitsForMessage(message: string): number {
  const len = getSmsFullText(message).length;
  if (len === 0) return 0;
  return Math.ceil(len / SMS_CHARS_PER_UNIT);
}

/** واحد کل برای ارسال گروهی به چند شماره */
export function calcSmsUnitsForBroadcast(message: string, recipientCount: number): number {
  if (recipientCount <= 0) return 0;
  return calcSmsUnitsForMessage(message) * recipientCount;
}
