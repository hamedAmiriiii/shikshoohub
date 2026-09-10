import type { MetadataRoute } from "next";
import { LANDING_PRODUCTS } from "./landing/catalog";
import { SITE_URL } from "./lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const pages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/landing/shop`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/agency-request`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  for (const product of LANDING_PRODUCTS) {
    if (product.slug === "accounting") continue;
    pages.push({
      url: `${SITE_URL}${product.href}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return pages;
}
