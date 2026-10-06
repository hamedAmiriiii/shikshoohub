"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  CheckCircle2,
  CreditCard,
  Gift,
  Headphones,
  Image as ImageIcon,
  LayoutTemplate,
  Menu,
  Phone,
  QrCode,
  ScanLine,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react";
import WebinoChatbot from "@/app/coponent/WebinoChatbot";
import { ReservMenuThemePreview } from "@/app/admin/settings/ReservMenuThemePreview";
import {
  RESERV_MENU_THEMES,
  type ReservMenuThemeId,
} from "@/app/lib/reservMenuThemes";
import ConsultationRequestForm from "../ConsultationRequestForm";
import {
  AGENCY_REQUEST_URL,
  ENAMAD_HTML,
  LINK_BALE,
  LINK_RUBIKA,
  LOGIN_URL,
  SUPPORT_PHONE,
  SUPPORT_TEL,
} from "../catalog";

const SHOP_LANDING_URL = "/landing/shop";
const CLUB_LANDING_URL = "/landing/club";

const DEMO_THEMES = RESERV_MENU_THEMES.filter((t) => t.id !== "video");

const FEATURES = [
  { icon: QrCode, title: "QR اختصاصی میز", desc: "هر میز لینک خودش را دارد؛ مشتری اسکن می‌کند و وارد منو می‌شود." },
  { icon: LayoutTemplate, title: "چندین تم آماده", desc: "کلاسیک، لیستی، ویترین، جدولی، کاور و متحرک — بدون طراحی جدا." },
  { icon: ImageIcon, title: "عکس، قیمت و تخفیف", desc: "هر آیتم با تصویر و قیمت به‌روز؛ تغییر فوری بدون چاپ دوباره." },
  { icon: BellRing, title: "پیجر گارسون", desc: "درخواست خدمات میز از گوشی مشتری، بدون دستگاه فراخوان." },
  { icon: CreditCard, title: "پرداخت آنلاین", desc: "مشتری می‌تواند آنلاین بپردازد یا روش دیگر را انتخاب کند." },
  { icon: Gift, title: "اتصال به باشگاه", desc: "در پلن بالاتر، اعتبار و باشگاه هوشمند روی همان منو فعال است." },
];

const SAMPLE_MENUS = [
  { title: "رستوران سنتی", note: "کباب و غذای ایرانی", theme: "classic" as ReservMenuThemeId },
  { title: "کافی‌شاپ", note: "نوشیدنی و دسر", theme: "list" as ReservMenuThemeId },
  { title: "فست‌فود", note: "منوی سریع و تصویری", theme: "grid" as ReservMenuThemeId },
];

