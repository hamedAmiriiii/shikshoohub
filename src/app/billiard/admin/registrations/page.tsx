"use client";

import { useEffect, useState } from "react";
import { apiFetch, isRegistrationSettled, paymentStatusLabel, statusLabel, type ApiError } from "@/app/lib/billiard/api";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";

export default function AdminRegistrationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const data = await apiFetch<{ data: any[] }>("/admin/registrations");
    setItems(data.data || []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function act(id: number, action: "confirm" | "reject") {
    setBusyKey(`${action}-${id}`);
    setMsg("");
    try {
      await apiFetch(`/admin/registrations/${id}/${action}`, { method: "POST" });
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl text-slate-100">ثبت‌نام‌ها</h1>
      <p className="mb-6 text-sm text-slate-400">
        تا قبل از پرداخت، بازیکن در مسابقه قطعی نیست. فقط پرداخت‌شده‌ها قابل تأیید هستند.
      </p>
      {msg && <p className="mb-3 text-sm text-amber-300">{msg}</p>}
      <div className="card-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-right text-slate-500">
              <th className="py-2 font-medium">بازیکن</th>
              <th className="font-medium">مسابقه</th>
              <th className="font-medium">وضعیت</th>
              <th className="font-medium">پرداخت</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => {
              const settled = isRegistrationSettled(r);
              return (
                <tr key={r.id} className="border-b border-white/5 text-slate-200">
                  <td className="py-2.5">{r.player?.full_name}</td>
                  <td>{r.tournament?.name}</td>
                  <td>{!settled ? "پیش‌نویس (پرداخت نشده)" : statusLabel[r.status] || r.status}</td>
                  <td className={!settled ? "text-amber-300" : "text-cyan-300"}>
                    {paymentStatusLabel[r.payment_status] || r.payment_status}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {settled && r.status === "pending" && (
                        <>
                          <BilliardButton
                            type="button"
                            variant="secondary"
                            loading={busyKey === `confirm-${r.id}`}
                            disabled={busyKey !== null && busyKey !== `confirm-${r.id}`}
                            onClick={() => act(r.id, "confirm")}
                          >
                            تأیید
                          </BilliardButton>
                          <BilliardButton
                            type="button"
                            variant="danger"
                            loading={busyKey === `reject-${r.id}`}
                            disabled={busyKey !== null && busyKey !== `reject-${r.id}`}
                            onClick={() => act(r.id, "reject")}
                          >
                            رد
                          </BilliardButton>
                        </>
                      )}
                      {!settled && <span className="text-xs text-slate-500">در انتظار پرداخت کاربر</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!items.length && <p className="py-6 text-center text-slate-500">ثبت‌نامی نیست.</p>}
      </div>
    </div>
  );
}
