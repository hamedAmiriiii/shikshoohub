"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/lib/billiard/auth";
import { billiardHref } from "@/app/lib/billiardHosts";

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
  const brand = process.env.NEXT_PUBLIC_BILLIARD_BRAND_NAME || "هیأت بیلیارد";

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
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1e16]/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href={billiardHref("/")} className="min-w-0 truncate text-base font-semibold tracking-tight sm:text-lg">
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
                  className={`rounded-full px-2.5 py-1.5 text-sm ${active ? "bg-white/15" : "hover:bg-white/10"}`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              {isStaff && (
                <Link href={billiardHref("/admin")} className="rounded-full bg-cue-500 px-3 py-1.5 text-sm text-felt-950">
                  پنل
                </Link>
              )}
              {user ? (
                <Link href={billiardHref("/me")} className="max-w-[120px] truncate text-sm text-white/90">
                  {user.full_name || user.phone}
                </Link>
              ) : (
                <Link href={billiardHref("/login")} className="rounded-full border border-white/30 px-3 py-1.5 text-sm">
                  ورود
                </Link>
              )}
            </div>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-lg lg:hidden"
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
            className="absolute inset-0 bg-black/55"
            aria-label="بستن"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-[#0f241c] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="font-semibold">{brand}</div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15"
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
                      className={`rounded-2xl px-4 py-3.5 text-base ${active ? "bg-white/12 text-cue-400" : "hover:bg-white/8"}`}
                    >
                      {l.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2 border-t border-white/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {isStaff && (
                <Link href={billiardHref("/admin")} className="btn block bg-cue-500 text-center text-felt-950">
                  پنل مدیریت
                </Link>
              )}
              {user ? (
                <>
                  <Link href={billiardHref("/me")} className="btn-secondary block text-center text-felt-950">
                    پروفایل من
                  </Link>
                  <button type="button" className="btn block w-full border border-white/20 text-white" onClick={() => logout()}>
                    خروج
                  </button>
                </>
              ) : (
                <Link href={billiardHref("/login")} className="btn-primary block text-center">
                  ورود / ثبت‌نام
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
