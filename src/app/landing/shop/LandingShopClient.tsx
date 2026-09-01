"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Zap,
  Package,
  Users,
  TrendingUp,
  Smartphone,
  CreditCard,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Phone,
  Headphones,
  CheckCircle2,
  Menu,
  X,
  ScanBarcode,
  WifiOff,
  Globe,
  Sparkles,
  Gift,
} from "lucide-react";
import WebinoChatbot from "@/app/coponent/WebinoChatbot";

const REGISTER_URL = "/admin/register-shop";
const LOGIN_URL = "/admin/login";
const AGENCY_REQUEST_URL = "/agency-request";
const SUPPORT_PHONE = "09399166196";
const SUPPORT_TEL = "tel:09399166196";
const LINK_BALE = "https://ble.ir/AmiriWebino";
const LINK_RUBIKA = "https://rubika.ir/WebinoPlus";
const ENAMAD_HTML =
  "<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=7529264&Code=GLi3yveM4jposDINx6Ukri04cknZLvuY'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=7529264&Code=GLi3yveM4jposDINx6Ukri04cknZLvuY' alt='' style='cursor:pointer' code='GLi3yveM4jposDINx6Ukri04cknZLvuY'></a>";

const BENEFITS = [
  { icon: Zap, title: "ثبت فروش سریع", desc: "فاکتور، بارکد و چند سبد همزمان", color: "from-violet-500 to-fuchsia-500" },
  { icon: Package, title: "مدیریت انبار", desc: "موجودی، قیمت خرید و فروش", color: "from-cyan-500 to-blue-500" },
  { icon: Users, title: "مشتریان و اقساط", desc: "بدهی، اعتبار و باشگاه مشتریان", color: "from-amber-500 to-orange-500" },
  { icon: TrendingUp, title: "گزارش سود", desc: "فروش روزانه، ماهانه و سود و ضرر", color: "from-emerald-500 to-teal-500" },
];

const FEATURE_CATEGORIES = [
  {
    id: "sales",
    title: "فروش",
    gradient: "from-violet-600 to-fuchsia-600",
    items: [
      "صفحه فروش و حالت منو",
      "چند سبد همزمان",
      "اسکن بارکد",
      "فروش نقدی / کارتی / ترکیبی",
      "فروش اقساطی و نسیه",
      "تخفیف و اعتبار مشتری",
      "صف خرید آفلاین",
      "چاپ فاکتور و لیبل کالا",
    ],
  },
  {
    id: "accounting",
    title: "حسابداری",
    gradient: "from-cyan-600 to-blue-600",
    items: [
      "گزارشات و سود و ضرر",
      "موجودی انبار",
      "هزینه‌ها و گزارش هزینه",
      "اقساط و اعتبار اقساطی",
      "بدهکاران (نسیه)",
      "برگشت خرید و تطبیق روزانه",
      "حقوق و کارمندان",
      "فاکتورها، دسته‌بندی، تخفیف دسته‌جمعی",
      "تولیدکنندگان و محصولات پرفروش",
      "ارسال پیامک و پنل معرفی",
    ],
  },
  {
    id: "online",
    title: "فروشگاه آنلاین",
    gradient: "from-emerald-600 to-teal-600",
    items: [
      "سفارشات اینترنتی",
      "مدیریت محصولات فروشگاه",
      "دسته‌بندی محصولات",
      "نمایش قیمت و موجودی",
      "ثبت و پیگیری سفارش مشتری",
    ],
  },
];

const HIGHLIGHTS = [
  { icon: Smartphone, label: "نصب PWA روی موبایل و ویندوز" },
  { icon: ScanBarcode, label: "اسکن بارکد" },
  { icon: CreditCard, label: "اتصال کارتخوان" },
  { icon: WifiOff, label: "فروش آفلاین" },
  { icon: Gift, label: "باشگاه مشتریان" },
  { icon: Globe, label: "فروشگاه آنلاین" },
];

const HERO_IMAGE = "/landing/11.jpg";

