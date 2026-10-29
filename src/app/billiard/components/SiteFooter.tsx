import Link from "next/link";
import { billiardHref } from "@/app/lib/billiardHosts";

export function SiteFooter() {
  const brand = process.env.NEXT_PUBLIC_BILLIARD_BRAND_NAME || "هیأت بیلیارد شهرستان کرمان";
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#090d19]/80 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="text-lg font-bold bg-gradient-to-l from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
            {brand}
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            سامانه مدیریت مسابقات، جدول، رنکینگ و آرشیو هیأت — با تجربه وبینو.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 text-sm">
          <Link href={billiardHref("/about")} className="hover:text-cyan-400 transition">
            درباره هیأت
          </Link>
          <Link href={billiardHref("/contact")} className="hover:text-cyan-400 transition">
            تماس با ما
          </Link>
          <Link href={billiardHref("/news")} className="hover:text-cyan-400 transition">
            اخبار و اطلاعیه‌ها
          </Link>
        </div>
        <div className="text-sm text-slate-500">
          <div>دامنه: billiard.webinoplus.ir</div>
          <div className="mt-2 text-xs">قدرت‌گرفته از وبینو</div>
        </div>
      </div>
    </footer>
  );
}
