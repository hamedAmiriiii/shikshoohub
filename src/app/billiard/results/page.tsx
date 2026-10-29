import { apiUrl } from "@/app/lib/billiard/api";

async function getResults() {
  try {
    const res = await fetch(apiUrl("/results"), { next: { revalidate: 15 } });
    if (!res.ok) return { data: [] };
    return res.json();
  } catch {
    return { data: [] };
  }
}

export default async function ResultsPage() {
  const data = await getResults();
  return (
    <div>
      <h1 className="mb-2 font-display text-3xl text-slate-100">نتایج</h1>
      <p className="mb-6 text-sm text-slate-400">آخرین اسکورهای ثبت‌شده</p>
      <div className="card-soft divide-y divide-white/10">
        {(data.data || []).map((m: any) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-sm">
            <div>
              <div className="text-xs text-slate-500">
                {m.tournament?.name} · {m.round_label}
              </div>
              <div className="text-slate-100">
                {m.player1?.full_name} vs {m.player2?.full_name}
              </div>
            </div>
            <div className="font-display text-lg text-cyan-300">
              {m.score1} – {m.score2}
            </div>
          </div>
        ))}
        {!data.data?.length && <p className="py-6 text-center text-slate-500">نتیجه‌ای نیست.</p>}
      </div>
    </div>
  );
}
