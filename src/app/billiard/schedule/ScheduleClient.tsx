"use client";

import Link from "next/link";
import { statusLabel } from "@/app/lib/billiard/api";
import { useAuth } from "@/app/lib/billiard/auth";

type MatchRow = {
  id: number;
  match_no?: number;
  group_code?: string | null;
  round_label?: string | null;
  player1_id?: number | null;
  player2_id?: number | null;
  player1?: { full_name?: string; photo_url?: string | null } | null;
  player2?: { full_name?: string; photo_url?: string | null } | null;
  player1_source?: { label?: string } | null;
  player2_source?: { label?: string } | null;
  scheduled_on?: string | null;
  scheduled_at?: string | null;
  table?: { name?: string } | null;
  status?: string;
  tournament?: { name?: string; slug?: string } | null;
};

function Avatar({ url }: { url?: string | null }) {
  return (
    <div
      className="h-8 w-8 shrink-0 rounded-full border border-white/15 bg-white/10 bg-cover bg-center"
      style={url ? { backgroundImage: `url(${url})` } : undefined}
    />
  );
}

export function ScheduleClient({ matches }: { matches: MatchRow[] }) {
  const { user } = useAuth();
  const myId = user?.id;

  if (!matches.length) {
    return <p className="py-6 text-center text-slate-500">برنامه‌ای ثبت نشده است.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {matches.map((m) => {
        const mine = !!myId && (m.player1_id === myId || m.player2_id === myId);
        return (
          <div
            key={m.id}
            className={`rounded-xl border p-3 text-sm ${
              mine
                ? "border-amber-400/55 bg-amber-500/15"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-fuchsia-500/20 px-1.5 text-[11px] font-bold text-fuchsia-300">
                {m.match_no ?? m.id}
              </span>
              {m.group_code && (
                <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[10px] text-cyan-200">
                  گروه {m.group_code}
                </span>
              )}
              {mine && (
                <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] text-amber-200">
                  بازی شما
                </span>
              )}
              <span className="mr-auto text-[10px] text-slate-500">
                {statusLabel[m.status || ""] || m.status}
              </span>
            </div>
            {m.tournament?.slug && (
              <Link
                href={`/billiard/tournaments/${m.tournament.slug}?tab=schedule`}
                className="mb-2 block truncate text-xs text-slate-400 hover:text-cyan-300"
              >
                {m.tournament.name}
              </Link>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Avatar url={m.player1?.photo_url} />
                <span className={`truncate text-xs ${myId && m.player1_id === myId ? "text-amber-100" : "text-slate-100"}`}>
                  {m.player1?.full_name || m.player1_source?.label || "TBD"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Avatar url={m.player2?.photo_url} />
                <span className={`truncate text-xs ${myId && m.player2_id === myId ? "text-amber-100" : "text-slate-100"}`}>
                  {m.player2?.full_name || m.player2_source?.label || "TBD"}
                </span>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {[m.scheduled_on, m.scheduled_at, m.table?.name, m.round_label].filter(Boolean).join(" · ")}
            </div>
          </div>
        );
      })}
    </div>
  );
}
