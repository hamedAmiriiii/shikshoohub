import type { Metadata } from "next";
import LandingHubClient from "./landing/LandingHubClient";
import StandaloneAdminRedirect from "./components/StandaloneAdminRedirect";

export const metadata: Metadata = {
  title: "وبینو | حسابداری، تعویض روغن، طلا، نوبت‌دهی و فروشگاه آنلاین",
  description:
    "مجموعه نرم‌افزارهای وبینو: حسابداری و فروش، تعویض روغن، باشگاه مشتریان، خرید و فروش طلا، نوبت‌دهی، کلاس آنلاین، شبکه اجتماعی و فروشگاه آنلاین. یک هفته تست رایگان.",
  openGraph: {
    title: "وبینو — مجموعه نرم‌افزارهای کسب‌وکار",
    description:
      "حسابداری، تعویض روغن، باشگاه مشتریان، طلا، نوبت‌دهی، کلاس آنلاین، شبکه اجتماعی و فروشگاه آنلاین. تست رایگان یک هفته‌ای.",
    locale: "fa_IR",
    type: "website",
  },
};

/** لندینگ وبینو روی آدرس اصلی سایت — پنل فروش از /admin */
export default function HomePage() {
  return (
    <>
      <StandaloneAdminRedirect />
      <LandingHubClient />
    </>
  );
}
