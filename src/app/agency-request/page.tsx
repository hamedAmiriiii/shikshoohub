import type { Metadata } from "next";
import AgencyRequestClient from "./AgencyRequestClient";
import { pageMetadata } from "../lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "درخواست نمایندگی وبینو | همکاری فروش نرم‌افزار",
  description:
    "فرم درخواست نمایندگی نرم‌افزار وبینو. با فروش حسابداری فروشگاهی، تعویض روغن و سایر محصولات وبینو در شهر خود همکاری کنید.",
  path: "/agency-request",
  keywords: ["نمایندگی وبینو", "همکاری در فروش نرم افزار", "نمایندگی نرم افزار حسابداری"],
});

export default function AgencyRequestPage() {
  return <AgencyRequestClient />;
}
