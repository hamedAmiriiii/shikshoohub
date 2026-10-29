"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
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

  useEffect(() => {
    if (!loading && (!user || !isStaff)) router.push(billiardHref("/login"));
  }, [loading, user, isStaff, router]);

  if (loading || !isStaff) {
    return <p className="py-10 text-center text-slate-400">در حال بررسی دسترسی...</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="card-soft h-fit space-y-1 p-3">
        <div className="mb-2 px-2 text-xs font-medium tracking-wide text-cyan-400/90">پنل مدیریت</div>
        {links.map((l) => {
          const href = billiardHref(l.href);
          const active = pathname === href;
          return (
            <Link
              key={l.href}
              href={href}
              className={`block rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/20"
                  : "text-slate-300 hover:bg-white/5 hover:text-cyan-300"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </aside>
      <div>{children}</div>
    </div>
  );
}
