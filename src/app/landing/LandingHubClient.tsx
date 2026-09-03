"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Calculator,
  CalendarClock,
  CheckCircle2,
  Coins,
  Droplets,
  Gift,
  Headphones,
  Puzzle,
  Share2,
  Smartphone,
  Sparkles,
  Store,
  Video,
  Zap,
} from "lucide-react";
import LandingChrome from "./LandingChrome";
import {
  LANDING_PRODUCTS,
  REGISTER_URL,
  TRIAL_BADGE,
  TRIAL_CTA,
  TRIAL_SHORT,
  type ProductIconName,
} from "./catalog";

const ICONS: Record<ProductIconName, LucideIcon> = {
  calculator: Calculator,
  droplets: Droplets,
  gift: Gift,
  coins: Coins,
  calendar: CalendarClock,
  video: Video,
  share: Share2,
  store: Store,
};

const BENEFITS = [
  { icon: Puzzle, title: "چند محصول، یک اکوسیستم", desc: "فروش، تعویض روغن، طلا، نوبت و آموزش کنار هم", color: "from-violet-500 to-fuchsia-500" },
  { icon: Smartphone, title: "موبایل و ویندوز", desc: "نصب مثل اپ، بدون نصب پیچیده ویندوز", color: "from-cyan-500 to-blue-500" },
  { icon: Zap, title: "شروع در چند دقیقه", desc: "ثبت‌نام، انتخاب محصول و شروع کار", color: "from-amber-500 to-orange-500" },
  { icon: Headphones, title: "پشتیبانی راه‌اندازی", desc: "در تمام مراحل کنار شما هستیم", color: "from-emerald-500 to-teal-500" },
];

const STEPS = [
  { n: "۱", title: "ثبت‌نام رایگان", desc: "شماره موبایل و نام کسب‌وکار" },
  { n: "۲", title: "انتخاب محصول", desc: "فروش، تعویض روغن، طلا، نوبت یا فروشگاه" },
  { n: "۳", title: "شروع کار", desc: "پنل آماده است — پشتیبانی همراهتان" },
];

const FAQS = [
  {
    q: "وبینو چند محصول دارد؟",
    a: "هشت محصول: حسابداری و فروش، تعویض روغن، باشگاه مشتریان، خرید و فروش طلا، نوبت‌دهی، کلاس آنلاین و اتاق جلسه، شبکه اجتماعی و فروشگاه آنلاین.",
  },
  {
    q: "آیا روی موبایل نصب می‌شود؟",
    a: "بله. نرم‌افزار PWA است و روی اندروید، iOS و ویندوز از مرورگر قابل نصب و اجرا مانند اپلیکیشن است.",
  },
  {
    q: "کدام محصول را انتخاب کنم؟",
    a: "اگر فروشگاه دارید از حسابداری و فروش شروع کنید. تعویض روغنی، طلافروشی، نوبت‌دهی، آموزش آنلاین و فروش اینترنتی هم صفحه جدا دارند.",
  },
  {
    q: "آیا نسخه آزمایشی رایگان دارد؟",
    a: `${TRIAL_SHORT} استفاده رایگان به‌همراه ۲۰ پیامک هدیه برای شروع.`,
  },
];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.45, delay },
  };
}

