"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, statusLabel } from "@/app/lib/billiard/api";
import { useAuth } from "@/app/lib/billiard/auth";

export default function MyMatchesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/billiard/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ data: any[] }>("/me/matches").then((d) => setMatches(d.data || [])).catch(() => {});
  }, [user]);

  if (loading || !user) return <p>در حال بارگذاری...</p>;

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">برنامه بازی‌های من</h1>
      <div className="card-soft divide-y divide-felt-900/5">
        {matches.map((m) => (
          <div key={m.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
            <div>
              <div className="text-xs text-felt-500">{m.tournament?.name} · {m.round_label}</div>
              <div>
                {m.player1?.full_name} vs {m.player2?.full_name}
              </div>
              <div className="text-xs text-felt-500">
                {[m.scheduled_on, m.scheduled_at, m.table?.name].filter(Boolean).join(" · ")}
              </div>
            </div>
            <div>
              {m.score1 ?? "-"} – {m.score2 ?? "-"}
              <div className="text-xs text-felt-500">{statusLabel[m.status] || m.status}</div>
            </div>
          </div>
        ))}
        {!matches.length && <p className="py-6 text-center text-felt-600">بازی‌ای ثبت نشده است.</p>}
      </div>
    </div>
  );
}
