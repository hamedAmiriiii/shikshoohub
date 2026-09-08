import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
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
    return { title: "وبینو | حسابداری و فروش" };
  }
  if (params.slug === "class") {
    return { title: "وبینو | یادینو" };
  }
  const product = getLandingProduct(params.slug);
  if (!product) return { title: "وبینو" };
  const trial = product.hasTrial === false ? "" : ` ${TRIAL_SHORT} تست رایگان.`;
  return {
    title: `وبینو | ${product.title}`,
    description: `${product.lead}${trial}`,
  };
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
  return <ProductLanding product={product} />;
}
