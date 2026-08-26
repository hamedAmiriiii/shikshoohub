import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سفارش آنلاین میز",
  description: "منوی دیجیتال رستوران — انتخاب غذا و ثبت سفارش از روی میز",
  robots: { index: false, follow: false },
};

export default function ReservTableLayout({ children }: { children: React.ReactNode }) {
  return children;
}
