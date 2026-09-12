import type { MetadataRoute } from "next";
import { fetchBlogApi, siteUrl } from "./shikshoo/blog/blogApi";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl("/shikshoo"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: siteUrl("/shikshoo/blog"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: siteUrl("/landing"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const shop = process.env.NEXT_PUBLIC_SHOP_CODE;
  const siteParam = `site_url=${encodeURIComponent(siteUrl(""))}`;
  const shopParam = shop ? `&atelier_code=${encodeURIComponent(shop)}` : "";
  const apiMap = await fetchBlogApi<{ urls?: { loc: string; lastmod?: string; priority?: string }[] }>(
    `/api/blog/sitemap?json=1&${siteParam}${shopParam}`
  );

  const fromApi: MetadataRoute.Sitemap = (apiMap?.urls || []).map((u) => ({
    url: u.loc,
    lastModified: u.lastmod ? new Date(u.lastmod) : new Date(),
    changeFrequency: "weekly",
    priority: Number(u.priority || 0.7),
  }));

  // اگر API در دسترس نبود، حداقل لیست پست‌ها را جداگانه بگیر
  if (fromApi.length === 0) {
    const postsRes = await fetchBlogApi<any>("/api/blog/posts?paginate=false&per_page=100&public_only=1");
    const posts = Array.isArray(postsRes?.data) ? postsRes.data : Array.isArray(postsRes) ? postsRes : [];
    for (const post of posts) {
      fromApi.push({
        url: siteUrl(`/shikshoo/blog/${post.slug}`),
        lastModified: post.published_at ? new Date(post.published_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  const map = new Map<string, MetadataRoute.Sitemap[number]>();
  [...staticRoutes, ...fromApi].forEach((item) => map.set(item.url, item));
  return Array.from(map.values());
}
