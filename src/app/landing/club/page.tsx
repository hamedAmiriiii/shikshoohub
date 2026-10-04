import type { Metadata } from "next";
import JsonLd from "@/app/components/JsonLd";
import RecordSiteView from "@/app/components/RecordSiteView";
import { pageMetadata, SITE_URL } from "@/app/lib/seo";
import SmartClubLandingClient from "./SmartClubLandingClient";

export const metadata: Metadata = pageMetadata({
  title: "باشگاه مشتریان هوشمند وبینو | بازگشت مشتری، کمپین هدفمند و کش‌بک",
  description:
    "باشگاه مشتریان هوشمند وبینو مستقیماً به نرم‌افزار فروش و حسابداری متصل است: گروه‌بندی RFM، هشدار ریزش مشتری، پیشنهاد اقدام خودکار، کمپین کالایی، اعتبار خرید و گزارش اثر کمپین.",
  path: "/landing/club",
  keywords: [
    "باشگاه مشتریان",
    "باشگاه مشتریان هوشمند",
    "نرم افزار باشگاه مشتریان",
    "کش بک",
    "تحلیل RFM",
    "پیامک بازگشت مشتری",
    "وبینو",
  ],
});

export default function SmartClubLandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "باشگاه مشتریان هوشمند وبینو",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android, iOS, Windows",
    url: `${SITE_URL}/landing/club`,
    description:
      "باشگاه مشتریان متصل به نرم‌افزار فروش و حسابداری: گروه‌بندی هوشمند، کمپین هدفمند، اعتبار خرید و گزارش فروش حاصل از کمپین.",
    featureList: [
      "گروه‌بندی هوشمند مشتریان با RFM",
      "داشبورد هوشمند",
      "پیشنهاد اقدام خودکار",
      "کمپین هدفمند و کمپین کالایی",
      "اعتبار خرید و کش‌بک پلکانی",
      "پیامک هوشمند",
      "گزارش اثر کمپین",
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <RecordSiteView page="smart_club" />
      <SmartClubLandingClient />
    </>
  );
}
