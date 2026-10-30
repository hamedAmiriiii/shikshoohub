"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/lib/billiard/auth";
import { billiardHref } from "@/app/lib/billiardHosts";

const links = [
  { href: "/admin", label: "داشبورد" },
  { href: "/admin/disciplines", label: "رشته‌ها" },
  { href: "/admin/players", label: "بازیکنان" },
  { href: "/admin/tournaments", label: "مسابقات" },
  { href: "/admin/registrations", label: "ثبت‌نام‌ها" },
  { href: "/admin/news", label: "اخبار" },
  { href: "/admin/ranking", label: "رنکینگ" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isStaff } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isStaff)) router.push(billiardHref("/login"));
  }, [loading, user, isStaff, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (loading || !isStaff) {
    return <p className="py-10 text-center text-slate-400">در حال بررسی دسترسی...</p>;
  }

  return (
    <div className="relative w-[min(100vw-1.5rem,1600px)] max-w-none min-w-0 space-y-4 md:w-[min(100vw-2rem,1600px)] md:relative md:left-1/2 md:-translate-x-1/2">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0f1a]/95 px-1 py-2.5 backdrop-blur sm:rounded-2xl sm:border sm:border-white/10 sm:bg-[#121826]/90 sm:px-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-cyan-300">پنل مدیریت</div>
          <button
            type="button"
            aria-label="منوی مدیریت"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
          >
            {menuOpen ? (
              <span className="text-lg leading-none">×</span>
            ) : (
              <span className="flex w-5 flex-col gap-1.5" aria-hidden>
                <span className="h-0.5 w-full rounded bg-current" />
                <span className="h-0.5 w-full rounded bg-current" />
                <span className="h-0.5 w-full rounded bg-current" />
              </span>
            )}
          </button>
        </div>

        {menuOpen && (
          <nav className="mt-3 grid gap-1 border-t border-white/10 pt-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {links.map((l) => {
              const href = billiardHref(l.href);
              const active = pathname === href || (l.href !== "/admin" && pathname.startsWith(href));
              return (
                <Link
                  key={l.href}
                  href={href}
                  className={`rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/20"
                      : "text-slate-300 hover:bg-white/5 hover:text-cyan-300"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      <div className="min-w-0 w-full">{children}</div>
    </div>
  );
}
