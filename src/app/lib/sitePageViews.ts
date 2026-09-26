import { promises as fs } from "fs";
import path from "path";

export const SITE_PAGE_KEYS = ["landing", "accounting", "accounting_admin"] as const;

export type SitePageKey = (typeof SITE_PAGE_KEYS)[number];

export const SITE_PAGE_LABELS: Record<SitePageKey, { title: string; hint: string }> = {
  landing: { title: "صفحه لندینگ", hint: "صفحه اصلی محصولات وبینو" },
  accounting: { title: "صفحه حسابداری", hint: "لندینگ نرم‌افزار حسابداری و فروش" },
  accounting_admin: { title: "ادمین حسابداری", hint: "بخش حسابداری داخل پنل" },
};

export type SitePageVisit = {
  at: string;
  ip: string;
  name: string | null;
};

type Bucket = { total: number; days: Record<string, number>; visits: SitePageVisit[] };
type Store = Record<SitePageKey, Bucket>;

const FILE = path.join(process.cwd(), "data", "site-page-views.json");
const KEEP_DAYS = 30;
const MAX_VISITS = 80;

function emptyBucket(): Bucket {
  return { total: 0, days: {}, visits: [] };
}

function emptyStore(): Store {
  return {
    landing: emptyBucket(),
    accounting: emptyBucket(),
    accounting_admin: emptyBucket(),
  };
}

export function tehranToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
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

function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F]/g, "").trim().slice(0, max);
}

function asVisit(value: unknown): SitePageVisit | null {
  if (!value || typeof value !== "object") return null;
  const row = value as { at?: unknown; ip?: unknown; name?: unknown };
  const at = cleanText(row.at, 40);
  if (!at || Number.isNaN(new Date(at).getTime())) return null;
  const ip = cleanText(row.ip, 64) || "نامشخص";
  const name = cleanText(row.name, 80);
  return { at, ip, name: name || null };
}

function asBucket(value: unknown): Bucket {
  if (!value || typeof value !== "object") return emptyBucket();
  const row = value as { total?: unknown; days?: unknown; visits?: unknown };
  const days: Record<string, number> = {};
  if (row.days && typeof row.days === "object") {
    for (const [day, count] of Object.entries(row.days as Record<string, unknown>)) {
      const n = Number(count);
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(n) && n > 0) days[day] = n;
    }
  }
  const visits = Array.isArray(row.visits)
    ? row.visits.map(asVisit).filter((item): item is SitePageVisit => item !== null).slice(0, MAX_VISITS)
    : [];
  return { total: Math.max(0, Number(row.total) || 0), days, visits };
}

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Record<SitePageKey, unknown>>;
    const store = emptyStore();
    for (const key of SITE_PAGE_KEYS) store[key] = asBucket(parsed[key]);
    return store;
  } catch {
    return emptyStore();
  }
}

function pruneDays(days: Record<string, number>, today: string): Record<string, number> {
  const cutoff = new Date(`${today}T12:00:00+03:30`);
  cutoff.setDate(cutoff.getDate() - (KEEP_DAYS - 1));
  const min = tehranToday(cutoff);
  const next: Record<string, number> = {};
  for (const [day, count] of Object.entries(days)) {
    if (day >= min && count > 0) next[day] = count;
  }
  return next;
}

export function isSitePageKey(value: unknown): value is SitePageKey {
  return typeof value === "string" && (SITE_PAGE_KEYS as readonly string[]).includes(value);
}

export function cleanVisitorName(value: unknown): string | null {
  const name = cleanText(value, 80);
  return name || null;
}

export function cleanVisitorIp(value: unknown): string {
  const ip = cleanText(value, 64);
  return ip || "نامشخص";
}

export async function recordSitePageView(
  page: SitePageKey,
  visitor: { ip: string; name: string | null },
): Promise<void> {
  await withLock(async () => {
    const store = await readStore();
    const today = tehranToday();
    const bucket = store[page];
    const at = new Date().toISOString();
    bucket.total += 1;
    bucket.days = pruneDays(bucket.days, today);
    bucket.days[today] = (bucket.days[today] || 0) + 1;
    const min = tehranToday(new Date(Date.now() - (KEEP_DAYS - 1) * 86400000));
    bucket.visits = [
      { at, ip: cleanVisitorIp(visitor.ip), name: cleanVisitorName(visitor.name) },
      ...bucket.visits.filter((item) => item.at.slice(0, 10) >= min),
    ].slice(0, MAX_VISITS);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(store), "utf8");
  });
}

export type SitePageStat = {
  key: SitePageKey;
  title: string;
  hint: string;
  total: number;
  today: number;
  days: { date: string; count: number }[];
  visits: SitePageVisit[];
};

export async function readSitePageStats(): Promise<SitePageStat[]> {
  const store = await readStore();
  const today = tehranToday();
  return SITE_PAGE_KEYS.map((key) => {
    const bucket = store[key];
    const days = Object.entries(bucket.days)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 14)
      .map(([date, count]) => ({ date, count }));
    return {
      key,
      title: SITE_PAGE_LABELS[key].title,
      hint: SITE_PAGE_LABELS[key].hint,
      total: bucket.total,
      today: bucket.days[today] || 0,
      days,
      visits: bucket.visits.slice(0, 20),
    };
  });
}
