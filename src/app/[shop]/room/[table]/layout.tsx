import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سفارش اتاق",
  description: "منوی دیجیتال و درخواست خدمات از اتاق",
  robots: { index: false, follow: false },
};

export default function RoomReservLayout({ children }: { children: React.ReactNode }) {
  return children;
}
