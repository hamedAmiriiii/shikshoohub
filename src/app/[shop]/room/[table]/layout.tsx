import type { Metadata } from "next";
import { NOINDEX_ROBOTS } from "../../../lib/seo";

export const metadata: Metadata = {
  title: "سفارش اتاق",
  description: "منوی دیجیتال و درخواست خدمات از اتاق",
  robots: NOINDEX_ROBOTS,
};

export default function RoomReservLayout({ children }: { children: React.ReactNode }) {
  return children;
}
