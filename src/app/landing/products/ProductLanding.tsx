"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Calculator,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coins,
  Droplets,
  Gift,
  LogIn,
  Share2,
  Sparkles,
  Store,
  Video,
} from "lucide-react";
import LandingChrome from "../LandingChrome";
import {
  LANDING_PRODUCTS,
  TRIAL_CTA,
  TRIAL_SHORT,
  type LandingProduct,
  type ProductIconName,
} from "../catalog";

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

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.45, delay },
  };
}

export default function ProductLanding({ product }: { product: LandingProduct }) {
  const Icon = ICONS[product.icon];
  const others = LANDING_PRODUCTS.filter((p) => p.slug !== product.slug);
  const [slide, setSlide] = useState(0);
  const shots = product.screenshots;
  const hasShots = shots.length > 0;

  const startFree = () => {
    window.location.href = product.registerUrl;
  };

  return (
    <LandingChrome
      registerUrl={product.registerUrl}
      loginUrl={product.loginUrl}
      loginLabel={product.loginLabel}
      onStartFree={startFree}
    >
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.22),_transparent_50%)]" />
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center relative">
          <motion.div {...fadeUp()} className="text-center lg:text-right">
            <Link href="/#products" className="text-sm text-cyan-400 hover:text-cyan-300">
              ← همه محصولات
            </Link>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs">
              <Sparkles size={14} /> {TRIAL_SHORT} تست رایگان
            </div>
            <div className="mt-5 flex items-center gap-3 justify-center lg:justify-start">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${product.color} text-white flex items-center justify-center`}>
                <Icon size={24} />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">{product.title}</h1>
            </div>
            <p className="mt-4 text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              {product.lead}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start">
              <button
                type="button"
                onClick={startFree}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white font-semibold"
              >
                {TRIAL_CTA}
              </button>
              <Link
                href={product.loginUrl}
                className="px-8 py-3.5 rounded-xl border border-white/15 bg-white/5 text-slate-200 font-medium hover:bg-white/10 transition text-center inline-flex items-center justify-center gap-2"
              >
                <LogIn size={16} />
                {product.loginLabel}
              </Link>
            </div>
          </motion.div>

          {hasShots ? (
            <motion.div {...fadeUp(0.1)} className="relative">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white/5">
                <Image
                  src={shots[slide].src}
                  alt={shots[slide].title}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <span className="text-white font-medium">{shots[slide].title}</span>
                </div>
              </div>
              {shots.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    type="button"
                    aria-label="قبلی"
                    onClick={() => setSlide((s) => (s - 1 + shots.length) % shots.length)}
                    className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"
                  >
                    <ChevronRight size={16} />
                  </button>
                  {shots.map((shot, i) => (
                    <button
                      key={shot.src}
                      type="button"
                      onClick={() => setSlide(i)}
                      className={`h-1.5 rounded-full ${i === slide ? "w-6 bg-fuchsia-500" : "w-1.5 bg-white/20"}`}
                      aria-label={shot.title}
                    />
                  ))}
                  <button
                    type="button"
                    aria-label="بعدی"
                    onClick={() => setSlide((s) => (s + 1) % shots.length)}
                    className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              {...fadeUp(0.1)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 min-h-[240px] flex flex-col justify-center"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${product.color} text-white flex items-center justify-center mb-4`}>
                <Icon size={28} />
              </div>
              <p className="text-slate-300 leading-relaxed">{product.desc}</p>
              <p className="text-slate-500 text-sm mt-3">ورود مستقیم به همین محصول از دکمه ورود.</p>
            </motion.div>
          )}
        </div>
      </section>

      <section className="py-12 md:py-16 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">امکانات {product.title}</h2>
          <ul className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {product.items.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-slate-200"
              >
                <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {hasShots && shots.length > 1 && (
        <section className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 text-center">اسکرین‌شات واقعی</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {shots.map((shot, i) => (
                <button
                  key={shot.src}
                  type="button"
                  onClick={() => setSlide(i)}
                  className={`relative aspect-[4/3] rounded-xl overflow-hidden border ${
                    slide === i ? "border-fuchsia-500" : "border-white/10"
                  }`}
                >
                  <Image src={shot.src} alt={shot.title} fill className="object-cover" unoptimized />
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 text-[11px] text-white px-2 py-1">
                    {shot.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-xl font-bold mb-6 text-center">سایر محصولات</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {others.map((p) => {
              const OtherIcon = ICONS[p.icon];
              return (
                <Link
                  key={p.slug}
                  href={p.href}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-white/20 flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${p.color} text-white flex items-center justify-center shrink-0`}>
                    <OtherIcon size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-white">{p.title}</div>
                    <div className="text-xs text-slate-400 line-clamp-1">{p.desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </LandingChrome>
  );
}