export default function LandingHubClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");

  const startFree = () => {
    if (typeof window !== "undefined") {
      if (phone.trim()) sessionStorage.setItem("landing_register_phone", phone.trim());
      if (shopName.trim()) sessionStorage.setItem("landing_register_shop", shopName.trim());
    }
    window.location.href = REGISTER_URL;
  };

  return (
    <LandingChrome onStartFree={startFree}>
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.25),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(6,182,212,0.15),_transparent_45%)]" />
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center relative">
          <motion.div {...fadeUp(0)} className="text-center lg:text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs font-medium mb-4">
              <Sparkles size={14} /> {TRIAL_BADGE}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-[1.8rem] font-bold leading-tight">
              <span className="bg-gradient-to-l from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                مجموعه نرم‌افزارهای وبینو
              </span>
            </h1>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold leading-tight mt-2">
              <span className="bg-gradient-to-l from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                برای فروش، خدمات و آموزش
              </span>
            </h2>
            <p className="mt-4 text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              حسابداری و فروش، تعویض روغن، باشگاه مشتریان، طلا، نوبت‌دهی، کلاس آنلاین، شبکه اجتماعی و فروشگاه آنلاین —
              قابل نصب روی موبایل و ویندوز.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start">
              <button
                type="button"
                onClick={startFree}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-l from-violet-600 via-fuchsia-600 to-pink-600 text-white font-semibold hover:opacity-90 transition shadow-xl shadow-fuchsia-900/40"
              >
                {TRIAL_CTA}
              </button>
              <a
                href="#products"
                className="px-8 py-3.5 rounded-xl border border-white/15 bg-white/5 text-slate-200 font-medium hover:bg-white/10 transition text-center"
              >
                مشاهده محصولات
              </a>
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {LANDING_PRODUCTS.map((p) => {
              const Icon = ICONS[p.icon];
              return (
                <Link
                  key={p.slug}
                  href={p.href}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center hover:border-cyan-400/40 hover:bg-white/[0.07] transition"
                >
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${p.color} text-white flex items-center justify-center`}>
                    <Icon size={18} />
                  </div>
                  <div className="text-xs font-semibold text-slate-200 leading-snug">{p.title}</div>
                </Link>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section id="products" className="py-16 md:py-24 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">محصولات وبینو</h2>
            <p className="text-slate-400 mt-2">هر محصول صفحه، ورود و دموی جدا دارد</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {LANDING_PRODUCTS.map((p, i) => {
              const Icon = ICONS[p.icon];
              return (
                <motion.article
                  key={p.slug}
                  {...fadeUp(i * 0.04)}
                  className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] transition flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${p.color} text-white flex items-center justify-center shadow-lg`}>
                      <Icon size={22} />
                    </div>
                    {p.tag ? (
                      <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full">
                        {p.tag}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="font-bold text-white text-lg">{p.title}</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed flex-1">{p.desc}</p>
                  <ul className="mt-4 space-y-1.5">
                    {p.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 size={13} className="text-cyan-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={p.href} className="text-sm font-semibold text-cyan-400 hover:text-cyan-300">
                      صفحه محصول
                    </Link>
                    <Link href={p.loginUrl} className="text-sm text-slate-400 hover:text-white">
                      {p.loginLabel}
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2 {...fadeUp()} className="text-2xl md:text-3xl font-bold text-center mb-10">
            چرا کسب‌وکارها <span className="text-cyan-400">وبینو</span> را انتخاب می‌کنند؟
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                {...fadeUp(i * 0.05)}
                className="p-6 rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${b.color} text-white flex items-center justify-center mb-4`}>
                  <b.icon size={22} />
                </div>
                <h3 className="font-bold text-white">{b.title}</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="steps" className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <motion.h2 {...fadeUp()} className="text-2xl md:text-3xl font-bold mb-12">
            در ۳ مرحله شروع کنید
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} {...fadeUp(i * 0.08)}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-600 text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {s.n}
                </div>
                <h3 className="font-bold text-lg text-white">{s.title}</h3>
                <p className="text-slate-400 text-sm mt-2">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            {...fadeUp()}
            className="rounded-3xl bg-gradient-to-br from-violet-700 via-fuchsia-700 to-cyan-700 text-white p-8 md:p-12 text-center relative overflow-hidden"
          >
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold">پیشنهاد ویژه شروع</h2>
              <ul className="mt-6 space-y-2 text-violet-100">
                <li>{TRIAL_SHORT} استفاده رایگان</li>
                <li>۲۰ پیامک هدیه</li>
                <li>پشتیبانی رایگان راه‌اندازی</li>
              </ul>
              <button
                type="button"
                onClick={startFree}
                className="mt-8 px-10 py-4 rounded-xl bg-white text-violet-800 font-bold hover:bg-violet-50 transition"
              >
                همین حالا رایگان شروع کن
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="signup" className="py-16 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-xl font-bold text-center mb-6 text-white">ثبت‌نام سریع</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="نام کسب‌وکار / فروشگاه"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-fuchsia-500 outline-none"
            />
            <input
              type="tel"
              placeholder="شماره موبایل (۰۹...)"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              dir="ltr"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-fuchsia-500 outline-none text-left"
            />
            <button
              type="button"
              onClick={startFree}
              className="w-full py-3.5 rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white font-semibold"
            >
              {TRIAL_CTA}
            </button>
          </div>
        </div>
      </section>

      <section id="faq" className="py-16 md:py-20 scroll-mt-20">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">سوالات متداول</h2>
          <div className="space-y-2">
            {FAQS.map((item, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-4 text-right font-medium text-slate-200"
                >
                  {item.q}
                  <span className={`text-slate-400 transition ${openFaq === i ? "rotate-180" : ""}`}>▼</span>
                </button>
                {openFaq === i && (
                  <p className="px-4 pb-4 text-sm text-slate-400 leading-relaxed border-t border-white/5">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </LandingChrome>
  );
}
