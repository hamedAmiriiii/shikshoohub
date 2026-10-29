"use client";

import { useEffect, useState } from "react";
import { apiFetch, statusLabel } from "@/app/lib/billiard/api";

export default function AdminRegistrationsPage() {
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    const data = await apiFetch<{ data: any[] }>("/admin/registrations");
    setItems(data.data || []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">ثبت‌نام‌ها</h1>
      <div className="card-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-right text-felt-600">
              <th className="py-2">بازیکن</th>
              <th>مسابقه</th>
              <th>وضعیت</th>
              <th>پرداخت</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-b border-felt-900/5">
                <td className="py-2">{r.player?.full_name}</td>
                <td>{r.tournament?.name}</td>
                <td>{statusLabel[r.status] || r.status}</td>
                <td>{statusLabel[r.payment_status] || r.payment_status}</td>
                <td className="space-x-2 space-x-reverse">
                  {r.status === "pending" && (
                    <>
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={async () => {
                          await apiFetch(`/admin/registrations/${r.id}/confirm`, { method: "POST" });
                          await load();
                        }}
                      >
                        تأیید
                      </button>
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={async () => {
                          await apiFetch(`/admin/registrations/${r.id}/reject`, { method: "POST" });
                          await load();
                        }}
                      >
                        رد
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
