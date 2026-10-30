import Link from "next/link";
import { NewsCover } from "@/app/billiard/news/NewsCover";
import { apiUrl } from "@/app/lib/billiard/api";
import { TournamentCard, type Tournament } from "@/app/billiard/components/TournamentCard";

type HomeResult =
  | { ok: true; data: any }
  | { ok: false; message: string; url: string; status?: number };

async function getHome(): Promise<HomeResult> {
  const url = apiUrl("/home");
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        detail = body?.message ? ` — ${body.message}` : "";
      } catch {
        /* ignore */
      }
      return {
        ok: false,
        url,
        status: res.status,
        message: `پاسخ API: ${res.status}${detail}`,
      };
    }
    return { ok: true, data: await res.json() };
  } catch (e: any) {
    return {
      ok: false,
      url,
      message: e?.message || "خطای شبکه در اتصال به API",
    };
  }
}

export default async function HomePage() {
  const home = await getHome();
  const data = home.ok ? home.data : null;
  const brand =
    process.env.NEXT_PUBLIC_BILLIARD_BRAND_NAME ||
    process.env.NEXT_PUBLIC_BRAND_NAME ||
    "هیأت بیلیارد شهرستان کرمان";

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden pt-2 pb-4 md:pt-4 md:pb-8">
        <div className="pointer-events-none absolute inset-0 -mx-4 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.22),_transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 -mx-4 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(6,182,212,0.12),_transparent_45%)]" />
        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div className="text-center lg:text-right">
            <p className="mb-3 text-sm font-medium text-cyan-400">{brand}</p>
            <h1 className="font-display text-3xl leading-tight sm:text-4xl md:text-5xl">
              <span className="bg-gradient-to-l from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                مسابقات، جدول
              </span>
              <br />
              <span className="bg-gradient-to-l from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                و رنکینگ
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-slate-400 lg:mx-0">
              ثبت‌نام آنلاین، برنامه بازی‌ها، نتایج زنده و آرشیو کامل هیأت.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/billiard/tournaments?status=live", title: "زنده", desc: "مسابقات در حال برگزاری", color: "from-cyan-500 to-blue-500" },
              { href: "/billiard/ranking", title: "رنکینگ", desc: "جدول امتیاز بازیکنان", color: "from-violet-500 to-fuchsia-500" },
              { href: "/billiard/schedule", title: "برنامه", desc: "زمان‌بندی بازی‌ها", color: "from-fuchsia-500 to-pink-500" },
              { href: "/billiard/results", title: "نتایج", desc: "آخرین اسکورها", color: "from-emerald-500 to-teal-500" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-cyan-400/40 hover:bg-white/[0.07]"
              >
                <div
                  className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-xs font-bold text-white`}
                >
                  {item.title[0]}
                </div>
                <div className="text-sm font-semibold text-slate-100">{item.title}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {!home.ok ? (
        <div className="card-soft space-y-2 text-slate-300">
          <p className="font-medium text-slate-100">اتصال به API برقرار نشد.</p>
          <p className="text-sm break-all text-slate-400">{home.message}</p>
          <p className="text-xs break-all text-slate-500">URL: {home.url}</p>
          <p className="text-xs text-slate-500">
            مقدار <code className="text-cyan-300">NEXT_PUBLIC_BASE_URL</code> در env فرانت را چک کنید و بعد از تغییر،
            سرور Next را یک‌بار ری‌استارت کنید.
          </p>
        </div>
      ) : (
        <>
          <Section title="مسابقات در حال برگزاری" href="/billiard/tournaments?status=live">
            <Grid items={data.live || []} />
          </Section>
          <Section title="مسابقات پیش‌رو" href="/billiard/tournaments">
            <Grid items={data.upcoming || []} />
          </Section>
          <section>
            <h2 className="mb-4 font-display text-2xl text-slate-100">آخرین نتایج</h2>
            <div className="card-soft divide-y divide-white/10">
              {(data.latest_results || []).slice(0, 8).map((m: any) => (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3.5 text-sm">
                  <div>
                    <span className="font-medium text-slate-100">{m.player1?.full_name || "—"}</span>
                    <span className="mx-2 text-slate-500">vs</span>
                    <span className="font-medium text-slate-100">{m.player2?.full_name || "—"}</span>
                    <div className="text-xs text-slate-500">{m.tournament?.name}</div>
                  </div>
                  <div className="font-display text-cyan-300">
                    {m.score1 ?? "-"} – {m.score2 ?? "-"}
                  </div>
                </div>
              ))}
              {(data.latest_results || []).length === 0 && (
                <p className="py-4 text-sm text-slate-500">هنوز نتیجه‌ای ثبت نشده است.</p>
              )}
            </div>
          </section>
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-2xl text-slate-100">رنکینگ برتر</h2>
              <Link href="/billiard/ranking" className="text-sm text-cyan-400 hover:text-cyan-300 transition">
                مشاهده کامل
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {(data.rankings || []).map((block: any) => (
                <div key={block.discipline?.id} className="card-soft">
                  <h3 className="mb-3 font-display text-lg text-slate-100">{block.discipline?.name}</h3>
                  <ol className="space-y-2.5 text-sm">
                    {(block.entries || []).slice(0, 5).map((e: any) => (
                      <li key={e.player_id} className="flex justify-between gap-3">
                        <span className="text-slate-200">
                          <span className="ml-2 text-cyan-400/80">{e.rank}.</span>
                          {e.player?.full_name}
                        </span>
                        <span className="text-fuchsia-300">{e.points}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
          <Section title="اطلاعیه‌ها" href="/billiard/news">
            <div className="grid gap-2 sm:grid-cols-2">
              {(data.news || []).map((n: any) => (
                <Link
                  key={n.id}
                  href={`/billiard/news/${n.slug}`}
                  className="group block overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition hover:border-cyan-400/30"
                >
                  <NewsCover url={n.cover_url} alt={n.title} />
                  <h3 className="text-sm font-semibold leading-6 text-slate-100 group-hover:text-cyan-300">
                    {n.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-3 text-xs leading-5 text-slate-400">{n.excerpt}</p>
                </Link>
              ))}
            </div>
          </Section>
          <Section title="مسابقات اخیر" href="/billiard/archive">
            <Grid items={data.recent || []} />
          </Section>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="font-display text-2xl text-slate-100">{title}</h2>
        <Link href={href} className="text-sm text-cyan-400 transition hover:text-cyan-300">
          همه
        </Link>
      </div>
      {children}
    </section>
  );
}

function Grid({ items }: { items: Tournament[] }) {
  if (!items?.length) {
    return <p className="text-sm text-slate-500">موردی نیست.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => (
        <TournamentCard key={t.id} t={t} />
      ))}
    </div>
  );
}
