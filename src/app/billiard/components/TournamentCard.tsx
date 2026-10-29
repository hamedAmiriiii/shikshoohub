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
    <Link href={`/billiard/tournaments/${t.slug}`} className="card-soft group block overflow-hidden p-0">
      <div
        className="h-36 bg-felt-800"
        style={
          t.poster_url
            ? { backgroundImage: `url(${t.poster_url})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      />
      <div className="p-4">
        <div className="mb-1 text-xs text-felt-600">
          {t.discipline?.name || "—"} · {statusLabel[t.status] || t.status}
        </div>
        <h3 className="font-display text-lg group-hover:text-felt-700">{t.name}</h3>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-felt-900/60">
          {t.starts_on && <span>{t.starts_on}</span>}
          {t.venue && <span>{t.venue}</span>}
          {typeof t.fee_toman === "number" && <span>{formatToman(t.fee_toman)}</span>}
        </div>
      </div>
    </Link>
  );
}
