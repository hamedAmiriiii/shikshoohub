
import localFont from "next/font/local";
import { LanguageProvider } from "./coponent/Translate/LanguageProvider";
import "./globals.css";
import { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "kerman-Photo",
  description: "سیستم مدیریت عکاسی",
  manifest: "/manifest.json",
  themeColor: "#1f9ad1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "kerman-Photo",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
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
