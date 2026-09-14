import type { Metadata } from "next";
import JsonLd from "@/app/components/JsonLd";
import { pageMetadata, SITE_URL } from "@/app/lib/seo";
import DigitalMenuLandingClient from "./DigitalMenuLandingClient";

export const metadata: Metadata = pageMetadata({
  title: "منوی دیجیتال رستوران و کافی‌شاپ وبینو | سفارش با QR و پرداخت آنلاین",
  description:
    "منوی دیجیتال وبینو برای رستوران و کافی‌شاپ: اسکن QR روی میز، مشاهده منو روی گوشی، سفارش و پرداخت آنلاین متصل به نرم‌افزار فروش.",
  path: "/landing/menu",
  keywords: [
    "منو دیجیتال",
    "منوی دیجیتال رستوران",
    "منو آنلاین کافی شاپ",
    "سفارش با QR",
    "وبینو",
  ],
});

export default function DigitalMenuLandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "منوی دیجیتال وبینو",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android, iOS",
    url: `${SITE_URL}/landing/menu`,
    description:
      "منوی دیجیتال رستوران و کافی‌شاپ با اسکن QR، سفارش روی گوشی و پرداخت آنلاین متصل به وبینو.",
    featureList: [
      "اسکن QR میز",
      "نمایش تصویر و قیمت منو",
      "فراخوان گارسون",
      "پرداخت نقدی و آنلاین",
      "اتصال به باشگاه مشتریان",
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <DigitalMenuLandingClient />
    </>
  );
}
