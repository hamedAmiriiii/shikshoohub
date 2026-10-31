/** کدهای قدیمی A، B، … را همان شمارهٔ گروه برمی‌گرداند. */
export function numericGroupCode(code?: string | number | null): string {
  const raw = String(code ?? "").trim().toUpperCase();
  if (/^[A-Z]$/.test(raw)) return String(raw.charCodeAt(0) - 64);
  return raw;
}
