"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  QrCode,
  Smartphone,
  CreditCard,
  Image as ImageIcon,
  BellRing,
  Gift,
  Banknote,
  Sparkles,
  Printer,
  Megaphone,
  CheckCircle2,
  ChefHat,
  ScanLine,
} from "lucide-react";
import LandingChrome from "../LandingChrome";
import ConsultationRequestForm from "../ConsultationRequestForm";
import { REGISTER_URL } from "../catalog";

const FEATURES = [
  { icon: ImageIcon, title: "تصویر، قیمت و تخفیف", desc: "هر آیتم منو با عکس، قیمت و درصد تخفیف دیده می‌شود." },
  { icon: BellRing, title: "فراخوان گارسون", desc: "درخواست خدمات میز بدون پیجر و بدون معطلی." },
  { icon: Gift, title: "باشگاه مشتریان", desc: "اتصال هوشمند به اعتبار و باشگاه مشتریان وبینو." },
  { icon: Banknote, title: "پرداخت نقدی و آنلاین", desc: "مشتری می‌تواند آنلاین بپردازد یا روش دیگر را انتخاب کند." },
];

const BENEFITS = [
  { icon: Sparkles, title: "منوی همیشه به‌روز", desc: "بدون چاپ مجدد، قیمت و آیتم‌ها را لحظه‌ای عوض کنید." },
  { icon: Printer, title: "حذف هزینه چاپ منو", desc: "دیگر هزینه چاپ و نگهداری منوی کاغذی ندارید." },
  { icon: Megaphone, title: "بدون دستگاه فراخوان", desc: "درخواست خدمات از روی گوشی مشتری ثبت می‌شود." },
  { icon: CheckCircle2, title: "سفارش ساده‌تر", desc: "از اسکن تا انتخاب و پرداخت، همه در یک مسیر کوتاه." },
];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.45, delay },
  };
}

