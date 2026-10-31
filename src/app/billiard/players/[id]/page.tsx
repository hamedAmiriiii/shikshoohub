import Link from "next/link";
import { notFound } from "next/navigation";
import { apiUrl, statusLabel } from "@/app/lib/billiard/api";
import {
  formatMatchWhen,
  indexMatches,
  matchSideText,
  type MatchLike,
} from "@/app/lib/billiard/matchDisplay";

type BracketMatch = MatchLike & {
  id: number;
  match_no?: number;
  round_label?: string | null;
  player1_id?: number | null;
  player2_id?: number | null;
  score1?: number | null;
  score2?: number | null;
  winner_id?: number | null;
  status?: string;
};

type HistoryMatch = {
  match_id: number;
  round_label?: string | null;
  opponent?: string | null;
  scheduled_on?: string | null;
  scheduled_at?: string | null;
  table?: string | null;
  status?: string;
  result?: string | null;
  score?: string | null;
};

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

async function getBracket(slug: string): Promise<BracketMatch[]> {
  try {
    const res = await fetch(apiUrl(`/tournaments/${slug}`), { next: { revalidate: 15 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.bracket) ? data.bracket : [];
  } catch {
    return [];
  }
}

function fromBracket(rows: BracketMatch[], playerId: number) {
  const catalog = indexMatches(rows);
  return rows
    .filter((m) => m.player1_id === playerId || m.player2_id === playerId)
    .filter((m) => m.status !== "cancelled")
    .slice()
    .sort((a, b) => {
      const da = `${a.scheduled_on || "9999"} ${a.scheduled_at || ""}`;
      const db = `${b.scheduled_on || "9999"} ${b.scheduled_at || ""}`;
      return da.localeCompare(db) || (a.match_no || 0) - (b.match_no || 0);
    })
    .map((m) => {
      const done = m.status === "finished" || m.status === "walkover";
      const opponentSide: 1 | 2 = m.player1_id === playerId ? 2 : 1;
      return {
        id: m.id,
        roundLabel: m.round_label || (m.match_no ? `بازی ${m.match_no}` : "بازی"),
        opponent: matchSideText(m, opponentSide, catalog),
        when: formatMatchWhen(m),
        done,
        result: done ? (m.winner_id === playerId ? "برد" : "باخت") : statusLabel[m.status || ""] || "",
        score: done ? `${m.score1 ?? "-"} – ${m.score2 ?? "-"}` : "",
      };
    });
}

function fromHistory(rows: HistoryMatch[]) {
  return rows.map((m) => ({
    id: m.match_id,
    roundLabel: m.round_label || "بازی",
    opponent: m.opponent || "—",
    when: formatMatchWhen({
      scheduled_on: m.scheduled_on,
      scheduled_at: m.scheduled_at,
      table: m.table ? { name: m.table } : null,
    }),
    done: Boolean(m.result),
    result: m.result || statusLabel[m.status || ""] || "",
    score: m.score || "",
  }));
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPlayer(id);
  if (!data) notFound();
  const p = data.player;
  const history = Array.isArray(data.history) ? data.history : [];
  const slugs = [
    ...new Set(
      history
        .map((h: { tournament?: { slug?: string } }) => h.tournament?.slug)
        .filter((slug: string | undefined): slug is string => Boolean(slug)),
    ),
  ];
  const brackets = await Promise.all(slugs.map(async (slug) => [slug, await getBracket(slug)] as const));
  const bySlug = new Map(brackets);

  return (
    <div className="space-y-8">
      <div className="card-soft flex flex-wrap items-center gap-5">
        <div
          className="h-28 w-28 rounded-2xl border border-white/10 bg-white/10 bg-cover bg-center"
          style={p.photo_url ? { backgroundImage: `url(${p.photo_url})` } : undefined}
        />
        <div>
          <h1 className="font-display text-3xl text-slate-100">{p.full_name}</h1>
          <div className="mt-2 text-sm text-slate-400">{[p.club, p.city].filter(Boolean).join(" · ")}</div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
            <span>
              رتبه: <span className="text-cyan-300">{p.rank ?? "—"}</span>
            </span>
            <span>
              امتیاز: <span className="text-fuchsia-300">{p.points ?? "—"}</span>
            </span>
            <span>برد: {p.wins ?? 0}</span>
            <span>باخت: {p.losses ?? 0}</span>
            <span>درصد برد: {p.win_rate ?? "—"}%</span>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl text-slate-100">آمار مقام‌ها</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="قهرمانی" value={p.titles} />
          <Stat label="نایب‌قهرمانی" value={p.runner_ups} />
          <Stat label="سوم" value={p.thirds} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl text-slate-100">بازی‌ها</h2>
        <div className="space-y-4">
          {history.map((h: any, idx: number) => {
            const slug = h.tournament?.slug as string | undefined;
            const bracket = slug ? bySlug.get(slug) || [] : [];
            const matches = bracket.length
              ? fromBracket(bracket, Number(p.id))
              : fromHistory(h.matches || []);
            return (
              <div key={idx} className="card-soft">
                <div className="mb-2 flex flex-wrap justify-between gap-2">
                  <div className="font-medium text-slate-100">
                    {slug ? (
                      <Link href={`/billiard/tournaments/${slug}`} className="hover:text-cyan-300">
                        {h.tournament?.name}
                      </Link>
                    ) : (
                      h.tournament?.name
                    )}
                  </div>
                  <div className="text-sm text-slate-400">
                    مقام {h.final_place ?? "—"} · {h.points_awarded ?? 0} امتیاز
                  </div>
                </div>
                <div className="divide-y divide-white/10 text-sm text-slate-300">
                  {matches.map((m) => (
                    <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                      <div>
                        <div className="text-xs text-slate-500">{m.roundLabel}</div>
                        <div className="text-slate-100">
                          vs {m.opponent}
                        </div>
                        <div className="text-xs text-slate-500">{m.when || "زمان ثبت نشده"}</div>
                      </div>
                      {(m.result || m.score) && (
                        <div className="text-left text-cyan-300">
                          {m.score && <div>{m.score}</div>}
                          {m.result && <div className="text-xs">{m.result}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                  {!matches.length && (
                    <p className="py-3 text-sm text-slate-500">هنوز بازی‌ای برای این بازیکن ثبت نشده.</p>
                  )}
                </div>
              </div>
            );
          })}
          {!history.length && <p className="text-sm text-slate-500">مسابقه‌ای برای این بازیکن ثبت نشده.</p>}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="card-soft">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-display text-2xl text-cyan-300">{value ?? 0}</div>
    </div>
  );
}
