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
