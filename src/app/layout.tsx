
import localFont from "next/font/local";
import { LanguageProvider } from "./coponent/Translate/LanguageProvider";
import "./globals.css";
import { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import {  QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./lib/queryClient";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import PWAHead from "./components/PWAHead";
import AppShell from "./AppShell";
import { LEGACY_BROWSER_BOOTSTRAP } from "./legacyBrowserBootstrap";
import {
  APP_ICONS,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  NOINDEX_ROBOTS,
  SITE_NAME,
  SITE_NAME_EN,
  SITE_URL,
  isNoIndexPath,
} from "./lib/seo";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export function generateMetadata(): Metadata {
  const pathname = headers().get("x-pathname") || "";
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isOil = pathname === "/oil" || pathname.startsWith("/oil/");
  const isOilPublic =
    pathname === "/oilservice" || pathname.startsWith("/oilservice/");
  const oilChrome = isOil || isOilPublic;
  const hideFromSearch = isNoIndexPath(pathname);

  if (isAdmin) {
    return {
      metadataBase: new URL(SITE_URL),
      title: SITE_NAME_EN,
      description: "سیستم مدیریت فروشگاه",
      robots: NOINDEX_ROBOTS,
      manifest: "/manifest-admin.json",
      applicationName: SITE_NAME_EN,
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: SITE_NAME_EN,
      },
      icons: APP_ICONS,
    };
  }

  if (oilChrome) {
    return {
      metadataBase: new URL(SITE_URL),
      title: isOilPublic ? "سوابق تعویض روغن" : "تعویض روغن",
      description: isOilPublic
        ? "مشاهده پلاک، کیلومتر و روغن بدون ورود"
        : "اپ تعویض روغن وبینو",
      robots: NOINDEX_ROBOTS,
      manifest: isOil ? "/manifest-oil.json" : "/manifest.json",
      applicationName: "تعویض روغن",
      appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "تعویض روغن",
      },
      icons: APP_ICONS,
    };
  }

  return {
    metadataBase: new URL(SITE_URL),
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    applicationName: SITE_NAME,
    robots: hideFromSearch ? NOINDEX_ROBOTS : undefined,
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: SITE_NAME,
    },
    icons: APP_ICONS,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1f9ad1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: LEGACY_BROWSER_BOOTSTRAP }} />
        <PWAHead />
        <QueryClientProvider client={queryClient}>
        {/* <AuthProvider > */}
        <LanguageProvider>
          <AppShell>{children}</AppShell>
          <ServiceWorkerRegistration />
        </LanguageProvider>
          </QueryClientProvider>
        {/* </AuthProvider> */}
        
      </body>
    </html>
  );
}
