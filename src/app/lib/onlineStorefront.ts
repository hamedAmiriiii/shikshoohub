export const ONLINE_STOREFRONT_BLOCKS = [
  "hero_slider",
  "categories",
  "trust",
  "best_selling",
  "category_banners",
  "latest",
] as const;

export type StorefrontBlockId = (typeof ONLINE_STOREFRONT_BLOCKS)[number];

export type StorefrontBanner = {
  image_url: string;
  link?: string;
  title?: string;
};

export type StorefrontTrustItem = {
  title: string;
  subtitle?: string;
  icon?: "shipping" | "payment" | "verified" | "support" | "return" | "original" | string;
};

export type OnlineStorefrontConfig = {
  logo_url: string | null;
  primary_color: string;
  banners: StorefrontBanner[];
  block_order: StorefrontBlockId[];
  hidden_category_ids: number[];
  trust_items: StorefrontTrustItem[];
  logo_path?: string | null;
};

export const DEFAULT_STOREFRONT_PRIMARY = "#ef4056";

export const DEFAULT_TRUST_ITEMS: StorefrontTrustItem[] = [
  { title: "ارسال سریع", subtitle: "تحویل به‌موقع سفارش", icon: "shipping" },
  { title: "پرداخت امن", subtitle: "درگاه معتبر بانکی", icon: "payment" },
  { title: "ضمانت اصالت", subtitle: "کالای اصل فروشگاه", icon: "verified" },
  { title: "پشتیبانی", subtitle: "همراه شما هستیم", icon: "support" },
];

export const BLOCK_LABELS: Record<StorefrontBlockId, string> = {
  hero_slider: "اسلایدر بنر",
  categories: "دسته‌بندی‌ها",
  trust: "نوار اعتماد",
  best_selling: "پرفروش‌ها",
  category_banners: "بنر دسته‌های ویژه",
  latest: "جدیدترین‌ها",
};

export function defaultOnlineStorefront(): OnlineStorefrontConfig {
  return {
    logo_url: null,
    primary_color: DEFAULT_STOREFRONT_PRIMARY,
    banners: [],
    block_order: [...ONLINE_STOREFRONT_BLOCKS],
    hidden_category_ids: [],
    trust_items: DEFAULT_TRUST_ITEMS.map((t) => ({ ...t })),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeColor(raw: unknown): string {
  const color = typeof raw === "string" ? raw.trim() : "";
  return /^#[0-9A-Fa-f]{6}$/.test(color) ? color.toLowerCase() : DEFAULT_STOREFRONT_PRIMARY;
}

function normalizeBlocks(raw: unknown): StorefrontBlockId[] {
  const order: StorefrontBlockId[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (
        typeof item === "string" &&
        (ONLINE_STOREFRONT_BLOCKS as readonly string[]).includes(item) &&
        !order.includes(item as StorefrontBlockId)
      ) {
        order.push(item as StorefrontBlockId);
      }
    }
  }
  for (const block of ONLINE_STOREFRONT_BLOCKS) {
    if (!order.includes(block)) order.push(block);
  }
  return order;
}

export function parseOnlineStorefront(raw: unknown): OnlineStorefrontConfig {
  const defaults = defaultOnlineStorefront();
  const root = asRecord(raw);
  const nested = asRecord(root?.storefront) ?? asRecord(asRecord(root?.settings)?.storefront);
  const source = nested ?? root;
  if (!source) return defaults;

  const banners: StorefrontBanner[] = [];
  if (Array.isArray(source.banners)) {
    for (const row of source.banners.slice(0, 8)) {
      const item = asRecord(row);
      if (!item) continue;
      const image_url = typeof item.image_url === "string" ? item.image_url.trim() : "";
      if (!image_url) continue;
      banners.push({
        image_url,
        link: typeof item.link === "string" ? item.link.trim() : "",
        title: typeof item.title === "string" ? item.title.trim() : "",
      });
    }
  }

  const hidden: number[] = [];
  if (Array.isArray(source.hidden_category_ids)) {
    for (const id of source.hidden_category_ids) {
      const n = Number(id);
      if (Number.isFinite(n) && n > 0 && !hidden.includes(n)) hidden.push(n);
    }
  }

  const trust: StorefrontTrustItem[] = [];
  if (Array.isArray(source.trust_items)) {
    for (const row of source.trust_items.slice(0, 6)) {
      const item = asRecord(row);
      if (!item) continue;
      const title = typeof item.title === "string" ? item.title.trim() : "";
      if (!title) continue;
      trust.push({
        title,
        subtitle: typeof item.subtitle === "string" ? item.subtitle.trim() : "",
        icon: typeof item.icon === "string" ? item.icon : "shipping",
      });
    }
  }

  return {
    logo_url:
      typeof source.logo_url === "string" && source.logo_url.trim()
        ? source.logo_url.trim()
        : null,
    primary_color: normalizeColor(source.primary_color),
    banners,
    block_order: normalizeBlocks(source.block_order),
    hidden_category_ids: hidden,
    trust_items: trust.length ? trust : defaults.trust_items,
    logo_path: typeof source.logo_path === "string" ? source.logo_path : null,
  };
}

/** استخراج storefront از پاسخ GET api/{shop} */
export function storefrontFromShopPayload(payload: unknown): OnlineStorefrontConfig {
  return parseOnlineStorefront(payload);
}

export function filterHiddenCategories<T extends { id: number; children?: T[] }>(
  categories: T[],
  hiddenIds: number[],
): T[] {
  if (!hiddenIds.length) return categories;
  const hidden = new Set(hiddenIds.map(Number));
  const walk = (cats: T[]): T[] =>
    cats
      .filter((c) => !hidden.has(Number(c.id)))
      .map((c) => ({
        ...c,
        children: c.children?.length ? walk(c.children) : c.children,
      }));
  return walk(categories);
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/storage/") || url.startsWith("storage/")) {
    const path = url.startsWith("/") ? url : `/${url}`;
    const base = (process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoo-plus.ir").replace(/\/$/, "");
    return `${base}${path}`;
  }
  return url;
}
