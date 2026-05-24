"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  Package,
  Users,
  TrendingUp,
  Smartphone,
  CreditCard,
  Printer,
  MessageSquare,
  Gift,
  Receipt,
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Phone,
  Headphones,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";

const REGISTER_URL = "/admin/register-shop";
const LOGIN_URL = "/admin/login";
const SUPPORT_PHONE = "09399166196";
const SUPPORT_TEL = "tel:09399166196";
const LINK_BALE = "https://ble.ir/AmiriWebino";
const LINK_RUBIKA = "https://rubika.ir/WebinoPlus";

const BENEFITS = [
  { icon: Zap, title: "ثبت فروش سریع", desc: "ثبت فاکتور و فروش در چند ثانیه" },
  { icon: Package, title: "مدیریت انبار", desc: "مشاهده موجودی و کنترل قیمت خرید و فروش" },
  { icon: Users, title: "مدیریت اقساط و مشتریان", desc: "ثبت بدهی، اقساط و سوابق خرید مشتری" },
  { icon: TrendingUp, title: "گزارش سود و فروش", desc: "مشاهده فروش و سود روزانه و ماهانه" },
];

const FEATURES = [
  { icon: Smartphone, label: "نصب روی ویندوز و موبایل (PWA)" },
  { icon: CreditCard, label: "اتصال به کارتخوان" },
  { icon: Printer, label: "چاپ لیبل کالا" },
  { icon: Users, label: "مدیریت مشتریان" },
  { icon: MessageSquare, label: "ارسال پیامک" },
  { icon: Gift, label: "باشگاه مشتریان" },
  { icon: Receipt, label: "مدیریت هزینه‌ها" },
  { icon: BarChart3, label: "گزارش فروش" },
  { icon: ClipboardList, label: "انبارگردانی" },
  { icon: FileText, label: "چاپ فاکتور" },
  { icon: CreditCard, label: "فروش اقساطی" },
  { icon: LayoutDashboard, label: "داشبورد مدیریتی" },
];

const STEPS = [
  { n: "۱", title: "ثبت‌نام رایگان", desc: "شماره موبایل و نام فروشگاه" },
  { n: "۲", title: "ثبت کالا و اولین فروش", desc: "بارکد، قیمت و موجودی" },
  { n: "۳", title: "مدیریت فروشگاه", desc: "سود، فروش و گزارش‌ها" },
];

