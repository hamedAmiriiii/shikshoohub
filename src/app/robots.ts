import type { MetadataRoute } from "next";
import { siteUrl } from "./shikshoo/blog/blogApi";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/shikshoo/admin", "/main"],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
