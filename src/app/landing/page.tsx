import type { Metadata } from "next";
import { pageMetadata } from "../lib/seo";
import LandingHubClient from "./LandingHubClient";

export const metadata: Metadata = pageMetadata({
  title: "محصولات وبینو | حسابداری، تعویض روغن، طلا و فروشگاه آنلاین",
  description:
    "مجموعه محصولات وبینو برای کسب‌وکار: حسابداری فروشگاهی، تعویض روغن، باشگاه مشتریان، طلا، نوبت‌دهی، یادینو، شبکه اجتماعی و فروشگاه آنلاین.",
  path: "/",
});

/** لندینگ اصلی وبینو — مجموعه محصولات */
export default function LandingPage() {
  return <LandingHubClient />;
}