export default function DigitalMenuLandingClient() {
  const scrollToForm = () => {
    document.getElementById("consult")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <LandingChrome
      onStartFree={scrollToForm}
      ctaLabel="درخواست مشاوره"
      hideRegister
      loginLabel="ورود پنل"
    >
      {/* Hero */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-14 md:pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(16,185,129,0.12),_transparent_45%)]" />
        <div className="max-w-6xl mx-auto px-4 relative">
          <motion.div {...fadeUp()} className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold tracking-wide text-cyan-300/90 mb-3">وبینو</p>
            <h1 className="text-3xl md:text-5xl font-black leading-tight text-white mb-4">
              منوی دیجیتال رستوران و کافی‌شاپ
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-8 mb-8">
              مشتری با اسکن QR روی میز، منوی شما را روی گوشی می‌بیند، با حوصله سفارش می‌دهد و در صورت نیاز
              آنلاین پرداخت می‌کند — همه‌چیز متصل به نرم‌افزار فروش وبینو.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={scrollToForm}
                className="px-6 py-3 rounded-xl bg-gradient-to-l from-cyan-500 to-emerald-500 text-white font-bold shadow-lg shadow-cyan-500/20 hover:opacity-95 transition"
              >
                درخواست مشاوره و خرید
              </button>
              <Link
                href={REGISTER_URL}
                className="px-6 py-3 rounded-xl border border-white/15 bg-white/5 text-slate-100 font-semibold hover:border-cyan-400/50 transition"
              >
                شروع رایگان پنل فروش
              </Link>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp(0.12)}
            className="mt-12 grid sm:grid-cols-3 gap-3 max-w-3xl mx-auto"
          >
            {[
              { icon: ScanLine, label: "اسکن QR میز" },
              { icon: Smartphone, label: "مشاهده منو روی گوشی" },
              { icon: CreditCard, label: "پرداخت آنلاین" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center"
              >
                <item.icon className="mx-auto mb-2 text-cyan-300" size={28} />
                <div className="text-sm font-semibold text-slate-200">{item.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-14 md:py-16 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center">
          <motion.div {...fadeUp()}>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">چرا منوی آنلاین وبینو؟</h2>
            <p className="text-slate-300 leading-8 mb-4">
              به‌روز بودن منو و ظاهر حرفه‌ای آن، مستقیم روی فروش رستوران و کافی‌شاپ اثر می‌گذارد. با منوی
              دیجیتال وبینو، مشتری وارد مجموعه که شد QR روی میز را اسکن می‌کند، منو را با تصویر و توضیحات
              می‌بیند و سفارش را ثبت می‌کند.
            </p>
            <p className="text-slate-400 leading-8">
              منو به نرم‌افزار فروش وبینو وصل است؛ از ثبت سفارش تا پرداخت، مسیر اتوماتیک جلو می‌رود و شما
              کنترل کامل قیمت، موجودی و گزارش را دارید.
            </p>
          </motion.div>
          <motion.div
            {...fadeUp(0.08)}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 p-6 md:p-8"
          >
            <div className="flex items-start gap-3 mb-5">
              <QrCode className="text-cyan-300 shrink-0 mt-1" size={28} />
              <div>
                <div className="font-bold text-white mb-1">تجربه مشتری در یک نگاه</div>
                <p className="text-sm text-slate-400 leading-7">
                  اسکن → مرور منو → انتخاب → پرداخت (در صورت نیاز) → ارسال به آشپزخانه
                </p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex gap-2"><CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> بدون تماس با منوی کاغذی مشترک</li>
              <li className="flex gap-2"><CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> زمان کافی برای انتخاب با آرامش</li>
              <li className="flex gap-2"><CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> کاهش اشتباه در سفارش و انتقال به آشپزخانه</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Payment flow */}
      <section className="py-14 md:py-16 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto mb-10">
            <ChefHat className="mx-auto text-emerald-300 mb-3" size={36} />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              منوی دیجیتال به‌همراه پرداخت آنلاین
            </h2>
            <p className="text-slate-400 leading-8">
              بعد از اسکن، مشتری منو را با تصاویر و توضیحات می‌بیند. اگر پرداخت آنلاین بخواهد، فاکتور را
              می‌بیند و پرداخت می‌کند؛ سپس سفارش برای آشپزخانه ارسال می‌شود.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { step: "۱", title: "اسکن بارکد میز", desc: "مشتری QR اختصاصی میز یا اتاق را با گوشی اسکن می‌کند." },
              { step: "۲", title: "انتخاب از منو", desc: "غذا و نوشیدنی را با عکس، قیمت و تخفیف انتخاب می‌کند." },
              { step: "۳", title: "پرداخت و ارسال", desc: "پرداخت آنلاین یا روش دیگر؛ سفارش به آشپزخانه می‌رود." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                {...fadeUp(i * 0.06)}
                className="rounded-2xl border border-white/10 bg-[#0f1422] p-5"
              >
                <div className="w-10 h-10 rounded-full bg-cyan-500/15 text-cyan-300 font-black flex items-center justify-center mb-3">
                  {item.step}
                </div>
                <div className="font-bold text-white mb-2">{item.title}</div>
                <p className="text-sm text-slate-400 leading-7">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2 {...fadeUp()} className="text-2xl md:text-3xl font-bold text-center text-white mb-10">
            ویژگی‌های منوی دیجیتال وبینو
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp(i * 0.05)}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <item.icon className="text-cyan-300 mb-3" size={26} />
                <div className="font-bold text-white mb-2">{item.title}</div>
                <p className="text-sm text-slate-400 leading-7">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-14 md:py-16 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2 {...fadeUp()} className="text-2xl md:text-3xl font-bold text-center text-white mb-10">
            مزایای منوی دیجیتال وبینو
          </motion.h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {BENEFITS.map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp(i * 0.05)}
                className="rounded-2xl border border-white/10 bg-[#0f1422] p-5 flex gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <item.icon className="text-emerald-300" size={22} />
                </div>
                <div>
                  <div className="font-bold text-white mb-1">{item.title}</div>
                  <p className="text-sm text-slate-400 leading-7">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <ConsultationRequestForm
        source="digital_menu"
        businessPlaceholder="نام رستوران یا کافی‌شاپ"
      />
    </LandingChrome>
  );
}
