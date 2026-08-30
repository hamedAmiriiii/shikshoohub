
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

  return {
    title: "Webino",
    description: "سیستم مدیریت فروشگاه",
    manifest: isAdmin ? "/manifest-admin.json" : "/manifest.json",
    applicationName: "Webino",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: isAdmin ? "Webino" : "وبینو",
    },
    icons: {
      icon: [
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    },
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
