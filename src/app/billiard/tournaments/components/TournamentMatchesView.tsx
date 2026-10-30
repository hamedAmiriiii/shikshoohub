"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { statusLabel } from "@/app/lib/billiard/api";
import { useAuth } from "@/app/lib/billiard/auth";

type PlayerMini = {
  id?: number;
  full_name?: string;
  photo_url?: string | null;
} | null;

type MatchRow = {
  id: number;
  match_no?: number;
  phase?: string;
  group_code?: string | null;
  round?: number;
  position?: number;
  round_label?: string | null;
  player1_id?: number | null;
  player2_id?: number | null;
  player1?: PlayerMini;
  player2?: PlayerMini;
  player1_source?: { label?: string; match_no?: number } | null;
  player2_source?: { label?: string; match_no?: number } | null;
  score1?: number | null;
  score2?: number | null;
  winner_id?: number | null;
  scheduled_on?: string | null;
  scheduled_at?: string | null;
  table?: { name?: string } | null;
  status?: string;
};

type RegRow = {
  id: number;
  player_id: number;
  group_code?: string | null;
  player?: PlayerMini & { city?: string | null; club?: string | null };
};

type Props = {
  mode: "bracket" | "schedule" | "results" | "players";
  format?: string;
  groupCount?: number | null;
  players?: RegRow[];
  matches?: MatchRow[];
};

function isMine(m: MatchRow, userId?: number | null) {
  if (!userId) return false;
  return m.player1_id === userId || m.player2_id === userId;
}

function Avatar({ player, size = 36 }: { player?: PlayerMini; size?: number }) {
  return (
    <div
      className="shrink-0 rounded-full border border-white/15 bg-white/10 bg-cover bg-center"
      style={{
        width: size,
        height: size,
        backgroundImage: player?.photo_url ? `url(${player.photo_url})` : undefined,
      }}
    />
  );
}

function sideName(player?: PlayerMini, source?: string) {
  return player?.full_name || source || "—";
}

function formatJalaliDate(ymd?: string | null) {
  if (!ymd) return "";
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return ymd;
  }
}

