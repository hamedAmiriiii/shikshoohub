const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://webinoplus.ir";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const SHOP_CODE = process.env.NEXT_PUBLIC_SHOP_CODE || "";

export type BlogPostSummary = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  featured_image_url?: string | null;
  author_name?: string | null;
  published_at?: string | null;
  reading_time?: number | null;
  views_count?: number;
  category?: { id: number; name: string; slug: string } | null;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string | null;
    canonical_url?: string | null;
    og_title?: string;
    og_description?: string;
    og_image?: string | null;
  };
};

function shopQuery() {
  return SHOP_CODE ? `atelier_code=${encodeURIComponent(SHOP_CODE)}` : "";
}

export async function fetchBlogApi<T = any>(path: string, init?: RequestInit): Promise<T | null> {
  const q = shopQuery();
  const joiner = path.includes("?") ? "&" : "?";
  const url = `${API_BASE}${path}${q ? `${joiner}${q}` : ""}`;
  try {
    const res = await fetch(url, {
      ...init,
      next: { revalidate: 60 },
      headers: {
        Accept: "application/json",
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function siteUrl(path = "") {
  return `${SITE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function absoluteMedia(url?: string | null) {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${API_BASE.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}
