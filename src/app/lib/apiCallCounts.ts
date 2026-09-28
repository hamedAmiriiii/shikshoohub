import { promises as fs } from "fs";
import path from "path";
import { API_CALL_DEFS, API_CALL_KEYS, type ApiCallKey } from "./apiCallKeys";
import { cleanVisitorIp, cleanVisitorName, shiftYmd, tehranToday, visitDay } from "./sitePageViews";

export type ApiCallRecent = {
  at: string;
  ip: string;
  name: string | null;
  ok: boolean;
  status: number;
};

type DayCount = { ok: number; fail: number };
type Bucket = { days: Record<string, DayCount>; recent: ApiCallRecent[] };
type Store = Record<ApiCallKey, Bucket>;

const FILE = path.join(process.cwd(), "data", "api-call-counts.json");
const KEEP_DAYS = 30;
const MAX_RECENT = 50;

function emptyStore(): Store {
  const store = {} as Store;
  for (const key of API_CALL_KEYS) store[key] = { days: {}, recent: [] };
  return store;
}

function asCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function asRecent(value: unknown): ApiCallRecent | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const at = typeof row.at === "string" ? row.at : "";
  if (!at || Number.isNaN(new Date(at).getTime())) return null;
  return {
    at,
    ip: cleanVisitorIp(row.ip),
    name: cleanVisitorName(row.name),
    ok: row.ok === true,
    status: asCount(row.status),
  };
}

function asBucket(value: unknown): Bucket {
  if (!value || typeof value !== "object") return { days: {}, recent: [] };
  const row = value as { days?: unknown; recent?: unknown };
  const days: Record<string, DayCount> = {};
  if (row.days && typeof row.days === "object") {
    for (const [day, count] of Object.entries(row.days as Record<string, unknown>)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !count || typeof count !== "object") continue;
      const c = count as Record<string, unknown>;
      const ok = asCount(c.ok);
      const fail = asCount(c.fail);
      if (ok + fail > 0) days[day] = { ok, fail };
    }
  }
  const recent = Array.isArray(row.recent)
    ? row.recent.map(asRecent).filter((item): item is ApiCallRecent => item !== null).slice(0, MAX_RECENT)
    : [];
  return { days, recent };
}

async function readStore(): Promise<Store> {
  try {
    const parsed = JSON.parse(await fs.readFile(FILE, "utf8")) as Partial<Record<ApiCallKey, unknown>>;
    const store = emptyStore();
    for (const key of API_CALL_KEYS) store[key] = asBucket(parsed[key]);
    return store;
  } catch {
    return emptyStore();
  }
}

function prune(bucket: Bucket, today: string): Bucket {
  const min = shiftYmd(today, -(KEEP_DAYS - 1));
  const days: Record<string, DayCount> = {};
  for (const [day, count] of Object.entries(bucket.days)) {
    if (day >= min && day <= today) days[day] = count;
  }
  const recent = bucket.recent.filter((item) => {
    const day = visitDay(item.at);
    return day >= min && day <= today;
  });
  return { days, recent };
}

let chain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function recordApiCall(
  key: ApiCallKey,
  call: { ok: boolean; status: number; ip: string; name: string | null },
): Promise<void> {
  await withLock(async () => {
    const store = await readStore();
    const today = tehranToday();
    const bucket = prune(store[key], today);
    const day = bucket.days[today] || { ok: 0, fail: 0 };
    if (call.ok) day.ok += 1;
    else day.fail += 1;
    bucket.days[today] = day;
    bucket.recent = [
      { at: new Date().toISOString(), ip: call.ip, name: call.name, ok: call.ok, status: call.status },
      ...bucket.recent,
    ].slice(0, MAX_RECENT);
    store[key] = bucket;
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(store), "utf8");
  });
}

export type ApiCallStat = {
  key: ApiCallKey;
  title: string;
  hint: string;
  method: string;
  path: string;
  today: number;
  todayFail: number;
  total: number;
  totalFail: number;
  uniqueIpsToday: number;
  days: { date: string; ok: number; fail: number }[];
  recent: ApiCallRecent[];
};

export async function readApiCallStats(): Promise<ApiCallStat[]> {
  const store = await readStore();
  const today = tehranToday();
  return API_CALL_KEYS.map((key) => {
    const bucket = prune(store[key], today);
    const def = API_CALL_DEFS[key];
    const days = Object.entries(bucket.days)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, count]) => ({ date, ok: count.ok, fail: count.fail }));
    const todayCount = bucket.days[today] || { ok: 0, fail: 0 };
    const ipsToday = new Set(bucket.recent.filter((item) => visitDay(item.at) === today).map((item) => item.ip));
    return {
      key,
      title: def.title,
      hint: def.hint,
      method: def.method,
      path: def.path,
      today: todayCount.ok + todayCount.fail,
      todayFail: todayCount.fail,
      total: days.reduce((sum, day) => sum + day.ok + day.fail, 0),
      totalFail: days.reduce((sum, day) => sum + day.fail, 0),
      uniqueIpsToday: ipsToday.size,
      days,
      recent: bucket.recent.slice(0, 15),
    };
  });
}