function PlayerSide({
  player,
  label,
  mine,
  align,
}: {
  player?: PlayerMini;
  label: string;
  mine?: boolean;
  align: "start" | "end";
}) {
  return (
    <div className={`flex min-w-0 flex-1 items-start gap-1.5 ${align === "end" ? "flex-row-reverse text-left" : ""}`}>
      <Avatar player={player} size={34} />
      <span
        className={`min-w-0 flex-1 text-[13px] font-medium leading-5 [overflow-wrap:anywhere] ${
          mine ? "text-amber-100" : "text-slate-100"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function MatchFaceOff({ m, myId }: { m: MatchRow; myId?: number | null }) {
  const name1 = sideName(m.player1, m.player1_source?.label);
  const name2 = sideName(m.player2, m.player2_source?.label);
  const mine1 = !!myId && m.player1_id === myId;
  const mine2 = !!myId && m.player2_id === myId;
  const done = m.status === "finished" || m.status === "walkover";
  const dateLabel = formatJalaliDate(m.scheduled_on);
  const timeLabel = m.scheduled_at || "";

  return (
    <div className="space-y-2">
      <div className="text-center font-sans text-[12px] leading-5 text-slate-300">
        <div>{[dateLabel, timeLabel].filter(Boolean).join("  ") || "زمان ندارد"}</div>
        {m.table?.name && <div className="text-[11px] text-slate-500">{m.table.name}</div>}
        {done && (
          <div className="text-sm text-cyan-300">
            {m.score1 ?? "-"} – {m.score2 ?? "-"}
          </div>
        )}
      </div>
      <div className="flex items-start gap-2">
        <PlayerSide player={m.player1} label={name1} mine={mine1} align="start" />
        <PlayerSide player={m.player2} label={name2} mine={mine2} align="end" />
      </div>
    </div>
  );
}

function MatchCard({
  m,
  myId,
}: {
  m: MatchRow;
  myId?: number | null;
}) {
  const mine = isMine(m, myId);
  return (
    <div
      className={`rounded-xl border px-2.5 py-2 text-sm transition ${
        mine
          ? "border-amber-400/55 bg-amber-500/15 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-fuchsia-500/20 px-1.5 text-[11px] font-bold text-fuchsia-300">
            {m.match_no ?? m.id}
          </span>
          {m.group_code && (
            <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[10px] text-cyan-200">
              گروه {m.group_code}
            </span>
          )}
          {mine && (
            <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-200">
              بازی شما
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-500">{statusLabel[m.status || ""] || m.status}</span>
      </div>
      <MatchFaceOff m={m} myId={myId} />
    </div>
  );
}

function GroupCards({
  players,
  groupCount,
  myId,
  selected,
  onSelect,
}: {
  players: RegRow[];
  groupCount?: number | null;
  myId?: number | null;
  selected?: string | null;
  onSelect?: (code: string) => void;
}) {
  const codes = useMemo(() => {
    const fromCount =
      groupCount && groupCount > 0
        ? Array.from({ length: groupCount }, (_, i) => String.fromCharCode(65 + i))
        : [];
    const fromPlayers = [...new Set(players.map((p) => p.group_code).filter(Boolean) as string[])].sort();
    const merged = fromCount.length ? fromCount : fromPlayers;
    return merged.length ? merged : [];
  }, [players, groupCount]);

  if (!codes.length) {
    return <p className="text-sm text-slate-500">هنوز گروهی تعریف نشده است.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {codes.map((code) => {
        const members = players.filter((p) => (p.group_code || "") === code);
        const hasMe = myId ? members.some((m) => m.player_id === myId) : false;
        return (
          <div
            key={code}
            className={`rounded-2xl border p-3 ${
              selected === code
                ? "border-cyan-400/60 bg-cyan-500/10"
                : hasMe
                  ? "border-amber-400/50 bg-amber-500/10"
                  : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect?.(code)}
              className="mb-3 flex w-full items-center justify-between text-right"
            >
              <h3 className="font-display text-lg text-slate-100">گروه {code}</h3>
              <span className="text-xs text-slate-500">{members.length} نفر</span>
            </button>
            <div className="space-y-2">
              {members.map((r) => {
                const me = myId === r.player_id;
                return (
                  <Link
                    key={r.id}
                    href={`/billiard/players/${r.player_id}`}
                    className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-white/5 ${
                      me ? "bg-amber-400/10 ring-1 ring-amber-400/30" : ""
                    }`}
                  >
                    <Avatar player={r.player} size={40} />
                    <div className="min-w-0">
                      <div className={`truncate text-sm font-medium ${me ? "text-amber-100" : "text-slate-100"}`}>
                        {r.player?.full_name || "—"}
                        {me ? " · شما" : ""}
                      </div>
                      <div className="truncate text-[11px] text-slate-500">
                        {r.player?.city || r.player?.club || ""}
                      </div>
                    </div>
                  </Link>
                );
              })}
              {!members.length && <p className="text-xs text-slate-500">بازیکنی نیست.</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KnockoutTree({ matches, myId }: { matches: MatchRow[]; myId?: number | null }) {
  const byRound = useMemo(() => {
    const map = new Map<number, MatchRow[]>();
    for (const m of matches) {
      const r = Number(m.round) || 1;
      const arr = map.get(r) || [];
      arr.push(m);
      map.set(r, arr);
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([round, list]) => [
        round,
        list.slice().sort((a, b) => (a.position || 0) - (b.position || 0)),
      ] as const);
  }, [matches]);

  if (!byRound.length) {
    return <p className="text-sm text-slate-500">جدول حذفی هنوز ساخته نشده است.</p>;
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {byRound.map(([round, list]) => (
          <div key={round} className="flex w-[340px] shrink-0 flex-col justify-around gap-3 sm:w-[400px]">
            <div className="sticky top-0 text-center text-[11px] text-slate-500">
              {list[0]?.round_label || `دور ${round}`}
            </div>
            <div
              className="flex flex-1 flex-col justify-around gap-3"
              style={{ minHeight: Math.max(list.length, 1) * 110 }}
            >
              {list.map((m) => (
                <MatchCard key={m.id} m={m} myId={myId} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function scheduleStageKey(m: MatchRow) {
  if ((m.phase || "") === "group") {
    return `group:${m.group_code || ""}`;
  }
  return `ko:${String(m.round ?? 0).padStart(3, "0")}`;
}

function scheduleStageTitle(m: MatchRow) {
  if ((m.phase || "") === "group") {
    return m.group_code ? `مرحله گروهی · گروه ${m.group_code}` : "مرحله گروهی";
  }
  return m.round_label || `حذفی · دور ${m.round ?? ""}`;
}

function ScheduleList({ matches, myId }: { matches: MatchRow[]; myId?: number | null }) {
  const stages = useMemo(() => {
    const byTime = (a: MatchRow, b: MatchRow) => {
      const da = `${a.scheduled_on || "9999"} ${a.scheduled_at || ""}`;
      const db = `${b.scheduled_on || "9999"} ${b.scheduled_at || ""}`;
      return da.localeCompare(db) || (a.match_no || 0) - (b.match_no || 0);
    };
    const map = new Map<string, { title: string; items: MatchRow[] }>();
    for (const m of matches) {
      const key = scheduleStageKey(m);
      const cur = map.get(key) || { title: scheduleStageTitle(m), items: [] };
      cur.items.push(m);
      map.set(key, cur);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, stage]) => ({ key, ...stage, items: stage.items.slice().sort(byTime) }));
  }, [matches]);

  if (!stages.length) return <p className="text-sm text-slate-500">برنامه‌ای ثبت نشده است.</p>;

  return (
    <div className="space-y-10">
      {stages.map((stage) => (
        <section key={stage.key} className="space-y-3">
          <h2 className="border-b border-white/10 pb-2 font-display text-lg text-slate-100">{stage.title}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {stage.items.map((m) => (
              <MatchCard key={m.id} m={m} myId={myId} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ResultsList({ matches, myId }: { matches: MatchRow[]; myId?: number | null }) {
  if (!matches.length) return <p className="text-sm text-slate-500">نتیجه‌ای نیست.</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {matches.map((m) => (
        <MatchCard key={m.id} m={m} myId={myId}  />
      ))}
    </div>
  );
}

function FlatPlayers({ players, myId }: { players: RegRow[]; myId?: number | null }) {
  if (!players.length) return <p className="text-sm text-slate-500">بازیکنی نیست.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      {players.map((r) => {
        const me = myId === r.player_id;
        return (
          <Link
            key={r.id}
            href={`/billiard/players/${r.player_id}`}
            className={`card-soft flex items-center gap-3 transition hover:border-cyan-400/30 ${
              me ? "border-amber-400/50 bg-amber-500/10" : ""
            }`}
          >
            <Avatar player={r.player} size={48} />
            <div>
              <div className={`font-medium ${me ? "text-amber-100" : "text-slate-100"}`}>
                {r.player?.full_name}
                {me ? " · شما" : ""}
              </div>
              <div className="text-xs text-slate-500">
                {r.group_code ? `گروه ${r.group_code}` : r.player?.city || r.player?.club}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function TournamentMatchesView({
  mode,
  format,
  groupCount,
  players = [],
  matches = [],
}: Props) {
  const { user } = useAuth();
  const myId = user?.id ?? null;
  const isGroupFormat = format === "group_then_elimination";
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  const groupMatches = useMemo(
    () => matches.filter((m) => (m.phase || "") === "group"),
    [matches],
  );
  const knockoutMatches = useMemo(
    () => matches.filter((m) => (m.phase || "knockout") === "knockout"),
    [matches],
  );

  if (mode === "players") {
    if (isGroupFormat) {
      return <GroupCards players={players} groupCount={groupCount} myId={myId} />;
    }
    return <FlatPlayers players={players} myId={myId} />;
  }

  if (mode === "schedule") {
    return <ScheduleList matches={matches} myId={myId} />;
  }

  if (mode === "results") {
    return <ResultsList matches={matches} myId={myId} />;
  }

  // bracket
  return (
    <div className="space-y-8">
      {isGroupFormat && (
        <section className="space-y-3">
          <h2 className="font-display text-xl text-slate-100">مرحله گروهی</h2>
          <GroupCards
            players={players}
            groupCount={groupCount}
            myId={myId}
            selected={groupFilter}
            onSelect={(code) => setGroupFilter((cur) => (cur === code ? null : code))}
          />
          {groupMatches.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-sm text-slate-400">
                {groupFilter ? `بازی‌های گروه ${groupFilter}` : "بازی‌های گروهی"}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {(groupFilter
                  ? groupMatches.filter((m) => (m.group_code || "") === groupFilter)
                  : groupMatches
                ).map((m) => (
                  <MatchCard key={m.id} m={m} myId={myId} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl text-slate-100">جدول حذفی</h2>
        <KnockoutTree
          matches={
            isGroupFormat
              ? knockoutMatches
              : knockoutMatches.length
                ? knockoutMatches
                : matches
          }
          myId={myId}
        />
      </section>
    </div>
  );
}
