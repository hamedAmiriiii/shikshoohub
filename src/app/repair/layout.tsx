import { Metadata } from "next";
import RepairApp from "./RepairApp";
import { NOINDEX_ROBOTS } from "../lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "درخواست تعمیرکار",
  description: "ثبت درخواست تعمیرکار، پیگیری و پرداخت آنلاین",
  robots: NOINDEX_ROBOTS,
  applicationName: "تعمیرکار",
};

export default function RepairLayout({ children }: { children: React.ReactNode }) {
  return <RepairApp>{children}</RepairApp>;
}
