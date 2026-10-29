"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/app/lib/billiard/auth";
import { billiardHref } from "@/app/lib/billiardHosts";

const links = [
  { href: "/", label: "خانه" },
  { href: "/tournaments", label: "مسابقات" },
  { href: "/register", label: "ثبت‌نام" },
  { href: "/schedule", label: "برنامه بازی‌ها" },
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

  return (
    <header className="sticky top-0 z-40 border-b border-felt-900/10 bg-[#0b1e16]/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={billiardHref("/")} className="text-lg tracking-tight md:text-xl">
          {brand}
        </Link>
        <button
          className="rounded-md border border-white/20 px-3 py-1 text-sm md:hidden"
          onClick={() => setOpen((v) => !v)}
          type="button"
        >
          منو
        </button>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const href = billiardHref(l.href);
            return (
              <Link
                key={l.href}
                href={href}
                className={`rounded-md px-2.5 py-1.5 text-sm ${
                  pathname === href ? "bg-white/15" : "hover:bg-white/10"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {isStaff && (
            <Link href={billiardHref("/admin")} className="rounded-md bg-cue-500 px-3 py-1.5 text-sm text-felt-950">
              پنل
            </Link>
          )}
          {user ? (
            <>
              <Link href={billiardHref("/me")} className="text-sm text-white/90 hover:underline">
                {user.full_name || user.phone}
              </Link>
              <button type="button" onClick={() => logout()} className="text-sm text-white/70">
                خروج
              </button>
            </>
          ) : (
            <Link href={billiardHref("/login")} className="rounded-md border border-white/30 px-3 py-1.5 text-sm">
              ورود
            </Link>
          )}
        </div>
      </div>
      {open && (
        <div className="border-t border-white/10 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={billiardHref(l.href)}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm hover:bg-white/10"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={user ? billiardHref("/me") : billiardHref("/login")}
              onClick={() => setOpen(false)}
              className="px-2 py-2 text-sm"
            >
              {user ? "پروفایل من" : "ورود"}
            </Link>
            {isStaff && (
              <Link href={billiardHref("/admin")} onClick={() => setOpen(false)} className="px-2 py-2 text-sm">
                پنل مدیریت
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
