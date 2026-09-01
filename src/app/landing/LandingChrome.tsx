"use client";

import { useState } from "react";
import Link from "next/link";
import { Headphones, Menu, Phone, X } from "lucide-react";
import WebinoChatbot from "@/app/coponent/WebinoChatbot";
import {
  AGENCY_REQUEST_URL,
  ENAMAD_HTML,
  LANDING_PRODUCTS,
  LINK_BALE,
  LINK_RUBIKA,
  LOGIN_URL,
  REGISTER_URL,
  SUPPORT_PHONE,
  SUPPORT_TEL,
  TRIAL_CTA,
} from "./catalog";

type Props = {
  children: React.ReactNode;
  registerUrl?: string;
  loginUrl?: string;
  loginLabel?: string;
  onStartFree?: () => void;
  stickyCta?: boolean;
};

export default function LandingChrome({
  children,
  registerUrl = REGISTER_URL,
  loginUrl = LOGIN_URL,
  loginLabel = "ورود",
  onStartFree,
  stickyCta = true,
}: Props) {
  const [navOpen, setNavOpen] = useState(false);

  const goRegister = () => {
    if (onStartFree) onStartFree();
    else window.location.href = registerUrl;
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#0b0f1a] text-slate-100 antialiased">
      <header className="sticky top-0 z-50 bg-[#0b0f1a]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-bold text-xl bg-gradient-to-l from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent"
          >
            وبینو
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <Link href="/#products" className="hover:text-cyan-400 transition">
              محصولات
            </Link>
            <Link href="/landing/shop" className="hover:text-cyan-400 transition">
              حسابداری
            </Link>
            <Link href="/#faq" className="hover:text-cyan-400 transition">
              سوالات
            </Link>
            <Link
              href={AGENCY_REQUEST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition"
            >
              نمایندگی
            </Link>
            <Link href={loginUrl} className="hover:text-cyan-400 transition">
              {loginLabel}
            </Link>
            <Link
              href={registerUrl}
              className="bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white px-5 py-2 rounded-xl hover:opacity-90 transition font-medium shadow-lg shadow-fuchsia-900/30"
            >
              شروع رایگان
            </Link>
          </nav>
          <button
            type="button"
            className="md:hidden p-2 text-slate-300"
            onClick={() => setNavOpen(!navOpen)}
            aria-label="منو"
          >
            {navOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {navOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0b0f1a] px-4 py-3 flex flex-col gap-2 text-sm text-slate-300">
            <Link href="/#products" onClick={() => setNavOpen(false)}>
              محصولات
            </Link>
            <Link href="/landing/shop" onClick={() => setNavOpen(false)}>
              حسابداری
            </Link>
            <Link href="/#faq" onClick={() => setNavOpen(false)}>
              سوالات
            </Link>
            <Link href={loginUrl} onClick={() => setNavOpen(false)}>
              {loginLabel}
            </Link>
            <Link href={registerUrl} className="text-fuchsia-400 font-semibold" onClick={() => setNavOpen(false)}>
              شروع رایگان
            </Link>
          </div>
        )}
      </header>

      {children}

      <section className="py-16 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Headphones className="mx-auto text-cyan-400 mb-4" size={40} />
          <h2 className="text-2xl font-bold text-white">در تمام مراحل راه‌اندازی کنار شما هستیم</h2>
          <p className="text-slate-400 mt-2 mb-8">پشتیبانی آنلاین — پاسخگویی سریع</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={SUPPORT_TEL}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:border-cyan-500/50 transition text-slate-200"
            >
              <Phone size={18} className="text-cyan-400" />
              <span dir="ltr">{SUPPORT_PHONE}</span>
            </a>
            <a
              href={LINK_BALE}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:border-fuchsia-500/50 transition text-sm text-slate-200"
            >
              بله
            </a>
            <a
              href={LINK_RUBIKA}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:border-fuchsia-500/50 transition text-sm text-slate-200"
            >
              روبیکا
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-[#070a12] text-slate-500 py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-8 text-sm">
          <div>
            <div className="text-white font-bold text-lg mb-2">وبینو</div>
            <p>مجموعه نرم‌افزارهای کسب‌وکار تحت وب</p>
          </div>
          <div>
            <div className="text-white font-medium mb-3">محصولات</div>
            <ul className="space-y-2">
              {LANDING_PRODUCTS.map((p) => (
                <li key={p.slug}>
                  <Link href={p.href} className="hover:text-cyan-400">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-white font-medium mb-3">دسترسی سریع</div>
            <ul className="space-y-2">
              <li>
                <Link href={registerUrl} className="hover:text-cyan-400">
                  ثبت‌نام رایگان
                </Link>
              </li>
              <li>
                <Link href={loginUrl} className="hover:text-cyan-400">
                  ورود
                </Link>
              </li>
              <li>
                <Link
                  href={AGENCY_REQUEST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400"
                >
                  درخواست نمایندگی
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-white font-medium mb-3">تماس</div>
            <a href={SUPPORT_TEL} className="hover:text-cyan-400" dir="ltr">
              {SUPPORT_PHONE}
            </a>
          </div>
          <div>
            <div className="text-white font-medium mb-3">نماد اعتماد الکترونیکی</div>
            <div className="inline-block bg-white rounded-lg p-2" dangerouslySetInnerHTML={{ __html: ENAMAD_HTML }} />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-8 pt-8 border-t border-white/5 text-center text-xs">
          © {new Date().getFullYear()} وبینو — تمامی حقوق محفوظ است
        </div>
      </footer>

      {stickyCta && (
        <>
          <div className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-[#0b0f1a]/95 backdrop-blur border-t border-white/10">
            <button
              type="button"
              onClick={goRegister}
              className="w-full py-3.5 rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white font-semibold shadow-lg"
            >
              {TRIAL_CTA}
            </button>
          </div>
          <div className="h-20 md:hidden" aria-hidden />
        </>
      )}
      <WebinoChatbot audience="landing" />
    </div>
  );
}
