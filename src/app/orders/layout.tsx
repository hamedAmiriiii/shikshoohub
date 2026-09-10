import type { Metadata } from "next";
import { NOINDEX_ROBOTS } from "../lib/seo";

export const metadata: Metadata = {
  title: "سفارش‌ها",
  robots: NOINDEX_ROBOTS,
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
