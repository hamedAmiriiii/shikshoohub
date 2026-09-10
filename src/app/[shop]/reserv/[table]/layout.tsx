import type { Metadata } from "next";
import { NOINDEX_ROBOTS } from "../../../lib/seo";

export const metadata: Metadata = {
  title: "سفارش آنلاین میز",
  description: "منوی دیجیتال رستوران — انتخاب غذا و ثبت سفارش از روی میز",
  robots: NOINDEX_ROBOTS,
};

export default function ReservTableLayout({ children }: { children: React.ReactNode }) {
  return children;
}
