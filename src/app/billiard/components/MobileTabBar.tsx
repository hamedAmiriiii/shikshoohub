"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { billiardHref } from "@/app/lib/billiardHosts";
import { useAuth } from "@/app/lib/billiard/auth";
import { useClerkOnly } from "@/app/billiard/components/ClerkGate";

const tabs = [
  { href: "/", label: "خانه", icon: "⌂" },
  { href: "/tournaments", label: "مسابقات", icon: "◎" },
  { href: "/news", label: "اخبار", icon: "✦" },
  { href: "/ranking", label: "رنکینگ", icon: "▲" },
  { href: "/me", label: "من", icon: "☺", auth: true },
];

export function MobileTabBar() {
  const pathname = usePathname() || "";
  const { user } = useAuth();
  const { clerkOnly } = useClerkOnly();

  if (clerkOnly || pathname.startsWith("/billiard/admin") || pathname.startsWith("/admin")) return null;

  return (
    <nav className="billiard-tabbar fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0b0f1a]/92 text-white backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)] pt-1">
        {tabs.map((tab) => {
          const target =
            tab.auth && !user ? billiardHref("/login") : billiardHref(tab.href);
          const active =
            tab.href === "/"
              ? pathname === "/billiard" || pathname === "/billiard/"
              : pathname === billiardHref(tab.href) ||
                pathname.startsWith(`${billiardHref(tab.href)}/`);
          return (
            <Link
              key={tab.href}
              href={target}
              className={`flex min-h-[58px] flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] transition ${
                active ? "text-cyan-300" : "text-slate-400"
              }`}
            >
              <span
                className={`text-lg leading-none ${
                  active
                    ? "bg-gradient-to-l from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent"
                    : ""
                }`}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
