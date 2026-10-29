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
      <h1 className="mb-6 font-display text-3xl">نتایج</h1>
      <div className="card-soft divide-y divide-felt-900/5">
        {(data.data || []).map((m: any) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <div>
              <div className="text-xs text-felt-500">{m.tournament?.name} · {m.round_label}</div>
              <div>
                {m.player1?.full_name} vs {m.player2?.full_name}
              </div>
            </div>
            <div className="font-display text-lg">
              {m.score1} – {m.score2}
            </div>
          </div>
        ))}
        {!data.data?.length && <p className="py-6 text-center text-felt-600">نتیجه‌ای نیست.</p>}
      </div>
    </div>
  );
}
