import { promises as fs } from "fs";
import path from "path";

export const SITE_PAGE_KEYS = ["landing", "accounting", "accounting_admin", "smart_club"] as const;

export type SitePageKey = (typeof SITE_PAGE_KEYS)[number];

export const SITE_PAGE_LABELS: Record<SitePageKey, { title: string; hint: string }> = {
  landing: { title: "صفحه لندینگ", hint: "صفحه اصلی محصولات وبینو" },
  accounting: { title: "صفحه حسابداری", hint: "لندینگ نرم‌افزار حسابداری و فروش" },
  accounting_admin: { title: "ادمین حسابداری", hint: "بخش حسابداری داخل پنل" },
  smart_club: { title: "صفحه باشگاه هوشمند", hint: "لندینگ باشگاه مشتریان هوشمند" },
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
    smart_club: emptyBucket(),
  };
}

/** تاریخ میلادی تهران. ایران از ۱۴۰۱ دیگر ساعت تابستانی ندارد؛ همیشه ‎+03:30‎. */
export function tehranToday(now = new Date()): string {
  const tehran = new Date(now.getTime() + (3 * 60 + 30) * 60 * 1000);
  const year = tehran.getUTCFullYear();
  const month = String(tehran.getUTCMonth() + 1).padStart(2, "0");
  const day = String(tehran.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shiftYmd(ymd: string, deltaDays: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + deltaDays));
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function visitDay(at: string): string {
  const time = new Date(at).getTime();
  if (Number.isNaN(time)) return "";
  return tehranToday(new Date(time));
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

function isSampleIp(ip: string): boolean {
  return /^(192\.0\.2\.|198\.51\.100\.|203\.0\.113\.)/.test(ip);
}

/** جمع کل همان جمع روزهای ۳۰ روز اخیر است تا با جدول روزانه یکی بماند. */
function reconcileBucket(bucket: Bucket, today: string): Bucket {
  const min = shiftYmd(today, -(KEEP_DAYS - 1));
  const days: Record<string, number> = {};
  for (const [day, count] of Object.entries(bucket.days)) {
    if (day >= min && day <= today && count > 0) days[day] = count;
  }
  const visits = bucket.visits.filter((item) => {
    if (isSampleIp(item.ip)) return false;
    const day = visitDay(item.at);
    return day >= min && day <= today;
  });
  const listed: Record<string, number> = {};
  for (const item of visits) {
    const day = visitDay(item.at);
    listed[day] = (listed[day] || 0) + 1;
  }
  for (const [day, count] of Object.entries(listed)) {
    if (!days[day] || days[day] < count) days[day] = count;
  }
  const total = Object.values(days).reduce((sum, count) => sum + count, 0);
  return { total, days, visits: visits.slice(0, MAX_VISITS) };
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
    const at = new Date().toISOString();
    const ip = cleanVisitorIp(visitor.ip);
    const name = cleanVisitorName(visitor.name);
    const bucket = reconcileBucket(store[page], today);
    const latest = bucket.visits[0];
    const latestAt = latest ? new Date(latest.at).getTime() : 0;
    if (latest && latest.ip === ip && Number.isFinite(latestAt) && Date.now() - latestAt < 3000) {
      store[page] = bucket;
      await fs.mkdir(path.dirname(FILE), { recursive: true });
      await fs.writeFile(FILE, JSON.stringify(store), "utf8");
      return;
    }
    bucket.days[today] = (bucket.days[today] || 0) + 1;
    bucket.visits = [{ at, ip, name }, ...bucket.visits].slice(0, MAX_VISITS);
    bucket.total = Object.values(bucket.days).reduce((sum, count) => sum + count, 0);
    store[page] = bucket;
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
    const bucket = reconcileBucket(store[key], today);
    const days = Object.entries(bucket.days)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
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
