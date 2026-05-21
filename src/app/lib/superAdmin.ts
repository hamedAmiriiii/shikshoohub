export const SUPER_ADMIN_PHONE = '09399166196';

export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  let n = phone.replace(/\D/g, '');
  if (n.startsWith('98') && n.length === 12) n = `0${n.slice(2)}`;
  if (n.length === 10 && n.startsWith('9')) n = `0${n}`;
  return n;
}

export function isSuperAdminPhone(phone: string | null | undefined): boolean {
  return normalizePhone(phone) === SUPER_ADMIN_PHONE;
}

/** استخراج شماره از آبجکت کاربر (API اغلب username = موبایل است) */
export function getUserPhoneFromRecord(
  user: Record<string, unknown> | null | undefined
): string {
  if (!user) return '';
  const atelier = user.atelier as { phone?: string } | undefined;
  return normalizePhone(
    (user.phone as string) ||
      (user.mobile as string) ||
      (user.username as string) ||
      atelier?.phone ||
      ''
  );
}

export function getStoredUserPhone(): string {
  if (typeof window === 'undefined') return '';
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return getUserPhoneFromRecord(user);
  } catch {
    return '';
  }
}

export function isSuperAdminUser(): boolean {
  return isSuperAdminPhone(getStoredUserPhone());
}
