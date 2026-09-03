"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Droplets,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { oilListProducts, oilLogout } from "@/app/lib/oil/api";
import { useOilAuth } from "./OilAuth";
import { OilInstallButton } from "./OilInstall";
import { OilOfflineIcon } from "./OilOffline";

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

const MENU_ITEMS = [
  { href: "/oil", label: "داشبورد", icon: LayoutDashboard },
  { href: "/oil/products", label: "محصولات", icon: Package },
  { href: "/oil/reports", label: "گزارش", icon: TrendingUp },
  { href: "/oil/customers", label: "مشتریان", icon: Users },
  { href: "/oil/sms", label: "پیامک‌ها", icon: Mail },
  { href: "/oil/sms/packages", label: "خرید بسته پیامک", icon: ShoppingBag },
  { href: "/oil/settings", label: "تنظیمات", icon: Settings },
];

function isMenuActive(href: string, pathname: string | null) {
  if (!pathname) return false;
  if (href === "/oil") return pathname === "/oil";
  if (href === "/oil/customers") {
    return pathname === "/oil/customers" || pathname.startsWith("/oil/car/");
  }
  if (href === "/oil/sms") {
    return pathname === "/oil/sms";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function backTarget(pathname: string | null) {
  if (pathname?.startsWith("/oil/sms/")) return "/oil/sms";
  if (pathname?.startsWith("/oil/car/")) return "/oil/customers";
  return "/oil";
}

export default function OilShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, ready, logoutLocal } = useOilAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isLogin = pathname === "/oil/login";
  const isHome = pathname === "/oil";
  const shopName = session?.shop?.name || "تعویض روغن";
  const smsBalance = session?.sms?.balance;
  const userName = session?.user?.name || "";
  const accessOk = session?.shop_access?.shop_access_active !== false;
  const accessDays = session?.shop_access?.shop_access_days_remaining;

  let title = "سوابق ماشین";
  if (isHome) title = "داشبورد";
  else if (pathname?.startsWith("/oil/customers")) title = "مشتریان";
  else if (pathname?.startsWith("/oil/new")) title = "ثبت تعویض";
  else if (pathname?.startsWith("/oil/products")) title = "محصولات";
  else if (pathname?.startsWith("/oil/reports")) title = "گزارش";
  else if (pathname?.startsWith("/oil/settings")) title = "تنظیمات";
  else if (pathname?.startsWith("/oil/sms/packages")) title = "خرید بسته پیامک";
  else if (pathname === "/oil/sms" || pathname?.startsWith("/oil/sms/")) {
    title = "پیامک‌ها";
  }

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!session) return;
    void oilListProducts(false);
  }, [session]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await oilLogout();
    logoutLocal();
    router.replace("/oil/login");
  };

  if (isLogin) {
    return <div className="oil-wrap">{children}</div>;
  }

  if (!ready) {
    return (
      <div className="oil-wrap">
        <div className="oil-empty">در حال بارگذاری…</div>
      </div>
    );
  }

  return (
    <div className={`oil-wrap${isHome ? " oil-wrap-home" : ""}`}>
      <header className="oil-header">
        <div className="oil-header-start">
          <button
            type="button"
            className="oil-icon-btn"
            aria-label="منو"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
          {!isHome && (
            <button
              type="button"
              className="oil-icon-btn"
              aria-label="بازگشت"
              onClick={() => router.push(backTarget(pathname))}
            >
              <ArrowRight size={20} />
            </button>
          )}
          <div style={{ minWidth: 0 }}>
            <h1>{title}</h1>
            <p className="oil-sub">{shopName}</p>
          </div>
        </div>
        <OilOfflineIcon />
      </header>
      {children}

      {menuOpen && (
        <button
          type="button"
          className="oil-drawer-backdrop"
          aria-label="بستن منو"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`oil-drawer${menuOpen ? " open" : ""}`} aria-hidden={!menuOpen}>
        <div className="oil-drawer-head">
          <div className="oil-drawer-brand">
            <span className="oil-drawer-logo">
              <Droplets size={18} />
            </span>
            <div style={{ minWidth: 0 }}>
              <strong>{shopName}</strong>
              {userName ? <p className="oil-muted">{userName}</p> : null}
            </div>
          </div>
          <button
            type="button"
            className="oil-icon-btn"
            aria-label="بستن منو"
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="oil-drawer-stats">
          {typeof smsBalance === "number" ? (
            <Link href="/oil/sms" className="oil-drawer-stat" onClick={() => setMenuOpen(false)}>
              <small>پیامک</small>
              <strong>{formatNumber(smsBalance)}</strong>
            </Link>
          ) : (
            <span className="oil-drawer-stat">
              <small>پیامک</small>
              <strong>—</strong>
            </span>
          )}
          <span className={`oil-drawer-stat${accessOk ? "" : " warn"}`}>
            <small>دسترسی</small>
            <strong>
              {accessOk
                ? accessDays != null
                  ? `${formatNumber(accessDays)} روز`
                  : "فعال"
                : "تمام"}
            </strong>
          </span>
        </div>

        <nav className="oil-drawer-nav">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isMenuActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`oil-nav-item${active ? " active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <OilInstallButton variant="menu" />

        <button type="button" className="oil-nav-item oil-nav-logout" onClick={() => void handleLogout()}>
          <LogOut size={18} />
          خروج
        </button>
      </aside>
    </div>
  );
}
