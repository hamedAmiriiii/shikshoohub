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
      <div className="overflow-hidden rounded-3xl bg-felt-950 text-white">
        <div
          className="min-h-[220px] bg-cover bg-center p-6 md:p-10"
          style={
            t.poster_url
              ? { backgroundImage: `linear-gradient(rgba(11,30,22,.75),rgba(11,30,22,.9)),url(${t.poster_url})` }
              : undefined
          }
        >
          <div className="text-sm text-cue-400">{t.discipline?.name}</div>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">{t.name}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-felt-100/80">
            <span>{statusLabel[t.status] || t.status}</span>
            {t.starts_on && <span>{t.starts_on}</span>}
            {t.venue && <span>{t.venue}</span>}
            <span>{formatToman(t.fee_toman || 0)}</span>
          </div>
          {(t.status === "registration_open" || t.status === "pre_registration") && (
            <Link href={`/billiard/register?tournament=${t.slug}`} className="btn mt-6 bg-cue-500 text-felt-950">
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
            className={`rounded-full px-3 py-1.5 text-sm ${
              tab === tb.id ? "bg-felt-700 text-white" : "bg-white/70 text-felt-800"
            }`}
          >
            {tb.label}
          </Link>
        ))}
      </div>

      {tab === "intro" && (
        <div className="card-soft prose prose-sm max-w-none whitespace-pre-wrap">
          {t.description || "توضیحی ثبت نشده است."}
        </div>
      )}
      {tab === "rules" && (
        <div className="card-soft whitespace-pre-wrap text-sm">{t.rules || "قوانین ثبت نشده است."}</div>
      )}
      {tab === "players" && (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {(data.players || []).map((r: any) => (
            <Link key={r.id} href={`/billiard/players/${r.player_id}`} className="card-soft flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-full bg-felt-200 bg-cover bg-center"
                style={r.player?.photo_url ? { backgroundImage: `url(${r.player.photo_url})` } : undefined}
              />
              <div>
                <div className="font-medium">{r.player?.full_name}</div>
                <div className="text-xs text-felt-600">{r.player?.city || r.player?.club}</div>
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
              <div className="text-xs text-felt-600">{k}</div>
              <div className="font-display text-2xl">{String(v)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchesList({ matches }: { matches: any[] }) {
  if (!matches?.length) return <p className="text-sm text-felt-600">موردی نیست.</p>;
  return (
    <div className="card-soft divide-y divide-felt-900/5">
      {matches.map((m) => (
        <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
          <div>
            <div className="text-xs text-felt-500">{m.round_label}</div>
            <div>
              {m.player1?.full_name || "TBD"} vs {m.player2?.full_name || "TBD"}
            </div>
            <div className="text-xs text-felt-500">
              {[m.scheduled_on, m.scheduled_at, m.table?.name].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div className="text-left">
            <div className="font-display">
              {m.score1 ?? "-"} – {m.score2 ?? "-"}
            </div>
            <div className="text-xs text-felt-500">{statusLabel[m.status] || m.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