const GALLERY = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  src: `/landing/${i + 1}.png`,
  title: [
    "صفحه فروش",
    "حالت منو",
    "لیست محصولات",
    "گزارش فروش",
    "موجودی انبار",
    "مدیریت مشتریان",
    "فروش اقساطی",
    "سفارشات اینترنتی",
    "چاپ فاکتور",
    "داشبورد",
  ][i],
}));

const PLANS = [
  {
    name: "پلن اولیه",
    price: "6,3۰۰,۰۰۰",
    unit: "تومان / سال",
    description: "همه امکانات اصلی فروش و حسابداری",
    popular: false,
    features: [
      "فروش، انبار و مشتریان",
      "گزارشات و سود و ضرر",
      "فروش اقساطی و نسیه",
      "چاپ فاکتور و لیبل",
      "ارسال پیامک",
      "فروش آفلاین",
    ],
  },
  {
    name: "پلن باشگاه مشتریان",
    price: "10,5۰۰,۰۰۰",
    unit: "تومان / سال",
    description: "پلن اولیه + باشگاه مشتریان و امکانات وفاداری",
    popular: true,
    features: [
      "تمام امکانات پلن اولیه",
      "باشگاه مشتریان",
      "اعتبار و امتیاز مشتری",
      "پیامک مناسبتی",
      "فروشگاه آنلاین",
      "پشتیبانی اولویت‌دار",
    ],
  },
];

const STEPS = [
  { n: "۱", title: "ثبت‌نام رایگان", desc: "شماره موبایل و نام فروشگاه" },
  { n: "۲", title: "ثبت کالا و اولین فروش", desc: "بارکد، قیمت و موجودی" },
  { n: "۳", title: "مدیریت فروشگاه", desc: "سود، فروش و گزارش‌ها" },
];

