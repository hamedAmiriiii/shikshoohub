import { readAdminPosSettings } from "@/app/lib/adminPosSettings";

export function parseDailyTicketNumber(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

export function dailyTicketFromRecord(record: unknown): number | null {
  if (!record || typeof record !== "object") return null;
  const row = record as Record<string, unknown>;
  return (
    parseDailyTicketNumber(row.daily_ticket_number) ??
    parseDailyTicketNumber(row.dailyTicketNumber) ??
    dailyTicketFromRecord(row.purchase)
  );
}

export function formatDailyTicketNumber(ticket: number): string {
  return new Intl.NumberFormat("fa-IR").format(ticket);
}

/** هر دو شماره: فاکتور و، اگر فعال باشد، شماره فیش روزانه. */
export function saleNumberLines(receipt: {
  purchaseId?: number | string | null;
  dailyTicketNumber?: number | null;
  showPurchaseId?: boolean;
}): string[] {
  const lines: string[] = [];
  if (receipt.showPurchaseId !== false && receipt.purchaseId != null && String(receipt.purchaseId) !== "") {
    lines.push(`فاکتور: ${receipt.purchaseId}`);
  }
  if (readAdminPosSettings().showDailyTicketNumber) {
    const ticket = parseDailyTicketNumber(receipt.dailyTicketNumber);
    if (ticket != null) lines.push(`شماره فیش: ${formatDailyTicketNumber(ticket)}`);
  }
  return lines;
}

export function saleNumberCaption(receipt: {
  purchaseId?: number | string | null;
  dailyTicketNumber?: number | null;
  showPurchaseId?: boolean;
}): string | null {
  const lines = saleNumberLines(receipt);
  return lines.length ? lines.join("\n") : null;
}
