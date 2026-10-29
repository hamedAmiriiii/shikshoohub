import Link from "next/link";
import { formatToman, statusLabel } from "@/app/lib/billiard/api";

export type Tournament = {
  id: number;
  name: string;
  slug: string;
  poster_url?: string | null;
  status: string;
  starts_on?: string | null;
  venue?: string | null;
  fee_toman?: number;
  discipline?: { name: string } | null;
};

export function TournamentCard({ t }: { t: Tournament }) {
  return (
    <Link
      href={`/billiard/tournaments/${t.slug}`}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-400/35 hover:bg-white/[0.07]"
    >
      <div
        className="relative h-36 overflow-hidden bg-[#121826]"
        style={
          t.poster_url
            ? { backgroundImage: `url(${t.poster_url})`, backgroundSize: "cover", backgroundPosition: "center" }
            : {
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(34,211,238,.25), transparent 45%), radial-gradient(circle at 80% 80%, rgba(192,38,211,.2), transparent 40%), linear-gradient(135deg, #121826, #0b0f1a)",
              }
        }
      >
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0b0f1a] to-transparent" />
        <span className="absolute bottom-3 right-3 rounded-lg border border-white/15 bg-black/35 px-2 py-1 text-[11px] text-cyan-300 backdrop-blur">
          {statusLabel[t.status] || t.status}
        </span>
      </div>
      <div className="p-4">
        <div className="mb-1 text-xs text-slate-500">{t.discipline?.name || "—"}</div>
        <h3 className="font-display text-lg text-slate-100 transition group-hover:text-cyan-300">{t.name}</h3>
        <div className="mt-2.5 flex flex-wrap gap-3 text-xs text-slate-400">
          {t.starts_on && <span>{t.starts_on}</span>}
          {t.venue && <span>{t.venue}</span>}
          {typeof t.fee_toman === "number" && <span>{formatToman(t.fee_toman)}</span>}
        </div>
      </div>
    </Link>
  );
}
