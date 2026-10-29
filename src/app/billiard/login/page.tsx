"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, type ApiError } from "@/app/lib/billiard/api";
import { useAuth } from "@/app/lib/billiard/auth";

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
      router.push(data.user.profile_complete ? "/billiard/me" : "/billiard/me?edit=1");
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-soft mx-auto max-w-md">
      <h1 className="mb-4 font-display text-2xl">ورود با موبایل</h1>
      {step === "phone" ? (
        <form onSubmit={sendCode} className="space-y-3">
          <label className="label">شماره موبایل</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxxx" />
          <button className="btn-primary w-full" disabled={loading} type="submit">
            دریافت کد
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <label className="label">کد تأیید</label>
          <input className="input" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn-primary w-full" disabled={loading} type="submit">
            ورود
          </button>
          <button type="button" className="btn-secondary w-full" onClick={() => setStep("phone")}>
            تغییر شماره
          </button>
        </form>
      )}
      {msg && <p className="mt-3 text-sm text-felt-700">{msg}</p>}
    </div>
  );
}