const FAQS = [
  {
    q: "آیا روی موبایل نصب می‌شود؟",
    a: "بله. نرم‌افزار PWA است و روی اندروید، iOS و ویندوز از مرورگر قابل نصب و اجرا مانند اپلیکیشن است.",
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
    q: "تفاوت دو پلن چیست؟",
    a: "پلن اولیه شامل فروش و حسابداری کامل است. پلن باشگاه مشتریان علاوه بر آن، باشگاه مشتریان، اعتبار/امتیاز و فروشگاه آنلاین را هم دارد.",
  },
  {
    q: "آیا نسخه آزمایشی رایگان دارد؟",
    a: "یک هفته استفاده رایگان به‌همراه ۲۰ پیامک هدیه برای شروع.",
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
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");

  const nextSlide = useCallback(() => {
    setSlide((s) => (s + 1) % GALLERY.length);
  }, []);
  const prevSlide = useCallback(() => {
    setSlide((s) => (s - 1 + GALLERY.length) % GALLERY.length);
  }, []);

  const startFree = () => {
    if (typeof window !== "undefined") {
      if (phone.trim()) sessionStorage.setItem("landing_register_phone", phone.trim());
      if (shopName.trim()) sessionStorage.setItem("landing_register_shop", shopName.trim());
    }
    window.location.href = REGISTER_URL;
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#0b0f1a] text-slate-100 antialiased">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-[#0b0f1a]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl bg-gradient-to-l from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
            وبینو
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <Link href="/" className="hover:text-cyan-400 transition">همه محصولات</Link>
            <a href="#features" className="hover:text-cyan-400 transition">امکانات</a>
            <a href="#screenshots" className="hover:text-cyan-400 transition">گالری</a>
            <a href="#pricing" className="hover:text-cyan-400 transition">تعرفه</a>
            <a href="#faq" className="hover:text-cyan-400 transition">سوالات</a>
            <Link
              href={AGENCY_REQUEST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition"
            >
              درخواست نمایندگی
            </Link>
            <Link href={LOGIN_URL} className="hover:text-cyan-400 transition">ورود</Link>
            <Link
              href={REGISTER_URL}
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
            <Link href="/" onClick={() => setNavOpen(false)}>همه محصولات</Link>
            <a href="#features" onClick={() => setNavOpen(false)}>امکانات</a>
            <a href="#screenshots" onClick={() => setNavOpen(false)}>گالری</a>
            <a href="#pricing" onClick={() => setNavOpen(false)}>تعرفه</a>
            <a href="#faq" onClick={() => setNavOpen(false)}>سوالات</a>
            <Link
              href={AGENCY_REQUEST_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setNavOpen(false)}
            >
              درخواست نمایندگی
            </Link>
            <Link href={LOGIN_URL}>ورود</Link>
            <Link href={REGISTER_URL} className="text-fuchsia-400 font-semibold">شروع رایگان</Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.25),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(6,182,212,0.15),_transparent_45%)]" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-fuchsia-600/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-cyan-500/15 blur-[90px] rounded-full" />

        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center relative">
          <motion.div {...fadeUp(0)} className="text-center lg:text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs font-medium mb-4">
              <Sparkles size={14} /> یک هفته تست رایگان — فروش، حسابداری، فروشگاه آنلاین
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-[1.8rem] font-bold leading-tight">
              <span className="bg-gradient-to-l from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                مدیریت کامل فروشگاه
              </span>
              </h1>
              <br />
              <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold leading-tight">
              <span className="bg-gradient-to-l from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                در یک نرم‌افزار مدرن
              </span>
            </h1>
            <p className="mt-4 text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              فروش، انبار، حسابداری، اقساط، باشگاه مشتریان و سفارشات آنلاین —
              قابل نصب روی موبایل و ویندوز.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start">
              <button
                type="button"
                onClick={startFree}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-l from-violet-600 via-fuchsia-600 to-pink-600 text-white font-semibold hover:opacity-90 transition shadow-xl shadow-fuchsia-900/40"
              >
                شروع رایگان یک هفته‌ای
              </button>
              <Link
                href={LOGIN_URL}
                className="px-8 py-3.5 rounded-xl border border-white/15 bg-white/5 text-slate-200 font-medium hover:bg-white/10 transition text-center"
              >
                ورود به پنل فروش
              </Link>
              <a
                href="#screenshots"
                className="px-8 py-3.5 rounded-xl border border-white/15 bg-white/5 text-slate-200 font-medium hover:bg-white/10 transition text-center"
              >
                مشاهده گالری
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 justify-center lg:justify-start">
              {HIGHLIGHTS.map((h) => (
                <span
                  key={h.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300"
                >
                  <h.icon size={13} className="text-cyan-400 shrink-0" />
                  {h.label}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="relative">
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-900/30 bg-white/5 backdrop-blur-sm">
              <div className="relative aspect-[4/3] w-full bg-white/5">
                {/* unoptimized: فایل‌های static داخل public بدون خطای optimizer */}
                <Image
                  src={HERO_IMAGE}
                  alt="نمای نرم‌افزار وبینو"
                  fill
                  sizes="(max-width: 1024px) 100vw, 560px"
                  className="object-cover"
                  priority
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f1a] via-transparent to-transparent" />
                <div className="absolute bottom-4 right-4 left-4 flex gap-2">
                  <div className="flex-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-3">
                    <div className="text-[10px] text-cyan-300">فروش امروز</div>
                    <div className="text-lg font-bold text-white">۸,۲۴۰,۰۰۰</div>
                  </div>
                  <div className="flex-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-3">
                    <div className="text-[10px] text-fuchsia-300">سود امروز</div>
                    <div className="text-lg font-bold text-white">۱,۹۵۰,۰۰۰</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-20 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2 {...fadeUp()} className="text-2xl md:text-3xl font-bold text-center mb-10">
            چرا فروشگاه‌داران <span className="text-cyan-400">وبینو</span> را انتخاب می‌کنند؟
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                {...fadeUp(i * 0.05)}
                className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] transition group"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${b.color} text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition`}>
                  <b.icon size={22} />
                </div>
                <h3 className="font-bold text-white">{b.title}</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features by category */}
      <section id="features" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">امکانات کامل نرم‌افزار</h2>
            <p className="text-slate-400 mt-2">فروش · حسابداری · فروشگاه آنلاین</p>
          </motion.div>
          <div className="grid lg:grid-cols-3 gap-6">
            {FEATURE_CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.id}
                {...fadeUp(i * 0.08)}
                className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-white/20 transition"
              >
                <div className={`px-5 py-4 bg-gradient-to-l ${cat.gradient}`}>
                  <h3 className="font-bold text-lg text-white">{cat.title}</h3>
                </div>
                <ul className="p-5 space-y-2.5">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 size={15} className="text-cyan-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section id="steps" className="py-16 md:py-20 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <motion.h2 {...fadeUp()} className="text-2xl md:text-3xl font-bold mb-12">
            در ۳ مرحله شروع کنید
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} {...fadeUp(i * 0.08)}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-600 text-white flex items-center justify-center text-lg font-bold mx-auto mb-4 shadow-lg shadow-fuchsia-900/30">
                  {s.n}
                </div>
                <h3 className="font-bold text-lg text-white">{s.title}</h3>
                <p className="text-slate-400 text-sm mt-2">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="screenshots" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">نمای نرم‌افزار</h2>
            <p className="text-slate-400 mt-2 text-sm">نمای پنل فروش و حسابداری وبینو</p>
          </motion.div>

          {/* Carousel — mobile / featured */}
          <div className="relative max-w-2xl mx-auto mb-10">
            <div
              className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl cursor-pointer group"
              onClick={() => setLightbox(slide + 1)}
            >
              <div className="relative aspect-video w-full bg-white/5">
                <Image
                  src={GALLERY[slide].src}
                  alt={GALLERY[slide].title}
                  fill
                  className="object-cover group-hover:scale-[1.02] transition duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <span className="font-semibold text-white">{GALLERY[slide].title}</span>
                  <span className="text-slate-400 text-xs mr-2">({slide + 1} / 10)</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={prevSlide}
              className="absolute right-full top-1/2 -translate-y-1/2 mr-2 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition"
              aria-label="قبلی"
            >
              <ChevronRight size={20} />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition"
              aria-label="بعدی"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
              {GALLERY.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${i === slide ? "bg-fuchsia-500 w-6" : "bg-white/20 w-1.5"}`}
                  aria-label={`اسلاید ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Grid thumbnails */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {GALLERY.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => {
                  setSlide(img.id - 1);
                  setLightbox(img.id);
                }}
                className={`relative aspect-[4/3] rounded-xl overflow-hidden border transition ${
                  slide === img.id - 1
                    ? "border-fuchsia-500 ring-2 ring-fuchsia-500/30"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <Image src={img.src} alt={img.title} fill className="object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1">
                  <span className="text-[10px] text-white truncate block">{img.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute -top-12 left-0 text-white/70 hover:text-white text-sm"
            >
              بستن ✕
            </button>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/20">
              <Image
                src={`/landing/${lightbox}.jpg`}
                alt={GALLERY[lightbox - 1]?.title ?? ""}
                fill
                className="object-contain bg-black"
              />
            </div>
            <p className="text-center text-slate-300 mt-3">{GALLERY[lightbox - 1]?.title}</p>
          </div>
        </div>
      )}

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-24 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">تعرفه اشتراک سالانه</h2>
            <p className="text-slate-400 mt-2">پلن مناسب فروشگاه خود را انتخاب کنید</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                {...fadeUp(i * 0.1)}
                className={`relative rounded-2xl p-7 border transition hover:scale-[1.02] ${
                  plan.popular
                    ? "border-fuchsia-500/50 bg-gradient-to-b from-fuchsia-950/40 to-violet-950/20 shadow-xl shadow-fuchsia-900/20"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {plan.popular && (
                  <span className="absolute top-4 left-4 text-xs bg-gradient-to-l from-fuchsia-600 to-violet-600 text-white px-3 py-1 rounded-full">
                    پیشنهادی
                  </span>
                )}
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-slate-400 text-sm mt-1">{plan.description}</p>
                <div className="mt-5 mb-6">
                  <span className="text-3xl md:text-4xl font-bold bg-gradient-to-l from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
                    {plan.price}
                  </span>
                  <span className="text-slate-400 text-sm mr-2">{plan.unit}</span>
                </div>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 size={15} className="text-cyan-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={REGISTER_URL}
                  className={`block text-center py-3.5 rounded-xl font-semibold transition ${
                    plan.popular
                      ? "bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white hover:opacity-90 shadow-lg shadow-fuchsia-900/30"
                      : "bg-white/10 text-white hover:bg-white/15 border border-white/10"
                  }`}
                >
                  شروع کنید
                </Link>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-slate-500 text-sm mt-8">
            یک هفته تست رایگان · ۲۰ پیامک هدیه · بدون نیاز به نصب پیچیده
          </p>
        </div>
      </section>

      {/* Offer CTA */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            {...fadeUp()}
            className="rounded-3xl bg-gradient-to-br from-violet-700 via-fuchsia-700 to-cyan-700 text-white p-8 md:p-12 text-center shadow-2xl shadow-fuchsia-900/30 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_60%)]" />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold">پیشنهاد ویژه شروع</h2>
              <ul className="mt-6 space-y-2 text-violet-100 text-base md:text-lg">
                <li>یک هفته استفاده رایگان</li>
                <li>۲۰ پیامک هدیه</li>
                <li>پشتیبانی رایگان راه‌اندازی</li>
              </ul>
              <button
                type="button"
                onClick={startFree}
                className="mt-8 px-10 py-4 rounded-xl bg-white text-violet-800 font-bold hover:bg-violet-50 transition shadow-lg"
              >
                همین حالا رایگان شروع کن
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Short signup */}
      <section id="signup" className="py-16 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-xl font-bold text-center mb-6 text-white">ثبت‌نام سریع</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="نام فروشگاه"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 outline-none"
            />
            <input
              type="tel"
              placeholder="شماره موبایل (۰۹...)"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              dir="ltr"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 outline-none text-left"
            />
            <button
              type="button"
              onClick={startFree}
              className="w-full py-3.5 rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white font-semibold hover:opacity-90 transition"
            >
              شروع رایگان یک هفته‌ای
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-20">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">سوالات متداول</h2>
          <div className="space-y-2">
            {FAQS.map((item, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-4 text-right font-medium text-slate-200 hover:bg-white/[0.04]"
                >
                  {item.q}
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition text-slate-400 ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <p className="px-4 pb-4 text-sm text-slate-400 leading-relaxed border-t border-white/5">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support */}
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

      {/* Footer */}
      <footer className="bg-[#070a12] text-slate-500 py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="text-white font-bold text-lg mb-2">وبینو</div>
            <p>نرم‌افزار حسابداری، فروش و فروشگاه آنلاین</p>
          </div>
          <div>
            <div className="text-white font-medium mb-3">دسترسی سریع</div>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-cyan-400">همه محصولات</Link></li>
              <li><Link href={REGISTER_URL} className="hover:text-cyan-400">ثبت‌نام رایگان</Link></li>
              <li><Link href={LOGIN_URL} className="hover:text-cyan-400">ورود</Link></li>
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
              <li><a href="#pricing" className="hover:text-cyan-400">تعرفه</a></li>
            </ul>
          </div>
          <div>
            <div className="text-white font-medium mb-3">تماس</div>
            <a href={SUPPORT_TEL} className="hover:text-cyan-400" dir="ltr">{SUPPORT_PHONE}</a>
          </div>
          <div>
            <div className="text-white font-medium mb-3">نماد اعتماد الکترونیکی</div>
            <div
              className="inline-block bg-white rounded-lg p-2"
              dangerouslySetInnerHTML={{ __html: ENAMAD_HTML }}
            />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-8 pt-8 border-t border-white/5 text-center text-xs">
          © {new Date().getFullYear()} وبینو — تمامی حقوق محفوظ است
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-[#0b0f1a]/95 backdrop-blur border-t border-white/10">
        <button
          type="button"
          onClick={startFree}
          className="w-full py-3.5 rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white font-semibold shadow-lg"
        >
          شروع رایگان یک هفته‌ای
        </button>
      </div>
      <div className="h-20 md:hidden" aria-hidden />
      <WebinoChatbot audience="landing" />
    </div>
  );
}
