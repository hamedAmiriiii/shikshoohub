export type YadinoPlan = {
  id?: number;
  product?: string;
  name: string;
  max_users: number;
  max_videos: number;
  duration_days: number;
  duration_label: string;
  price_toman: number;
  features: string[];
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

export type YadinoTier = {
  max_users: number;
  name: string;
  features: string[];
  plans: YadinoPlan[];
};

const DURATION_ORDER = [180, 365] as const;

const FA_USERS: Record<number, string> = {
  5: "۵",
  30: "۳۰",
  50: "۵۰",
  100: "۱۰۰",
  150: "۱۵۰",
  250: "۲۵۰",
  350: "۳۵۰",
  500: "۵۰۰",
};

const DURATION_LABEL: Record<number, string> = {
  30: "یک‌ماهه",
  90: "سه‌ماهه",
  180: "شش‌ماهه",
  365: "یک‌ساله",
};

const TIERS: Array<{
  users: number;
  monthly: number;
  quarterly: number;
  semiannual: number;
  yearly: number;
}> = [
  { users: 5, monthly: 430000, quarterly: 1290000, semiannual: 2580000, yearly: 5160000 },
  { users: 30, monthly: 1560000, quarterly: 4320000, semiannual: 8160000, yearly: 14640000 },
  { users: 50, monthly: 2250000, quarterly: 6120000, semiannual: 11700000, yearly: 21120000 },
  { users: 100, monthly: 4270000, quarterly: 11700000, semiannual: 22440000, yearly: 39600000 },
  { users: 150, monthly: 6240000, quarterly: 17100000, semiannual: 32760000, yearly: 58920000 },
  { users: 250, monthly: 9650000, quarterly: 26490000, semiannual: 49980000, yearly: 91320000 },
  { users: 350, monthly: 13190000, quarterly: 35700000, semiannual: 68580000, yearly: 124200000 },
  { users: 500, monthly: 18580000, quarterly: 50220000, semiannual: 96420000, yearly: 174360000 },
];

function yadinoFeatures(users: number): string[] {
  const fa = FA_USERS[users] ?? String(users);
  return [
    `تا ${fa} کاربر همزمان`,
    "زمان برگزاری نامحدود",
    "تا ۴ ویدئو همزمان",
    "پیام‌رسان اختصاصی",
    "ایجاد چند کلاس و جلسه همزمان",
    "اشتراک‌گذاری تصویر",
    "اشتراک‌گذاری تخته",
  ];
}

function discountedToman(n: number): number {
  return Math.round(n * 0.95);
}

export function fallbackYadinoPlans(): YadinoPlan[] {
  const rows: YadinoPlan[] = [];
  let sort = 1;
  for (const tier of TIERS) {
    const features = yadinoFeatures(tier.users);
    const prices = [tier.semiannual, tier.yearly];
    DURATION_ORDER.forEach((days, i) => {
      rows.push({
        name: `سرویس آموزشی ${FA_USERS[tier.users]} کاربره`,
        max_users: tier.users,
        max_videos: 4,
        duration_days: days,
        duration_label: DURATION_LABEL[days],
        price_toman: discountedToman(prices[i]),
        features,
        description: features.join("، "),
        is_active: true,
        sort_order: sort++,
      });
    });
  }
  return rows;
}

export function groupYadinoTiers(plans: YadinoPlan[]): YadinoTier[] {
  const map = new Map<number, YadinoTier>();
  for (const plan of plans) {
    if (plan.is_active === false) continue;
    let tier = map.get(plan.max_users);
    if (!tier) {
      tier = {
        max_users: plan.max_users,
        name: plan.name,
        features: plan.features?.length ? plan.features : yadinoFeatures(plan.max_users),
        plans: [],
      };
      map.set(plan.max_users, tier);
    }
    tier.plans.push(plan);
  }
  return Array.from(map.values())
    .sort((a, b) => a.max_users - b.max_users)
    .map((tier) => ({
      ...tier,
      plans: [...tier.plans].sort(
        (a, b) => DURATION_ORDER.indexOf(a.duration_days as (typeof DURATION_ORDER)[number]) - DURATION_ORDER.indexOf(b.duration_days as (typeof DURATION_ORDER)[number]) || a.duration_days - b.duration_days,
      ),
    }));
}

export function formatYadinoToman(n: number): string {
  return `${new Intl.NumberFormat("fa-IR").format(Math.max(0, Math.round(n)))} تومان`;
}