const SCREENSHOTS = [
  {
    title: "صفحه فروش",
    desc: "ثبت سریع فاکتور و سبد خرید",
    gradient: "from-blue-500/20 to-indigo-500/10",
    content: (
      <div className="space-y-2 p-3">
        <div className="flex justify-between text-xs text-slate-600">
          <span>فروش امروز</span>
          <span className="font-bold text-blue-600">۱۲,۴۵۰,۰۰۰</span>
        </div>
        <div className="h-20 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 text-xs">
          سبد فروش + بارکدخوان
        </div>
      </div>
    ),
  },
  {
    title: "صفحه انبار",
    desc: "لیست کالا و موجودی",
    gradient: "from-blue-500/15 to-indigo-500/10",
    content: (
      <div className="space-y-1.5 p-3">
        {["پیراهن مردانه", "کفش ورزشی", "کیف چرم"].map((n, i) => (
          <div key={i} className="flex justify-between text-xs bg-white rounded-md px-2 py-1.5 border border-slate-100">
            <span className="text-slate-700">{n}</span>
            <span className="text-blue-600 font-medium">{[12, 5, 8][i]}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "گزارش سود",
    desc: "نمودار فروش روزانه",
    gradient: "from-violet-500/15 to-purple-500/10",
    content: (
      <div className="p-3 flex items-end gap-1 h-24">
        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-gradient-to-t from-blue-500/90 to-emerald-400/80"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    ),
  },
  {
    title: "مشتریان",
    desc: "سوابق خرید و اقساط",
    gradient: "from-amber-500/15 to-orange-500/10",
    content: (
      <div className="p-3 space-y-2">
        <div className="text-xs text-slate-500">اعتبار اقساطی</div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full w-2/3 bg-gradient-to-l from-blue-500 to-emerald-500 rounded-full" />
        </div>
        <div className="text-xs text-slate-600">۳ مشتری — ۲ قسط معوق</div>
      </div>
    ),
  },
  {
    title: "چاپ لیبل",
    desc: "بارکد و قیمت روی لیبل",
    gradient: "from-slate-500/10 to-slate-600/10",
    content: (
      <div className="p-4 flex flex-col items-center gap-2">
        <div className="w-full h-8 bg-slate-800 rounded" />
        <div className="text-[10px] text-slate-500 font-mono">||| 1507 |||</div>
        <div className="text-xs font-bold text-slate-700">۲۹۱,۰۰۰ تومان</div>
      </div>
    ),
  },
];

const FAQS = [
  {
    q: "آیا روی موبایل نصب می‌شود؟",
    a: "بله. نرم‌افزار PWA است و روی اندروید، iOS و ویندوز از مرورگر قابل نصب و اجرا مانند اپلیکیشن است.",
  },
  {
    q: "آیا نیاز به نصب ویندوز دارد؟",
    a: "خیر. فقط مرورگر کافی است؛ در ویندوز می‌توانید از منوی مرورگر گزینه نصب را بزنید.",
  },
  {
    q: "آیا به کارتخوان متصل می‌شود؟",
    a: "بله. امکان ثبت فروش با کارتخوان و تفکیک نقد/کارت در فاکتور وجود دارد.",
  },
  {
    q: "آیا امکان فروش اقساطی دارد؟",
    a: "بله. فروش اقساطی، مدیریت اقساط و اعتبار مشتری پشتیبانی می‌شود.",
  },
  {
    q: "آیا نسخه آزمایشی رایگان دارد؟",
    a: "۳۰ روز استفاده رایگان به‌همراه ۲۰ پیامک هدیه برای شروع.",
  },
  {
    q: "آیا اطلاعات فروشگاه امن است؟",
    a: "داده‌ها روی سرور امن ذخیره می‌شود و هر فروشگاه فقط به اطلاعات خود دسترسی دارد.",
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

export default function LandingShopClient() {
  const [navOpen, setNavOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");

  const nextSlide = useCallback(() => {
    setSlide((s) => (s + 1) % SCREENSHOTS.length);
  }, []);
  const prevSlide = useCallback(() => {
    setSlide((s) => (s - 1 + SCREENSHOTS.length) % SCREENSHOTS.length);
  }, []);

  const startFree = () => {
    if (typeof window !== "undefined") {
      if (phone.trim()) sessionStorage.setItem("landing_register_phone", phone.trim());
      if (shopName.trim()) sessionStorage.setItem("landing_register_shop", shopName.trim());
    }
    window.location.href = REGISTER_URL;
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/landing" className="font-bold text-xl text-blue-600">
            وبینو
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition">ویژگی‌ها</a>
            <a href="#steps" className="hover:text-blue-600 transition">شروع سریع</a>
            <a href="#screenshots" className="hover:text-blue-600 transition">دمو</a>
            <a href="#faq" className="hover:text-blue-600 transition">سوالات</a>
            <Link href={LOGIN_URL} className="hover:text-blue-600 transition">
              ورود
            </Link>
            <Link
              href={REGISTER_URL}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition font-medium shadow-sm shadow-blue-600/20"
            >
              شروع رایگان
            </Link>
          </nav>
          <button
            type="button"
            className="md:hidden p-2 text-slate-600"
            onClick={() => setNavOpen(!navOpen)}
            aria-label="منو"
          >
            {navOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {navOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-2 text-sm">
            <a href="#features" onClick={() => setNavOpen(false)}>ویژگی‌ها</a>
            <a href="#screenshots" onClick={() => setNavOpen(false)}>دمو</a>
            <a href="#faq" onClick={() => setNavOpen(false)}>سوالات</a>
            <Link href={LOGIN_URL}>ورود</Link>
            <Link href={REGISTER_URL} className="text-blue-600 font-semibold">
              شروع رایگان
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/50 to-slate-50 pt-12 pb-20 md:pt-16 md:pb-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-400/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[200px] bg-emerald-400/8 blur-3xl rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center relative">
          <motion.div {...fadeUp(0)} className="text-center lg:text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium mb-4 border border-blue-200/60">
              <CheckCircle2 size={14} /> ۳۰ روز تست رایگان — بدون نصب پیچیده
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.35rem] font-bold leading-tight text-slate-900">
              مدیریت کامل فروشگاه، فروش، انبار و اقساط در یک نرم‌افزار ساده
            </h1>
            <p className="mt-4 text-slate-600 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 lg:mr-0">
              نرم‌افزار حسابداری فروشگاهی تحت وب با قابلیت نصب روی موبایل و ویندوز، اتصال کارتخوان،
              مدیریت مشتریان، انبار و گزارش سود.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start">
              <button
                type="button"
                onClick={startFree}
                className="px-8 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-600/25"
              >
                شروع رایگان ۳۰ روزه
              </button>
              <a
                href="#screenshots"
                className="px-8 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:border-blue-300 hover:bg-blue-50/50 transition text-center"
              >
                مشاهده دمو
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 justify-center lg:justify-start text-sm text-slate-500">
              {["۲۰ پیامک رایگان", "پشتیبانی آنلاین", "نصب موبایل و ویندوز", "مناسب فروشگاه متوسط"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                    {t}
                  </li>
                ),
              )}
            </ul>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="relative">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-200/60 p-4 md:p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-800">داشبورد فروشگاه</span>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">آنلاین</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                  <div className="text-[10px] text-blue-700">فروش امروز</div>
                  <div className="text-lg font-bold text-blue-800 mt-1">۸,۲۴۰,۰۰۰</div>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                  <div className="text-[10px] text-emerald-700">سود امروز</div>
                  <div className="text-lg font-bold text-emerald-800 mt-1">۱,۹۵۰,۰۰۰</div>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-2 mb-3 space-y-1.5">
                <div className="text-[10px] text-slate-400 px-1">لیست کالا — ثبت فروش سریع</div>
                {[
                  { n: "کتانی نایک", p: "۱,۲۰۰,۰۰۰" },
                  { n: "شلوار جین", p: "۸۵۰,۰۰۰" },
                ].map((row) => (
                  <div
                    key={row.n}
                    className="flex justify-between text-xs bg-white rounded-lg px-2 py-1.5 border border-slate-100"
                  >
                    <span>{row.n}</span>
                    <span className="text-blue-600 font-medium">{row.p}</span>
                  </div>
                ))}
              </div>
              <div className="h-16 rounded-xl bg-gradient-to-l from-blue-500/15 via-emerald-500/10 to-transparent border border-blue-100 flex items-center justify-center text-xs text-slate-500">
                گزارش فروش ۱۰ روز اخیر
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2 {...fadeUp()} className="text-2xl md:text-3xl font-bold text-center mb-10">
            چرا فروشگاه‌داران وبینو را انتخاب می‌کنند؟
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                {...fadeUp(i * 0.05)}
                className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-blue-200 hover:shadow-md transition"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <b.icon size={22} />
                </div>
                <h3 className="font-bold text-slate-900">{b.title}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">ویژگی‌های مهم نرم‌افزار</h2>
            <p className="text-slate-600 mt-2 text-sm md:text-base">همه‌چیز برای فروشگاه، بدون شلوغی</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                {...fadeUp(i * 0.03)}
                className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-100 shadow-sm"
              >
                <f.icon size={20} className="text-blue-600 shrink-0" />
                <span className="text-sm font-medium text-slate-800">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section id="steps" className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <motion.h2 {...fadeUp()} className="text-2xl md:text-3xl font-bold mb-12">
            در ۳ مرحله شروع کنید
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} {...fadeUp(i * 0.08)} className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-emerald-600 text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {s.n}
                </div>
                <h3 className="font-bold text-lg">{s.title}</h3>
                <p className="text-slate-600 text-sm mt-2">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          <p className="mt-10 text-blue-700 font-semibold text-lg">
            در کمتر از ۵ دقیقه فروشگاهت را دیجیتال کن
          </p>
        </div>
      </section>

      {/* Screenshots carousel */}
      <section id="screenshots" className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2 {...fadeUp()} className="text-2xl md:text-3xl font-bold text-center mb-8">
            نمای نرم‌افزار
          </motion.h2>
          <div className="relative max-w-lg mx-auto">
            <div className={`rounded-2xl bg-gradient-to-br ${SCREENSHOTS[slide].gradient} border border-slate-200 p-1 shadow-xl`}>
              <div className="bg-white rounded-xl overflow-hidden min-h-[200px]">
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                  <span className="font-semibold text-sm">{SCREENSHOTS[slide].title}</span>
                  <span className="text-xs text-slate-400">{SCREENSHOTS[slide].desc}</span>
                </div>
                {SCREENSHOTS[slide].content}
              </div>
            </div>
            <button
              type="button"
              onClick={prevSlide}
              className="absolute right-full top-1/2 -translate-y-1/2 mr-2 md:mr-4 w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center hover:bg-blue-50"
              aria-label="قبلی"
            >
              <ChevronRight size={20} />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute left-full top-1/2 -translate-y-1/2 ml-2 md:ml-4 w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center hover:bg-blue-50"
              aria-label="بعدی"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex justify-center gap-2 mt-4">
              {SCREENSHOTS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  className={`w-2 h-2 rounded-full transition ${i === slide ? "bg-blue-600 w-6" : "bg-slate-300"}`}
                  aria-label={`اسلاید ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Offer */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            {...fadeUp()}
            className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 text-white p-8 md:p-12 text-center shadow-xl shadow-blue-900/20"
          >
            <h2 className="text-2xl md:text-3xl font-bold">پیشنهاد ویژه شروع</h2>
            <ul className="mt-6 space-y-2 text-blue-50 text-base md:text-lg">
              <li>۳۰ روز استفاده رایگان</li>
              <li>۲۰ پیامک هدیه</li>
              <li>پشتیبانی رایگان راه‌اندازی</li>
            </ul>
            <button
              type="button"
              onClick={startFree}
              className="mt-8 px-10 py-4 rounded-xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition shadow-lg"
            >
              همین حالا رایگان شروع کن
            </button>
          </motion.div>
        </div>
      </section>

      {/* Short signup */}
      <section id="signup" className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-xl font-bold text-center mb-6">ثبت‌نام سریع</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="نام فروشگاه"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
            <input
              type="tel"
              placeholder="شماره موبایل (۰۹...)"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              dir="ltr"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-left"
            />
            <button
              type="button"
              onClick={startFree}
              className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              شروع رایگان ۳۰ روزه
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">سوالات متداول</h2>
          <div className="space-y-2">
            {FAQS.map((item, i) => (
              <div key={i} className="rounded-xl bg-white border border-slate-100 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-4 text-right font-medium text-slate-800 hover:bg-slate-50"
                >
                  {item.q}
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <p className="px-4 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-50">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Headphones className="mx-auto text-blue-600 mb-4" size={40} />
          <h2 className="text-2xl font-bold">در تمام مراحل راه‌اندازی کنار شما هستیم</h2>
          <p className="text-slate-600 mt-2 mb-8">پشتیبانی آنلاین — پاسخگویی سریع</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={SUPPORT_TEL}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50 transition"
            >
              <Phone size={18} className="text-blue-600" />
              <span dir="ltr">{SUPPORT_PHONE}</span>
            </a>
            <a
              href={LINK_BALE}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-blue-50 transition text-sm"
            >
              بله
            </a>
            <a
              href={LINK_RUBIKA}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-blue-50 transition text-sm"
            >
              روبیکا
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="text-white font-bold text-lg mb-2">وبینو</div>
            <p>نرم‌افزار حسابداری و مدیریت فروشگاه تحت وب</p>
          </div>
          <div>
            <div className="text-white font-medium mb-3">دسترسی سریع</div>
            <ul className="space-y-2">
              <li>
                <Link href={REGISTER_URL} className="hover:text-blue-400">
                  ثبت‌نام رایگان
                </Link>
              </li>
              <li>
                <Link href={LOGIN_URL} className="hover:text-blue-400">
                  ورود
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-white font-medium mb-3">تماس</div>
            <a href={SUPPORT_TEL} className="hover:text-blue-400" dir="ltr">
              {SUPPORT_PHONE}
            </a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-8 pt-8 border-t border-slate-800 text-center text-xs">
          © {new Date().getFullYear()} وبینو — تمامی حقوق محفوظ است
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-white/95 backdrop-blur border-t border-slate-200 safe-area-pb">
        <button
          type="button"
          onClick={startFree}
          className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold shadow-lg"
        >
          شروع رایگان ۳۰ روزه
        </button>
      </div>
      <div className="h-20 md:hidden" aria-hidden />
    </div>
  );
}
