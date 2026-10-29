import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/app/lib/billiard/auth";
import { SiteHeader } from "@/app/billiard/components/SiteHeader";
import { SiteFooter } from "@/app/billiard/components/SiteFooter";
import { NOINDEX_ROBOTS } from "@/app/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_BILLIARD_BRAND_NAME || "هیأت بیلیارد",
  description: "سامانه مدیریت مسابقات بیلیارد هیأت",
  robots: NOINDEX_ROBOTS,
  applicationName: "هیأت بیلیارد",
};

export default function BilliardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="billiard-app" dir="rtl">
      <AuthProvider>
        <SiteHeader />
        <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8">{children}</main>
        <SiteFooter />
      </AuthProvider>
    </div>
  );
}
