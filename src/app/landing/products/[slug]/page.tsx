import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/app/components/JsonLd";
import { pageMetadata, SITE_URL } from "@/app/lib/seo";
import ProductLanding from "../ProductLanding";
import { getLandingProduct, LANDING_PRODUCTS, TRIAL_SHORT } from "../../catalog";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return [
    ...LANDING_PRODUCTS.filter((p) => p.slug !== "accounting").map((p) => ({ slug: p.slug })),
    { slug: "class" },
  ];
}

export function generateMetadata({ params }: Props): Metadata {
  if (params.slug === "accounting") {
    return pageMetadata({
      title: "نرم‌افزار حسابداری و فروش وبینو",
      description:
        "مدیریت کامل فروشگاه: فروش، انبار، اقساط، گزارش و چاپ. قابل نصب روی موبایل و ویندوز.",
      path: "/landing/shop",
    });
  }
  if (params.slug === "class") {
    return pageMetadata({
      title: "یادینو | کلاس آنلاین وبینو",
      description:
        "یادینو برای آموزش آنلاین: چند کلاس و جلسه همزمان، پیام‌رسان اختصاصی، اشتراک تصویر و تخته.",
      path: "/landing/products/yadino",
    });
  }
  const product = getLandingProduct(params.slug);
  if (!product) {
    return pageMetadata({
      title: "وبینو",
      description: "مجموعه نرم‌افزارهای کسب‌وکار وبینو",
      path: "/",
    });
  }
  const trial = product.hasTrial === false ? "" : ` ${TRIAL_SHORT} تست رایگان.`;
  return pageMetadata({
    title: `نرم‌افزار ${product.title} وبینو`,
    description: `${product.lead}${trial}`,
    path: product.href,
    keywords: [product.title, ...product.items],
  });
}

export default function ProductPage({ params }: Props) {
  if (params.slug === "accounting") {
    redirect("/landing/shop");
  }
  if (params.slug === "class") {
    redirect("/landing/products/yadino");
  }
  const product = getLandingProduct(params.slug);
  if (!product) notFound();

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${product.title} وبینو`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android, iOS, Windows",
    url: `${SITE_URL}${product.href}`,
    description: product.lead,
    featureList: product.items,
  };
  if (product.hasTrial !== false) {
    jsonLd.offers = {
      "@type": "Offer",
      price: "0",
      priceCurrency: "IRR",
      description: `${TRIAL_SHORT} تست رایگان`,
    };
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <ProductLanding product={product} />
    </>
  );
}
