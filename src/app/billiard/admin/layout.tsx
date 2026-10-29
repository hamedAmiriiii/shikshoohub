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
    return <p className="py-10 text-center">در حال بررسی دسترسی...</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <aside className="card-soft h-fit space-y-1 p-3">
        <div className="mb-2 px-2 text-xs text-felt-600">پنل مدیریت</div>
        {links.map((l) => {
          const href = billiardHref(l.href);
          return (
            <Link
              key={l.href}
              href={href}
              className={`block rounded-md px-3 py-2 text-sm ${
                pathname === href ? "bg-felt-700 text-white" : "hover:bg-felt-100"
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
