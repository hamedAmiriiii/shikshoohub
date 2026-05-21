/** پسوند لغو که به انتهای هر پیامک اضافه می‌شود */
export const SMS_CANCEL_SUFFIX = 'لغو11';

/** هر واحد پیامک = حداکثر ۷۰ کاراکتر (متن + پسوند) */
export const SMS_CHARS_PER_UNIT = 70;

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
