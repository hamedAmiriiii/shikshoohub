"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import {
  isOilApiError,
  oilLogin,
  oilRegister,
  oilSendRegisterCode,
} from "@/app/lib/oil/api";
import { toEnglishDigits } from "@/app/lib/oil/plate";
import { useOilAuth } from "../OilAuth";

type Mode = "login" | "register";

function parsePhone(value: string) {
  return toEnglishDigits(value).replace(/\D/g, "").slice(0, 11);
}

export default function OilLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useOilAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [intervalKm, setIntervalKm] = useState("5000");
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const isPhoneValid = phone.length === 11 && phone.startsWith("09");
  const code = codeDigits.join("");
  const nextPath = searchParams.get("next") || "/oil";

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const goHome = () => {
    router.replace(nextPath.startsWith("/oil") ? nextPath : "/oil");
  };

  const handleLogin = async () => {
    if (!isPhoneValid || !password) {
      toast.error("شماره و رمز را وارد کنید");
      return;
    }
    setLoading(true);
    try {
      const res = await oilLogin(phone, password);
      if (isOilApiError(res)) {
        if (res.statusCode === 403 && /فروشگاه|\/admin/.test(res.message)) {
          toast.error(
            <span>
              {res.message}{" "}
              <a
                href="/admin/login"
                style={{ color: "#fff", fontWeight: 800, textDecoration: "underline" }}
              >
                ورود فروشگاه
              </a>
            </span>,
          );
          return;
        }
        toast.error(res.message);
        return;
      }
      if (!res.token) {
        toast.error("ورود ناموفق بود");
        return;
      }
      setSession(res, res.token);
      toast.success("خوش آمدید");
      goHome();
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!isPhoneValid) {
      toast.error("شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود");
      return;
    }
    setLoading(true);
    try {
      const res = await oilSendRegisterCode(phone);
      if (isOilApiError(res)) {
        if (res.statusCode === 429 && res.retry_after_seconds) {
          setResendTimer(res.retry_after_seconds);
        }
        toast.error(res.message);
        return;
      }
      setCodeSent(true);
      setResendTimer(90);
      toast.success("کد ۵ رقمی ارسال شد");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !lastName || !shopName || !password || code.length !== 5) {
      toast.error("همه فیلدهای لازم را پر کنید");
      return;
    }
    const km = Number(toEnglishDigits(intervalKm).replace(/\D/g, ""));
    setLoading(true);
    try {
      const res = await oilRegister({
        name,
        last_name: lastName,
        phone,
        password,
        shop_name: shopName,
        address: address || undefined,
        verification_code: code,
        oil_interval_km: Number.isFinite(km) && km > 0 ? km : undefined,
      });
      if (isOilApiError(res)) {
        toast.error(res.message);
        return;
      }
      if (!res.token) {
        toast.error("ثبت‌نام ناموفق بود");
        return;
      }
      setSession(res, res.token);
      toast.success("حساب ساخته شد");
      goHome();
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string, idx: number) => {
    const digit = toEnglishDigits(value).replace(/\D/g, "").slice(-1);
    const next = [...codeDigits];
    next[idx] = digit;
    setCodeDigits(next);
    if (digit && idx < 4) inputsRef.current[idx + 1]?.focus();
  };

  return (
    <div className="oil-page" style={{ paddingTop: 48 }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 26 }}>تعویض روغن</h1>
      <p className="oil-muted" style={{ marginBottom: 20 }}>
        ورود جدا از پنل فروشگاه وبینو است. بعد از ورود به همین مسیر برمی‌گردید.
      </p>

      <div className="oil-tabs">
        <button
          type="button"
          className={`oil-tab ${mode === "login" ? "active" : ""}`}
          onClick={() => setMode("login")}
        >
          ورود
        </button>
        <button
          type="button"
          className={`oil-tab ${mode === "register" ? "active" : ""}`}
          onClick={() => setMode("register")}
        >
          ثبت‌نام
        </button>
      </div>

      <div className="oil-field">
        <label>موبایل</label>
        <input
          dir="ltr"
          inputMode="numeric"
          placeholder="09121234567"
          value={phone}
          onChange={(e) => setPhone(parsePhone(e.target.value))}
        />
      </div>

      {mode === "login" ? (
        <>
          <div className="oil-field">
            <label>رمز عبور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="oil-btn oil-btn-primary"
            disabled={loading}
            onClick={handleLogin}
          >
            {loading ? "در حال ورود…" : "ورود"}
          </button>
        </>
      ) : (
        <>
          <div className="oil-field">
            <label>نام</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="oil-field">
            <label>نام خانوادگی</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="oil-field">
            <label>نام مغازه</label>
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="تعویض روغن برادران"
            />
          </div>
          <div className="oil-field">
            <label>آدرس (اختیاری)</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="oil-field">
            <label>فاصله تعویض بعدی (کیلومتر)</label>
            <input
              dir="ltr"
              inputMode="numeric"
              value={intervalKm}
              onChange={(e) =>
                setIntervalKm(toEnglishDigits(e.target.value).replace(/\D/g, "").slice(0, 5))
              }
            />
          </div>
          <div className="oil-field">
            <label>رمز عبور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="oil-btn oil-btn-ghost"
            style={{ marginBottom: 12 }}
            disabled={loading || !isPhoneValid || resendTimer > 0}
            onClick={handleSendCode}
          >
            {resendTimer > 0
              ? `ارسال مجدد تا ${resendTimer} ثانیه`
              : codeSent
                ? "ارسال دوباره کد"
                : "ارسال کد پیامکی"}
          </button>

          {codeSent && (
            <>
              <p className="oil-muted" style={{ textAlign: "center" }}>
                کد ۵ رقمی پیامک‌شده را وارد کنید
              </p>
              <div className="oil-code-row" style={{ marginBottom: 16 }}>
                {codeDigits.map((d, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputsRef.current[idx] = el;
                    }}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleCodeChange(e.target.value, idx)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !codeDigits[idx] && idx > 0) {
                        inputsRef.current[idx - 1]?.focus();
                      }
                    }}
                  />
                ))}
              </div>
            </>
          )}

          <button
            type="button"
            className="oil-btn oil-btn-primary"
            disabled={loading}
            onClick={handleRegister}
          >
            {loading ? "در حال ثبت…" : "ساخت حساب"}
          </button>
        </>
      )}
    </div>
  );
}
