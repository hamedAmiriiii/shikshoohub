import Link from "next/link";
import { notFound } from "next/navigation";
import { apiUrl, formatToman, statusLabel } from "@/app/lib/billiard/api";
import { TournamentMatchesView } from "@/app/billiard/tournaments/components/TournamentMatchesView";

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
  const { tab: requested = "bracket" } = await searchParams;
  const tab = requested === "intro" ? "bracket" : requested;
  const data = await getTournament(slug);
  if (!data) notFound();

  const t = data.tournament;
  const published = t.is_published !== false;
  const tabs = published
    ? [
        { id: "players", label: "بازیکنان" },
        { id: "bracket", label: "جدول" },
        { id: "schedule", label: "برنامه" },
        { id: "results", label: "نتایج" },
      ]
    : [];

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
            {t.format === "group_then_elimination" && <span>گروهی سپس حذفی</span>}
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

      <div className="card-soft whitespace-pre-wrap text-sm leading-7 text-slate-300">
        {t.description || "توضیحی برای این مسابقه ثبت نشده است."}
      </div>

      {!published && (
        <p className="text-sm text-slate-400">
          بازیکنان، گروه‌بندی و ساعت بازی‌ها بعد از انتشار جدول نمایش داده می‌شود. تا آن موقع فقط توضیحات و ثبت‌نام در دسترس است.
        </p>
      )}

      {published && (
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
      )}

      {published && tab === "players" && (
        <TournamentMatchesView
          mode="players"
          format={t.format}
          groupCount={t.group_count}
          players={data.players || []}
        />
      )}

      {published && tab === "bracket" && (
        <TournamentMatchesView
          mode="bracket"
          format={t.format}
          groupCount={t.group_count}
          players={data.players || []}
          matches={data.bracket || []}
        />
      )}

      {published && tab === "schedule" && (
        <TournamentMatchesView mode="schedule" matches={data.schedule || []} format={t.format} />
      )}

      {published && tab === "results" && (
        <TournamentMatchesView mode="results" matches={data.results || []} format={t.format} />
      )}
    </div>
  );
}
