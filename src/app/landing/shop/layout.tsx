import type { Metadata } from "next";
import JsonLd from "../../components/JsonLd";
import { pageMetadata, SITE_URL } from "../../lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "نرم‌افزار حسابداری فروشگاهی وبینو | صندوق، انبار، اقساط و گزارش سود",
  description:
    "نرم‌افزار حسابداری و فروش وبینو: ثبت فروش و بارکد، مدیریت انبار، اقساط و نسیه، باشگاه مشتریان و گزارش سود. نصب روی موبایل و ویندوز، یک هفته تست رایگان.",
  path: "/landing/shop",
  keywords: [
    "نرم افزار حسابداری فروشگاهی",
    "صندوق فروش",
    "نرم افزار انبار",
    "فاکتور فروش",
    "فروش اقساطی",
  ],
});

const shopJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "حسابداری و فروش وبینو",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Android, iOS, Windows",
  url: `${SITE_URL}/landing/shop`,
  description:
    "مدیریت کامل فروشگاه: فروش، انبار، اقساط، گزارش و چاپ. قابل نصب روی موبایل و ویندوز.",
  featureList: [
    "ثبت فروش و بارکد",
    "انبار و موجودی",
    "گزارش سود و زیان",
    "اقساط و نسیه",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IRR",
    description: "یک هفته تست رایگان",
  },
};

export default function ShopLandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={shopJsonLd} />
      {children}
    </>
  );
}
