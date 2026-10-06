export type TablePagerCall = {
  id: number;
  status?: string;
  status_label?: string;
  note?: string | null;
  table_label?: string | null;
  table_number?: number | null;
  kind?: string | null;
  created_at?: string | null;
  acknowledged_at?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function extractTablePagerCalls(res: unknown): TablePagerCall[] {
  const obj = asRecord(res);
  const list = Array.isArray(res)
    ? res
    : Array.isArray(obj?.calls)
      ? obj.calls
      : Array.isArray(obj?.data)
        ? obj.data
        : [];
  return list.filter((item): item is TablePagerCall => Boolean(asRecord(item)?.id));
}

export function extractTablePagerCall(res: unknown): TablePagerCall | null {
  const obj = asRecord(res);
  const call = asRecord(obj?.call) ?? obj;
  if (!call?.id) return null;
  return call as TablePagerCall;
}
