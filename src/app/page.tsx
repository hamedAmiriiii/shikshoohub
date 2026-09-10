import type { Metadata } from "next";
import JsonLd from "./components/JsonLd";
import LandingHubClient from "./landing/LandingHubClient";
import { LANDING_FAQS, LANDING_PRODUCTS } from "./landing/catalog";
import StandaloneAdminRedirect from "./components/StandaloneAdminRedirect";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  ORGANIZATION,
  SITE_URL,
  pageMetadata,
} from "./lib/seo";

export const metadata: Metadata = pageMetadata({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: "/",
});

const homeJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORGANIZATION.name,
    legalName: ORGANIZATION.legalName,
    url: ORGANIZATION.url,
    email: ORGANIZATION.email,
    telephone: ORGANIZATION.telephone,
    address: {
      "@type": "PostalAddress",
      streetAddress: ORGANIZATION.address,
      addressCountry: "IR",
    },
    sameAs: [...ORGANIZATION.sameAs],
    logo: `${SITE_URL}/icon-512.png`,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORGANIZATION.name,
    url: SITE_URL,
    inLanguage: "fa-IR",
    publisher: { "@type": "Organization", name: ORGANIZATION.name },
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: ORGANIZATION.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android, iOS, Windows",
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "IRR",
      description: "یک هفته تست رایگان",
    },
    featureList: LANDING_PRODUCTS.map((p) => p.title),
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: LANDING_FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  },
];

/** لندینگ وبینو روی آدرس اصلی سایت — پنل فروش از /admin */
export default function HomePage() {
  return (
    <>
      <JsonLd data={homeJsonLd} />
      <StandaloneAdminRedirect />
      <LandingHubClient />
    </>
  );
}
