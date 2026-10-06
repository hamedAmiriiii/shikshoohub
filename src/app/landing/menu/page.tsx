import type { Metadata } from "next";
import JsonLd from "@/app/components/JsonLd";
import RecordSiteView from "@/app/components/RecordSiteView";
import { pageMetadata, SITE_URL } from "@/app/lib/seo";
import DigitalMenuLandingClient from "./DigitalMenuLandingClient";

export const metadata: Metadata = pageMetadata({
  title: "منوی آنلاین رستوران و کافی‌شاپ | وبینو منو",
  description:
    "منوی دیجیتال وبینو: QR میز، چند تم زنده، سفارش روی گوشی و پرداخت آنلاین. سه پلن ۱۱، ۱۶ و ۲۹ میلیون — نسخه ۲۱ با پنل فروش و باشگاه هوشمند.",
  path: "/landing/menu",
  keywords: [
    "منو آنلاین",
    "منوی دیجیتال رستوران",
    "منو کافی شاپ",
    "سفارش با QR",
    "وبینو منو",
  ],
});

export default function DigitalMenuLandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "وبینو منو",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android, iOS",
    url: `${SITE_URL}/landing/menu`,
    description:
      "منوی آنلاین رستوران و کافی‌شاپ با QR، تم‌های متنوع، سفارش و پرداخت آنلاین متصل به پنل فروش وبینو.",
    offers: [
      { "@type": "Offer", name: "پایه", price: "11000000", priceCurrency: "IRR" },
      { "@type": "Offer", name: "فروش کامل", price: "16000000", priceCurrency: "IRR" },
      { "@type": "Offer", name: "نسخه ۲۱", price: "29000000", priceCurrency: "IRR" },
    ],
    featureList: [
      "اسکن QR میز",
      "چندین تم منو",
      "سفارش روی گوشی",
      "پیجر گارسون",
      "پرداخت آنلاین",
      "پنل فروش و باشگاه هوشمند در نسخه ۲۱",
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <RecordSiteView page="digital_menu" />
      <DigitalMenuLandingClient />
    </>
  );
}
