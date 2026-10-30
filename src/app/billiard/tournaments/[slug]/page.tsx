import Link from "next/link";
import { notFound } from "next/navigation";
import { apiUrl, formatToman, statusLabel } from "@/app/lib/billiard/api";

async function getTournament(slug: string) {
  try {
    const res = await fetch(apiUrl(`/tournaments/${slug}`), { next: { revalidate: 15 } });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function TournamentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab = "intro" } = await searchParams;
  const data = await getTournament(slug);
  if (!data) notFound();

  const t = data.tournament;
  const tabs = [
    { id: "intro", label: "معرفی" },
    { id: "players", label: "بازیکنان" },
    { id: "bracket", label: "جدول" },
    { id: "schedule", label: "برنامه" },
    { id: "results", label: "نتایج" },
    { id: "rules", label: "قوانین" },
    { id: "stats", label: "آمار" },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#121826] text-white">
        <div
          className="relative min-h-[240px] bg-cover bg-center p-6 md:p-10"
          style={
            t.poster_url
              ? {
                  backgroundImage: `linear-gradient(rgba(11,15,26,.72),rgba(11,15,26,.92)),url(${t.poster_url})`,
                }
              : {
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, rgba(34,211,238,.2), transparent 40%), radial-gradient(circle at 80% 60%, rgba(192,38,211,.18), transparent 35%), linear-gradient(135deg, #121826, #0b0f1a)",
                }
          }
        >
          <div className="text-sm text-cyan-300">{t.discipline?.name}</div>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">{t.name}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300/90">
            <span>{statusLabel[t.status] || t.status}</span>
            {t.starts_on && <span>{t.starts_on}</span>}
            {t.venue && <span>{t.venue}</span>}
            <span>{formatToman(t.fee_toman || 0)}</span>
          </div>
          {(t.status === "registration_open" || t.status === "pre_registration") && (
            <Link
              href={`/billiard/register?tournament=${t.slug}`}
              className="mt-6 inline-flex rounded-xl bg-gradient-to-l from-violet-600 via-fuchsia-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xl shadow-fuchsia-900/40 transition hover:opacity-90"
            >
              ثبت‌نام در این مسابقه
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tb) => (
          <Link
            key={tb.id}
            href={`/billiard/tournaments/${slug}?tab=${tb.id}`}
            className={`rounded-xl px-3.5 py-1.5 text-sm transition ${
              tab === tb.id
                ? "bg-gradient-to-l from-cyan-500 to-violet-600 text-white"
                : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {tb.label}
          </Link>
        ))}
      </div>

      {tab === "intro" && (
        <div className="card-soft prose prose-sm max-w-none whitespace-pre-wrap text-slate-300">
          {t.description || "توضیحی ثبت نشده است."}
        </div>
      )}
      {tab === "rules" && (
        <div className="card-soft whitespace-pre-wrap text-sm text-slate-300">
          {t.rules || "قوانین ثبت نشده است."}
        </div>
      )}
      {tab === "players" && (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {(data.players || []).map((r: any) => (
            <Link
              key={r.id}
              href={`/billiard/players/${r.player_id}`}
              className="card-soft flex items-center gap-3 transition hover:border-cyan-400/30"
            >
              <div
                className="h-12 w-12 rounded-full border border-white/10 bg-white/10 bg-cover bg-center"
                style={r.player?.photo_url ? { backgroundImage: `url(${r.player.photo_url})` } : undefined}
              />
              <div>
                <div className="font-medium text-slate-100">{r.player?.full_name}</div>
                <div className="text-xs text-slate-500">{r.player?.city || r.player?.club}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {(tab === "bracket" || tab === "schedule" || tab === "results") && (
        <MatchesList
          matches={
            tab === "results" ? data.results : tab === "schedule" ? data.schedule : data.bracket
          }
        />
      )}
      {tab === "stats" && (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {Object.entries(data.stats || {}).map(([k, v]) => (
            <div key={k} className="card-soft">
              <div className="text-xs text-slate-500">{k}</div>
              <div className="font-display text-2xl text-cyan-300">{String(v)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function playerSlotLabel(m: any, side: 1 | 2) {
  const p = side === 1 ? m.player1 : m.player2;
  const src = side === 1 ? m.player1_source : m.player2_source;
  if (p?.full_name) return p.full_name;
  if (src?.label) return src.label;
  return "TBD";
}

function MatchesList({ matches }: { matches: any[] }) {
  if (!matches?.length) return <p className="text-sm text-slate-500">موردی نیست.</p>;
  return (
    <div className="card-soft divide-y divide-white/10">
      {matches.map((m) => (
        <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-sm">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/15 px-2 text-sm font-bold text-fuchsia-300">
              {m.match_no ?? m.id}
            </span>
            <div className="min-w-0">
              <div className="text-xs text-slate-500">
                بازی {m.match_no ?? m.id}
                {m.round_label ? ` · ${m.round_label}` : ""}
              </div>
              <div className="text-slate-100">
                {playerSlotLabel(m, 1)} vs {playerSlotLabel(m, 2)}
              </div>
              <div className="text-xs text-slate-500">
                {[m.scheduled_on, m.scheduled_at, m.table?.name].filter(Boolean).join(" · ") || "— – —"}
              </div>
            </div>
          </div>
          <div className="text-left">
            <div className="font-display text-cyan-300">
              {m.score1 ?? "-"} – {m.score2 ?? "-"}
            </div>
            <div className="text-xs text-slate-500">{statusLabel[m.status] || m.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
