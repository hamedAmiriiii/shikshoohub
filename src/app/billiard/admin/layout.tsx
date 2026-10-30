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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading || !isStaff) {
    return <p className="py-10 text-center text-slate-400">در حال بررسی دسترسی...</p>;
  }

  return (
    <div className="w-full min-w-0">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          aria-label="منوی مدیریت"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-lg text-slate-100 hover:bg-white/10"
        >
          ☰
        </button>
        <span className="text-sm font-medium text-cyan-300">پنل مدیریت</span>
      </div>

      <div className={`fixed inset-0 z-[80] ${menuOpen ? "" : "pointer-events-none"}`}>
        <button
          type="button"
          aria-label="بستن منو"
          tabIndex={menuOpen ? 0 : -1}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 right-0 flex h-full w-72 max-w-[86vw] flex-col border-l border-white/10 bg-[#121826] text-slate-100 shadow-2xl transition-transform duration-200 ease-out ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div className="font-medium text-cyan-300">پنل مدیریت</div>
            <button
              type="button"
              aria-label="بستن"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5"
              onClick={() => setMenuOpen(false)}
            >
              ✕
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-3">
            <div className="grid gap-1">
              {links.map((l) => {
                const href = billiardHref(l.href);
                const active = pathname === href || (l.href !== "/admin" && pathname.startsWith(href));
                return (
                  <Link
                    key={l.href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-2xl px-4 py-3.5 text-base transition ${
                      active
                        ? "bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white"
                        : "text-slate-300 hover:bg-white/5 hover:text-cyan-300"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>
      </div>

      <div className="min-w-0 w-full">{children}</div>
    </div>
  );
}
