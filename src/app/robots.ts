import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/seo";

/**
 * صفحات عمومی ایندکس می‌شوند.
 * پنل مدیریت، اپ تعویض روغن، سبد و مسیرهای خصوصی از ایندکس گوگل خارج‌اند.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/oil",
          "/oil/",
          "/oilservice",
          "/oilservice/",
          "/cart",
          "/orders",
          "/main",
          "/referrals",
          "/api/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/oil",
          "/oil/",
          "/oilservice",
          "/oilservice/",
          "/cart",
          "/orders",
          "/main",
          "/referrals",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
