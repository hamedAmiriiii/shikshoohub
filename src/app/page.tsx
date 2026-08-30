import type { Metadata } from "next";
import LandingShopClient from "./landing/shop/LandingShopClient";
import StandaloneAdminRedirect from "./components/StandaloneAdminRedirect";

export const metadata: Metadata = {
  title: "وبینو | نرم‌افزار حسابداری فروشگاهی",
  description:
    "مدیریت فروش، انبار، اقساط و مشتریان در یک نرم‌افزار تحت وب. نصب روی موبایل و ویندوز، ۳۰ روز تست رایگان.",
  openGraph: {
    title: "وبینو — حسابداری فروشگاهی",
    description: "ثبت فروش سریع، گزارش سود، انبار و اقساط. تست رایگان ۳۰ روزه.",
    locale: "fa_IR",
    type: "website",
  },
};

/** لندینگ وبینو روی آدرس اصلی سایت — پنل فروش از /admin */
export default function HomePage() {
  return (
    <>
      <StandaloneAdminRedirect />
      <LandingShopClient />
    </>
  );
}
