import { Metadata, Viewport } from "next";
import RepairApp from "./RepairApp";
import { NOINDEX_ROBOTS } from "../lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "امید تعمیر | درخواست تعمیرکار",
  description: "ثبت درخواست تعمیرکار، پیگیری و پرداخت آنلاین",
  robots: NOINDEX_ROBOTS,
  applicationName: "امید تعمیر",
  manifest: "/manifest-repair.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "امید تعمیر",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RepairLayout({ children }: { children: React.ReactNode }) {
  return <RepairApp>{children}</RepairApp>;
}
