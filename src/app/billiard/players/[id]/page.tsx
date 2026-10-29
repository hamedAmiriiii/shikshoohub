import { notFound } from "next/navigation";
import { apiUrl } from "@/app/lib/billiard/api";

async function getPlayer(id: string) {
  try {
    const res = await fetch(apiUrl(`/players/${id}`), { next: { revalidate: 20 } });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPlayer(id);
  if (!data) notFound();
  const p = data.player;

  return (
    <div className="space-y-8">
      <div className="card-soft flex flex-wrap items-center gap-5">
        <div
          className="h-28 w-28 rounded-2xl bg-felt-200 bg-cover bg-center"
          style={p.photo_url ? { backgroundImage: `url(${p.photo_url})` } : undefined}
        />
        <div>
          <h1 className="font-display text-3xl">{p.full_name}</h1>
          <div className="mt-2 text-sm text-felt-700">
            {[p.club, p.city].filter(Boolean).join(" · ")}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <span>رتبه: {p.rank ?? "—"}</span>
            <span>امتیاز: {p.points ?? "—"}</span>
            <span>برد: {p.wins ?? 0}</span>
            <span>باخت: {p.losses ?? 0}</span>
            <span>درصد برد: {p.win_rate ?? "—"}%</span>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl">آمار مقام‌ها</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="قهرمانی" value={p.titles} />
          <Stat label="نایب‌قهرمانی" value={p.runner_ups} />
          <Stat label="سوم" value={p.thirds} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl">تاریخچه مسابقات</h2>
        <div className="space-y-4">
          {(data.history || []).map((h: any, idx: number) => (
            <div key={idx} className="card-soft">
              <div className="mb-2 flex flex-wrap justify-between gap-2">
                <div className="font-medium">{h.tournament?.name}</div>
                <div className="text-sm text-felt-600">
                  مقام {h.final_place ?? "—"} · {h.points_awarded} امتیاز
                </div>
              </div>
              <div className="divide-y divide-felt-900/5 text-sm">
                {(h.matches || []).map((m: any) => (
                  <div key={m.match_id} className="flex justify-between py-2">
                    <span>
                      {m.round_label}: vs {m.opponent || "—"}
                    </span>
                    <span>
                      {m.result} ({m.score})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="card-soft">
      <div className="text-xs text-felt-600">{label}</div>
      <div className="font-display text-2xl">{value ?? 0}</div>
    </div>
  );
}
