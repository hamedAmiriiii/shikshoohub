import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "پنل تعمیرکاران",
  description: "ثبت‌نام، ورود و مدیریت کارهای تعمیرکاران",
  manifest: "/manifest-repair-tech.json",
  applicationName: "پنل تعمیرکاران",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "پنل تعمیرکاران",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function TechAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
