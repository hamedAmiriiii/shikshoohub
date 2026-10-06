"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  mergeUserWithShopAccess,
  syncShopAccessFromLogin,
} from "@/app/lib/shopAccess";
import { getStoredMarketerRefCode, tryClaimMarketerRef } from "@/app/lib/marketing";
import { getFirstAllowedAdminPath, mergeUserWithShopPermissions } from "@/app/lib/shopPermissions";
import { mergeUserWithShopFeatures, SHOP_FEATURES_CHANGED_EVENT } from "@/app/lib/shopFeatures";

export type MenuCheckoutPlan = {
  slug: "base" | "full_sale" | "v21";
  name: string;
  priceLabel: string;
  description: string;
};

const API_ORIGIN = (process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoo-plus.ir").replace(/\/$/, "");
const CODE_TIMER_SECONDS = 5 * 60;

type Step = "phone" | "register";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function normalizePhone(value: string): string {
  let digits = toLatinDigits(value).replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length === 12) digits = `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith("9")) digits = `0${digits}`;
  return digits;
}

function formatCountdown(seconds: number) {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
}

/** یک فیلد «نام و نام خانوادگی» → name / last_name برای API */
function splitFullName(full: string): { name: string; last_name: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { name: "", last_name: "" };
  if (parts.length === 1) return { name: parts[0], last_name: parts[0] };
  return { name: parts[0], last_name: parts.slice(1).join(" ") };
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  return asRecord(await res.json().catch(() => ({}))) ?? {};
}

type Props = {
  plan: MenuCheckoutPlan | null;
  onClose: () => void;
  onConsult: (planName: string) => void;
};

export default function MenuPlanCheckout({ plan, onClose, onConsult }: Props) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [atelierName, setAtelierName] = useState("");
  const [password, setPassword] = useState("");
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", "", ""]);
  const [codeTimer, setCodeTimer] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!plan) return;
    setStep("phone");
    setError("");
    setCodeDigits(["", "", "", "", ""]);
    setCodeTimer(0);
    try {
      setHasToken(Boolean(localStorage.getItem("token")));
    } catch {
      setHasToken(false);
    }
  }, [plan]);

  useEffect(() => {
    if (codeTimer <= 0) return;
    const id = setInterval(() => setCodeTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [codeTimer]);

  if (!plan) return null;

  const mobile = normalizePhone(phone);
  const phoneOk = /^09\d{9}$/.test(mobile);
  const code = codeDigits.join("");
  const codeOk = code.length === 5;
  const formOk = fullName.trim().length >= 2 && atelierName.trim() && password.length >= 6;
  const codeExpired = step === "register" && codeTimer === 0;

  const focusInput = (idx: number) => {
    inputsRef.current[idx]?.focus();
  };

  const sendCode = async () => {
    if (!phoneOk) {
      setError("شماره موبایل را مثل ۰۹۱۲۳۴۵۶۷۸۹ وارد کنید.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_ORIGIN}/api/auth/register/send-phone-code`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mobile }),
      });
      const json = await readJson(res);
      if (!res.ok) {
        if (res.status === 429) {
          const wait = Number(json.retry_after_seconds) || CODE_TIMER_SECONDS;
          setCodeTimer(wait);
          setError(typeof json.message === "string" ? json.message : `لطفاً ${formatCountdown(wait)} دیگر تلاش کنید.`);
          return;
        }
        setError(typeof json.message === "string" ? json.message : "ارسال کد انجام نشد.");
        return;
      }
      setPhone(mobile);
      setStep("register");
      setCodeTimer(CODE_TIMER_SECONDS);
      setCodeDigits(["", "", "", "", ""]);
      setTimeout(() => focusInput(0), 80);
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setBusy(false);
    }
  };

  const persistSession = async (payload: Record<string, unknown>) => {
    if (!payload.user || typeof payload.token !== "string" || !payload.token) return null;
    localStorage.setItem("token", payload.token);
    const user = mergeUserWithShopFeatures(
      mergeUserWithShopPermissions(
        mergeUserWithShopAccess(payload.user as Record<string, unknown>, payload),
        payload,
      ),
      payload,
    );
    localStorage.setItem("user", JSON.stringify(user));
    setHasToken(true);
    window.dispatchEvent(new CustomEvent(SHOP_FEATURES_CHANGED_EVENT));
    syncShopAccessFromLogin(payload);
    await tryClaimMarketerRef();
    return user;
  };

  const startPayment = async (token: string) => {
    const returnUrl = `${window.location.origin}/landing/menu?payment=ok#pricing`;
    const res = await fetch(`${API_ORIGIN}/api/shop-packages/start`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        package: plan.slug,
        return_url: returnUrl,
        gateway: "zarinpal",
      }),
    });
    const json = await readJson(res);
    if (!res.ok) {
      throw new Error(typeof json.message === "string" ? json.message : "اتصال به درگاه انجام نشد.");
    }
    const url =
      (typeof json.payment_url === "string" && json.payment_url) ||
      (typeof asRecord(json.payment)?.payment_url === "string" &&
        String(asRecord(json.payment)?.payment_url));
    if (!url) throw new Error("آدرس درگاه دریافت نشد.");
    window.location.href = url;
  };

  const submitRegisterAndPay = async () => {
    if (!phoneOk) {
      setError("شماره موبایل معتبر نیست.");
      return;
    }
    if (!formOk) {
      setError("نام، نام مجموعه و رمز عبور (حداقل ۶ کاراکتر) را پر کنید.");
      return;
    }
    if (!codeOk) {
      setError("کد تأیید ۵ رقمی را وارد کنید.");
      return;
    }
    if (codeExpired) {
      setError("زمان اعتبار کد تمام شد. کد جدید بگیرید.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const { name, last_name } = splitFullName(fullName);
      const body: Record<string, unknown> = {
        name,
        last_name,
        type: [2],
        password,
        phone: mobile,
        atelier_name: atelierName.trim(),
        verification_code: code,
      };
      const marketerCode = getStoredMarketerRefCode();
      if (marketerCode) {
        body.marketer_code = marketerCode;
        try {
          const visitorId = localStorage.getItem("wb_visitor_id");
          if (visitorId) body.marketer_visitor_id = visitorId;
        } catch {
          /* ignore */
        }
      }

      const res = await fetch(`${API_ORIGIN}/api/auth/register`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await readJson(res);
      if (!res.ok) {
        setError(typeof json.message === "string" ? json.message : "ثبت‌نام انجام نشد.");
        return;
      }

      await persistSession(json);
      const token = typeof json.token === "string" ? json.token : localStorage.getItem("token");
      if (!token) {
        setError("ثبت‌نام شد اما توکن دریافت نشد. از صفحه ورود وارد شوید.");
        return;
      }

      try {
        await startPayment(token);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "پرداخت شروع نشد.";
        setError(
          `${msg} فروشگاه ثبت شد؛ می‌توانید از دکمهٔ زیر دوباره پرداخت کنید.`,
        );
      }
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setBusy(false);
    }
  };

  const retryPay = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("ابتدا ثبت‌نام را کامل کنید.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await startPayment(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "پرداخت شروع نشد.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-white outline-none focus:border-emerald-400";

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 p-3 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c1520] p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-white text-lg">خرید {plan.name}</h3>
            <p className="text-sm text-slate-400 mt-1 leading-7">
              {plan.priceLabel} — ثبت‌نام و پرداخت آنلاین؛ پنل همان لحظه فعال می‌شود.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white" aria-label="بستن">
            <X size={18} />
          </button>
        </div>

        {step === "phone" ? (
          <div className="space-y-3">
            {hasToken ? (
              <>
                <p className="text-sm text-slate-400 leading-7">
                  با حساب فعلی وارد هستید. می‌توانید همین الان پکیج را بخرید و فعال کنید.
                </p>
                {error ? <p className="text-sm text-rose-300">{error}</p> : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void retryPay()}
                  className="w-full py-3 rounded-xl bg-gradient-to-l from-cyan-500 to-emerald-500 text-white font-bold disabled:opacity-60"
                >
                  {busy ? "در حال اتصال به درگاه…" : "پرداخت و فعال‌سازی"}
                </button>
                <button
                  type="button"
                  onClick={() => setHasToken(false)}
                  className="w-full text-xs text-slate-500 hover:text-emerald-300"
                >
                  ثبت‌نام با شمارهٔ دیگر
                </button>
              </>
            ) : (
              <>
                <label className="block text-sm text-slate-300">
                  شماره موبایل
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    placeholder="09123456789"
                    dir="ltr"
                    autoFocus
                  />
                </label>
                {error ? <p className="text-sm text-rose-300">{error}</p> : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void sendCode()}
                  className="w-full py-3 rounded-xl bg-gradient-to-l from-cyan-500 to-emerald-500 text-white font-bold disabled:opacity-60"
                >
                  {busy ? "…" : "دریافت کد تأیید"}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm text-slate-300">
              نام و نام خانوادگی
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="مثلاً علی رضایی"
                autoComplete="name"
              />
            </label>
            <label className="block text-sm text-slate-300">
              نام مجموعه / رستوران
              <input value={atelierName} onChange={(e) => setAtelierName(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm text-slate-300">
              رمز عبور
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                dir="ltr"
                autoComplete="new-password"
                placeholder="حداقل ۶ کاراکتر"
              />
            </label>

            <div>
              <div className="flex items-center justify-between text-sm text-slate-300 mb-1">
                <span>کد تأیید پیامکی</span>
                <span className="text-xs text-slate-500" dir="ltr">
                  {codeTimer > 0 ? formatCountdown(codeTimer) : "منقضی"}
                </span>
              </div>
              <div className="flex justify-center gap-2 direction-ltr" dir="ltr">
                {codeDigits.map((d, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputsRef.current[idx] = el;
                    }}
                    value={d}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(-1);
                      const next = [...codeDigits];
                      next[idx] = v;
                      setCodeDigits(next);
                      if (v && idx < 4) focusInput(idx + 1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !codeDigits[idx] && idx > 0) focusInput(idx - 1);
                    }}
                    className="w-11 h-12 rounded-xl bg-black/30 border border-white/10 text-center text-lg text-white outline-none focus:border-emerald-400"
                    inputMode="numeric"
                    maxLength={1}
                  />
                ))}
              </div>
              {codeExpired ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void sendCode()}
                  className="mt-2 text-xs text-emerald-300 hover:underline"
                >
                  ارسال مجدد کد
                </button>
              ) : null}
            </div>

            {error ? <p className="text-sm text-rose-300 leading-6">{error}</p> : null}

            <button
              type="button"
              disabled={busy}
              onClick={() => void submitRegisterAndPay()}
              className="w-full py-3 rounded-xl bg-gradient-to-l from-cyan-500 to-emerald-500 text-white font-bold disabled:opacity-60"
            >
              {busy ? "در حال ثبت و اتصال به درگاه…" : "ثبت‌نام و پرداخت"}
            </button>

            {hasToken ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void retryPay()}
                className="w-full py-2.5 rounded-xl border border-white/15 text-sm text-slate-200 hover:border-emerald-400/40 disabled:opacity-60"
              >
                پرداخت مجدد (اگر قبلاً ثبت‌نام کرده‌اید)
              </button>
            ) : null}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            onClose();
            onConsult(plan.name);
          }}
          className="mt-4 w-full text-center text-xs text-slate-500 hover:text-emerald-300"
        >
          ترجیح می‌دهم اول مشاوره بگیرم
        </button>
      </div>
    </div>
  );
}

export function useMenuPaymentReturnNotice() {
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const payment = q.get("payment");
    if (payment === "ok") {
      setNotice("پرداخت موفق بود. پنل شما فعال شد.");
      const token = localStorage.getItem("token");
      const userRaw = localStorage.getItem("user");
      if (token && userRaw) {
        try {
          const user = JSON.parse(userRaw) as Record<string, unknown>;
          const path = getFirstAllowedAdminPath(user);
          window.setTimeout(() => {
            window.location.href = path || "/admin";
          }, 1200);
        } catch {
          /* stay */
        }
      }
    } else if (payment === "failed") {
      setNotice(q.get("message") || "پرداخت انجام نشد یا لغو شد. می‌توانید دوباره از بخش قیمت‌ها اقدام کنید.");
    }
    if (payment) {
      q.delete("payment");
      q.delete("oid");
      q.delete("authority");
      q.delete("message");
      q.delete("type");
      q.delete("item_id");
      q.delete("ref_id");
      const next = `${window.location.pathname}${q.toString() ? `?${q}` : ""}${window.location.hash || "#pricing"}`;
      window.history.replaceState({}, "", next);
    }
  }, []);

  return notice;
}