const PLANS = [
  {
    name: "پایه",
    price: "۱۱",
    tag: null as string | null,
    description: "منوی آنلاین و صندوق فروش برای شروع",
    popular: false,
    features: [
      "منوی دیجیتال با QR میز",
      "چندین تم نمایش منو",
      "فروش نقد، کارت و ترکیبی",
      "کالا، موجودی و گزارش فروش",
      "چاپ فیش و نصب روی موبایل",
    ],
  },
  {
    name: "فروش کامل",
    price: "۱۶",
    tag: null as string | null,
    description: "منو به‌همراه پنل فروش کامل رستوران",
    popular: true,
    features: [
      "همه امکانات پایه",
      "سفارش آنلاین میز و اتاق",
      "اقساط، نسیه، خرید و سود",
      "پرداخت آنلاین روی منو",
      "پیجر گارسون و حقوق پرسنل",
    ],
  },
  {
    name: "نسخه ۲۱",
    price: "۲۹",
    tag: "پنل فروش + باشگاه هوشمند",
    description: "منو، پنل فروش و باشگاه مشتریان هوشمند",
    popular: false,
    features: [
      "همه امکانات فروش کامل",
      "باشگاه مشتریان و اعتبار خرید",
      "گروه‌بندی هوشمند و کمپین",
      "پیامک هدفمند و گزارش اثر",
      "دفتر حسابداری و بستن سال",
    ],
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

function toFaDigits(value: string | number) {
  return String(value).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

export default function DigitalMenuLandingClient() {
  const [navOpen, setNavOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<ReservMenuThemeId>("classic");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToConsult = useCallback((planName?: string) => {
    if (planName) setSelectedPlan(planName);
    document.getElementById("consult")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const showTheme = useCallback((theme: ReservMenuThemeId) => {
    setActiveTheme(theme);
    scrollTo("themes");
  }, [scrollTo]);

  const activeThemeMeta = DEMO_THEMES.find((t) => t.id === activeTheme) ?? DEMO_THEMES[0];

  return (
    <div dir="rtl" className="min-h-screen bg-[#071018] text-slate-100 antialiased">
      <header className="sticky top-0 z-50 border-b border-emerald-500/15 bg-[#071018]/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-500 text-[#071018] grid place-items-center shrink-0">
              <UtensilsCrossed size={18} />
            </span>
            <span className="leading-tight">
              <span className="block font-black text-white text-base">وبینو منو</span>
              <span className="block text-[11px] text-emerald-300/80 font-medium">منوی آنلاین رستوران</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <a href="#samples" className="hover:text-emerald-300 transition">نمونه منوها</a>
            <a href="#themes" className="hover:text-emerald-300 transition">تم‌ها</a>
            <a href="#features" className="hover:text-emerald-300 transition">امکانات</a>
            <a href="#pricing" className="hover:text-emerald-300 transition">قیمت‌ها</a>
            <Link href={SHOP_LANDING_URL} className="hover:text-emerald-300 transition">پنل فروش</Link>
            <Link href={LOGIN_URL} className="hover:text-emerald-300 transition">ورود</Link>
            <button
              type="button"
              onClick={() => scrollToConsult()}
              className="bg-gradient-to-l from-cyan-500 to-emerald-500 text-white px-5 py-2 rounded-xl hover:opacity-90 transition font-medium shadow-lg shadow-emerald-900/30"
            >
              درخواست مشاوره
            </button>
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
          <div className="md:hidden border-t border-white/10 bg-[#071018] px-4 py-3 flex flex-col gap-2 text-sm text-slate-300">
            <a href="#samples" onClick={() => setNavOpen(false)}>نمونه منوها</a>
            <a href="#themes" onClick={() => setNavOpen(false)}>تم‌ها</a>
            <a href="#features" onClick={() => setNavOpen(false)}>امکانات</a>
            <a href="#pricing" onClick={() => setNavOpen(false)}>قیمت‌ها</a>
            <Link href={SHOP_LANDING_URL} onClick={() => setNavOpen(false)}>پنل فروش</Link>
            <Link href={LOGIN_URL} onClick={() => setNavOpen(false)}>ورود</Link>
            <button
              type="button"
              className="text-emerald-300 font-semibold text-right"
              onClick={() => {
                setNavOpen(false);
                scrollToConsult();
              }}
            >
              درخواست مشاوره
            </button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(6,182,212,0.12),_transparent_45%)]" />
        <div className="absolute top-16 left-1/4 w-64 h-64 bg-emerald-500/15 blur-[100px] rounded-full" />

        <div className="max-w-6xl mx-auto px-4 relative grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <motion.div {...fadeUp()} className="text-center lg:text-right">
            <p className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-200 text-xs font-medium mb-4">
              <Sparkles size={14} /> منوی آنلاین متصل به پنل فروش وبینو
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-white mb-4">
              منوی دیجیتال
              <span className="block bg-gradient-to-l from-cyan-300 to-emerald-400 bg-clip-text text-transparent">
                رستوران و کافی‌شاپ
              </span>
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-8 mb-8 max-w-xl mx-auto lg:mx-0">
              مشتری QR میز را اسکن می‌کند، منو را روی گوشی می‌بیند و سفارش می‌دهد.
              تم‌ها را همین‌جا ببینید؛ قیمت‌ها شفاف‌اند.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <button
                type="button"
                onClick={() => scrollToConsult()}
                className="px-6 py-3 rounded-xl bg-gradient-to-l from-cyan-500 to-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/30 hover:opacity-95 transition"
              >
                درخواست مشاوره و خرید
              </button>
              <a
                href="#themes"
                className="px-6 py-3 rounded-xl border border-white/15 bg-white/5 text-slate-100 font-semibold hover:border-emerald-400/40 transition"
              >
                مشاهده تم‌ها
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 justify-center lg:justify-start">
              {[
                { icon: ScanLine, label: "اسکن QR" },
                { icon: Smartphone, label: "منو روی گوشی" },
                { icon: CreditCard, label: "پرداخت آنلاین" },
              ].map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300"
                >
                  <item.icon size={13} className="text-emerald-300 shrink-0" />
                  {item.label}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="relative mx-auto w-full max-w-[340px]">
            <div className="absolute -inset-6 bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 blur-2xl rounded-full" />
            <div className="relative rounded-[2rem] border border-white/10 bg-black/30 p-3 shadow-2xl shadow-emerald-950/40">
              <ReservMenuThemePreview themeId={activeTheme} scale={0.88} height={620} />
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              پیش‌نمایش زنده تم «{activeThemeMeta.title}»
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sample menus */}
      <section id="samples" className="py-14 md:py-16 border-t border-white/5 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white">نمونه منوها</h2>
            <p className="text-slate-400 mt-2">برای هر کسب‌وکار، ظاهر مناسب را انتخاب کنید</p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-4">
            {SAMPLE_MENUS.map((sample, i) => (
              <motion.button
                key={sample.title}
                type="button"
                {...fadeUp(i * 0.05)}
                onClick={() => showTheme(sample.theme)}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-right hover:border-emerald-400/40 hover:bg-white/[0.06] transition"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-300 grid place-items-center mb-3">
                  <UtensilsCrossed size={20} />
                </div>
                <div className="font-bold text-white mb-1">{sample.title}</div>
                <p className="text-sm text-slate-400 leading-7 mb-3">{sample.note}</p>
                <span className="text-xs font-semibold text-cyan-300">مشاهده تم {DEMO_THEMES.find((t) => t.id === sample.theme)?.title}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Live themes */}
      <section id="themes" className="py-14 md:py-16 bg-white/[0.02] border-y border-white/5 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white">تم‌های منو — دموی زنده</h2>
            <p className="text-slate-400 mt-2">روی هر تم بزنید؛ پیش‌نمایش همان لحظه عوض می‌شود</p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {DEMO_THEMES.map((theme) => {
              const active = theme.id === activeTheme;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setActiveTheme(theme.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                    active
                      ? "bg-gradient-to-l from-cyan-500 to-emerald-500 text-white border-transparent shadow-lg shadow-emerald-900/30"
                      : "bg-white/5 text-slate-300 border-white/10 hover:border-emerald-400/40"
                  }`}
                >
                  {theme.title}
                </button>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-8 items-start">
            <motion.div {...fadeUp()} className="rounded-2xl border border-white/10 bg-[#0c1520] p-5">
              <div className="text-lg font-bold text-white mb-2">{activeThemeMeta.title}</div>
              <p className="text-sm text-slate-400 leading-7 mb-4">{activeThemeMeta.hint}</p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" /> مناسب موبایل مشتری</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" /> تعویض تم از تنظیمات پنل</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" /> عکس و قیمت همان لحظه به‌روز</li>
              </ul>
            </motion.div>

            <motion.div {...fadeUp(0.06)} className="flex justify-center">
              <div className="relative w-full max-w-[360px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTheme}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                    className="rounded-[2rem] border border-white/10 bg-black/25 p-2 shadow-2xl"
                  >
                    <ReservMenuThemePreview themeId={activeTheme} scale={1} height={640} scrollable />
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-14 md:py-16 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white">امکانات</h2>
            <p className="text-slate-400 mt-2">از اسکن تا پرداخت، یک مسیر کوتاه</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp(i * 0.04)}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <item.icon className="text-emerald-300 mb-3" size={24} />
                <div className="font-bold text-white mb-1">{item.title}</div>
                <p className="text-sm text-slate-400 leading-7">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-14 md:py-16 bg-white/[0.02] border-y border-white/5 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white">قیمت‌ها</h2>
            <p className="text-slate-400 mt-2">سه پلن شفاف — نسخه ۲۱ پنل فروش و باشگاه هوشمند دارد</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4 items-stretch">
            {PLANS.map((plan, i) => (
              <motion.article
                key={plan.name}
                {...fadeUp(i * 0.05)}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  plan.popular
                    ? "border-emerald-400/40 bg-gradient-to-b from-emerald-500/10 to-transparent shadow-xl shadow-emerald-950/30"
                    : "border-white/10 bg-[#0c1520]"
                }`}
              >
                {plan.popular ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-[#071018] text-[11px] font-black">
                    پیشنهادی
                  </span>
                ) : null}
                <div className="mb-4">
                  <div className="text-lg font-bold text-white">{plan.name}</div>
                  {plan.tag ? (
                    <div className="mt-1 text-xs font-semibold text-cyan-300">{plan.tag}</div>
                  ) : null}
                  <p className="text-sm text-slate-400 mt-2 leading-7">{plan.description}</p>
                </div>
                <div className="mb-5">
                  <span className="text-4xl font-black text-white">{toFaDigits(plan.price)}</span>
                  <span className="text-slate-400 text-sm mr-2">میلیون تومان</span>
                </div>
                <ul className="space-y-2.5 text-sm text-slate-300 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => scrollToConsult(plan.name)}
                  className={`w-full py-3 rounded-xl font-bold transition ${
                    plan.popular
                      ? "bg-gradient-to-l from-cyan-500 to-emerald-500 text-white hover:opacity-95"
                      : "border border-white/15 bg-white/5 text-slate-100 hover:border-emerald-400/40"
                  }`}
                >
                  انتخاب {plan.name}
                </button>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <ConsultationRequestForm
        source="digital_menu"
        businessPlaceholder="نام رستوران یا کافی‌شاپ"
        selectedPlan={selectedPlan}
        submitGradientClass="from-cyan-500 to-emerald-500"
        subtitle="فرم را پر کنید؛ همکاران وبینو برای راه‌اندازی منو با شما تماس می‌گیرند."
      />

      <section className="py-14 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Headphones className="mx-auto text-emerald-300 mb-4" size={36} />
          <h2 className="text-xl font-bold text-white">راه‌اندازی منو را با هم انجام می‌دهیم</h2>
          <p className="text-slate-400 mt-2 mb-6 text-sm">پشتیبانی آنلاین — پاسخگویی سریع</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={SUPPORT_TEL}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:border-emerald-500/40 transition text-slate-200"
            >
              <Phone size={18} className="text-emerald-300" />
              <span dir="ltr">{SUPPORT_PHONE}</span>
            </a>
            <a href={LINK_BALE} target="_blank" rel="noopener noreferrer" className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-200 hover:border-cyan-400/40 transition">
              بله
            </a>
            <a href={LINK_RUBIKA} target="_blank" rel="noopener noreferrer" className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-200 hover:border-cyan-400/40 transition">
              روبیکا
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-[#050b10] text-slate-500 py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="text-white font-bold text-lg mb-2">وبینو منو</div>
            <p>منوی آنلاین رستوران و کافی‌شاپ، متصل به پنل فروش وبینو</p>
          </div>
          <div>
            <div className="text-white font-medium mb-3">دسترسی</div>
            <ul className="space-y-2">
              <li><a href="#themes" className="hover:text-emerald-300">تم‌ها</a></li>
              <li><a href="#pricing" className="hover:text-emerald-300">قیمت‌ها</a></li>
              <li><Link href={SHOP_LANDING_URL} className="hover:text-emerald-300">پنل فروش</Link></li>
              <li><Link href={CLUB_LANDING_URL} className="hover:text-emerald-300">باشگاه هوشمند</Link></li>
              <li>
                <Link href={AGENCY_REQUEST_URL} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-300">
                  نمایندگی
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-white font-medium mb-3">تماس</div>
            <a href={SUPPORT_TEL} className="hover:text-emerald-300" dir="ltr">{SUPPORT_PHONE}</a>
          </div>
          <div>
            <div className="text-white font-medium mb-3">نماد اعتماد</div>
            <div className="inline-block bg-white rounded-lg p-2" dangerouslySetInnerHTML={{ __html: ENAMAD_HTML }} />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-8 pt-6 border-t border-white/5 text-center text-xs">
          © {new Date().getFullYear()} وبینو — تمامی حقوق محفوظ است
        </div>
      </footer>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-[#071018]/95 backdrop-blur border-t border-white/10">
        <button
          type="button"
          onClick={() => scrollToConsult()}
          className="w-full py-3.5 rounded-xl bg-gradient-to-l from-cyan-500 to-emerald-500 text-white font-semibold shadow-lg"
        >
          درخواست مشاوره
        </button>
      </div>
      <div className="h-20 md:hidden" aria-hidden />

      <WebinoChatbot audience="landing" />
    </div>
  );
}
