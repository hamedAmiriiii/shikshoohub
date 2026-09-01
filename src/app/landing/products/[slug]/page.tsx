import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import ProductLanding from "../ProductLanding";
import { getLandingProduct, LANDING_PRODUCTS, TRIAL_SHORT } from "../../catalog";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return LANDING_PRODUCTS.filter((p) => p.slug !== "accounting").map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  if (params.slug === "accounting") {
    return { title: "وبینو | حسابداری و فروش" };
  }
  const product = getLandingProduct(params.slug);
  if (!product) return { title: "وبینو" };
  return {
    title: `وبینو | ${product.title}`,
    description: `${product.lead} ${TRIAL_SHORT} تست رایگان.`,
  };
}

export default function ProductPage({ params }: Props) {
  if (params.slug === "accounting") {
    redirect("/landing/shop");
  }
  const product = getLandingProduct(params.slug);
  if (!product) notFound();
  return <ProductLanding product={product} />;
}
