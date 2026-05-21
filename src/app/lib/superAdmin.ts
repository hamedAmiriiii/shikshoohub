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

export function getStoredUserPhone(): string {
  if (typeof window === 'undefined') return '';
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return normalizePhone(user.phone || user.username || user.mobile || '');
  } catch {
    return '';
  }
}

export function isSuperAdminUser(): boolean {
  return isSuperAdminPhone(getStoredUserPhone());
}
