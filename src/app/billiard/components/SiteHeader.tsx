"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/lib/billiard/auth";
import { billiardHref } from "@/app/lib/billiardHosts";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";

const links = [
  { href: "/", label: "خانه" },
  { href: "/tournaments", label: "مسابقات" },
  { href: "/register", label: "ثبت‌نام" },
  { href: "/schedule", label: "برنامه" },
  { href: "/results", label: "نتایج" },
  { href: "/ranking", label: "رنکینگ" },
  { href: "/players", label: "بازیکنان" },
  { href: "/archive", label: "آرشیو" },
  { href: "/news", label: "اخبار" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, isStaff, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const brand = process.env.NEXT_PUBLIC_BILLIARD_BRAND_NAME || "هیأت بیلیارد شهرستان کرمان";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0f1a]/80 text-slate-100 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 h-16">
          <Link
            href={billiardHref("/")}
            className="min-w-0 truncate text-lg font-bold tracking-tight bg-gradient-to-l from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent sm:text-xl"
          >
            {brand}
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) => {
              const href = billiardHref(l.href);
              const active = pathname === href || (l.href !== "/" && pathname?.startsWith(href));
              return (
                <Link
                  key={l.href}
                  href={href}
                  className={`rounded-xl px-2.5 py-1.5 text-sm transition ${
                    active
                      ? "bg-white/10 text-cyan-300"
                      : "text-slate-300 hover:bg-white/5 hover:text-cyan-300"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              {isStaff && (
                <BilliardButton href={billiardHref("/admin")} sx={{ minHeight: 36, px: 1.5 }}>
                  پنل
                </BilliardButton>
              )}
              {user ? (
                <Link
                  href={billiardHref("/me")}
                  className="max-w-[120px] truncate text-sm text-slate-300 hover:text-cyan-300 transition"
                >
                  {user.full_name || user.phone}
                </Link>
              ) : (
                <BilliardButton href={billiardHref("/login")} variant="secondary" sx={{ minHeight: 36, px: 1.5 }}>
                  ورود
                </BilliardButton>
              )}
            </div>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-lg lg:hidden"
              onClick={() => setOpen(true)}
              type="button"
              aria-label="منو"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="بستن"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col border-l border-white/10 bg-[#0b0f1a] text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="font-bold bg-gradient-to-l from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
                {brand}
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="grid gap-1">
                {links.map((l) => {
                  const href = billiardHref(l.href);
                  const active = pathname === href || (l.href !== "/" && pathname?.startsWith(href));
                  return (
                    <Link
                      key={l.href}
                      href={href}
                      className={`rounded-2xl px-4 py-3.5 text-base transition ${
                        active
                          ? "bg-white/10 text-cyan-300"
                          : "text-slate-300 hover:bg-white/5"
                      }`}
                    >
                      {l.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2 border-t border-white/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {isStaff && (
                <BilliardButton href={billiardHref("/admin")} fullWidth>
                  پنل مدیریت
                </BilliardButton>
              )}
              {user ? (
                <>
                  <BilliardButton href={billiardHref("/me")} variant="secondary" fullWidth>
                    پروفایل من
                  </BilliardButton>
                  <BilliardButton type="button" variant="ghost" fullWidth onClick={() => logout()}>
                    خروج
                  </BilliardButton>
                </>
              ) : (
                <BilliardButton href={billiardHref("/login")} fullWidth>
                  ورود / ثبت‌نام
                </BilliardButton>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
