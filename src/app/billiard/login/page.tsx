"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, type ApiError } from "@/app/lib/billiard/api";
import { useAuth } from "@/app/lib/billiard/auth";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";

export default function LoginPage() {
  const { loginWithToken } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      await apiFetch("/auth/send-code", {
        method: "POST",
        body: JSON.stringify({ phone }),
        auth: false,
      });
      setStep("code");
      setMsg("کد ارسال شد.");
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const data = await apiFetch<{ token: string; user: any }>("/auth/verify", {
        method: "POST",
        body: JSON.stringify({ phone, code }),
        auth: false,
      });
      loginWithToken(data.token, data.user);
      const clerkOnly =
        data.user.role !== "admin" &&
        data.user.role !== "operator" &&
        (data.user.results_tournaments?.length || 0) > 0;
      router.push(
        clerkOnly ? "/billiard/results-desk" : data.user.profile_complete ? "/billiard/me" : "/billiard/me?edit=1",
      );
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 text-center">
        <p className="text-sm text-cyan-400">ورود امن</p>
        <h1 className="mt-1 font-display text-3xl text-slate-100">ورود با موبایل</h1>
        <p className="mt-2 text-sm text-slate-400">کد یکبارمصرف به شماره شما ارسال می‌شود</p>
      </div>
      <div className="card-soft">
        {step === "phone" ? (
          <form onSubmit={sendCode} className="space-y-3">
            <label className="label">شماره موبایل</label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxxx"
              inputMode="tel"
            />
            <BilliardButton type="submit" fullWidth loading={loading}>
              دریافت کد
            </BilliardButton>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-3">
            <label className="label">کد تأیید</label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
            />
            <BilliardButton type="submit" fullWidth loading={loading}>
              ورود
            </BilliardButton>
            <BilliardButton
              type="button"
              variant="secondary"
              fullWidth
              disabled={loading}
              onClick={() => setStep("phone")}
            >
              تغییر شماره
            </BilliardButton>
          </form>
        )}
        {msg && <p className="mt-3 text-sm text-cyan-300">{msg}</p>}
      </div>
    </div>
  );
}
