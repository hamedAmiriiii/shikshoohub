"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Mail, Settings } from "lucide-react";
import { useOilAuth } from "./OilAuth";

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

export default function OilShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, ready } = useOilAuth();
  const isLogin = pathname === "/oil/login";
  const isHome = pathname === "/oil";
  const isSms = pathname === "/oil/sms" || pathname?.startsWith("/oil/sms/");
  const shopName = session?.shop?.name || "تعویض روغن";
  const smsBalance = session?.sms?.balance;
  const showSmsBalance = isHome || pathname === "/oil/sms";

  let title = "سوابق ماشین";
  if (pathname?.startsWith("/oil/new")) title = "ثبت تعویض";
  else if (pathname?.startsWith("/oil/settings")) title = "تنظیمات";
  else if (pathname?.startsWith("/oil/sms/packages")) title = "خرید بسته پیامک";
  else if (isSms) title = "پیامک‌ها";

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
    <div className="oil-wrap">
      <header className="oil-header">
        {isHome ? (
          <div style={{ minWidth: 0 }}>
            <h1>{shopName}</h1>
            <p className="oil-sub">لیست مشتری‌ها</p>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <button
              type="button"
              className="oil-icon-btn"
              aria-label="بازگشت"
              onClick={() =>
                router.push(pathname?.startsWith("/oil/sms/") ? "/oil/sms" : "/oil")
              }
            >
              <ArrowRight size={20} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1>{title}</h1>
              <p className="oil-sub">{shopName}</p>
            </div>
          </div>
        )}
        <div className="oil-header-actions">
          {showSmsBalance && typeof smsBalance === "number" && (
            <Link href="/oil/sms" className="oil-sms-chip" aria-label="موجودی پیامک">
              {formatNumber(smsBalance)} پیامک
            </Link>
          )}
          <Link
            href="/oil/sms"
            className={`oil-icon-btn${isSms ? " active" : ""}`}
            aria-label="پیامک‌ها"
          >
            <Mail size={20} />
          </Link>
          <Link href="/oil/settings" className="oil-icon-btn" aria-label="تنظیمات">
            <Settings size={20} />
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
