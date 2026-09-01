import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "وبینو | نرم‌افزار حسابداری فروشگاهی",
  description:
    "مدیریت فروش، انبار، اقساط و مشتریان در یک نرم‌افزار تحت وب. نصب روی موبایل و ویندوز، یک هفته تست رایگان.",
  openGraph: {
    title: "وبینو — حسابداری فروشگاهی",
    description: "ثبت فروش سریع، گزارش سود، انبار و اقساط. تست رایگان یک هفته‌ای.",
    locale: "fa_IR",
    type: "website",
  },
};

export default function ShopLandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
