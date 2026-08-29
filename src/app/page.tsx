import type { Metadata } from "next";
import LandingShopClient from "./landing/shop/LandingShopClient";

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

/** لندینگ وبینو روی آدرس اصلی سایت — همان صفحه /landing */
export default function HomePage() {
  return <LandingShopClient />;
}
