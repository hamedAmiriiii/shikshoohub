import Link from "next/link";
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
    "هیأت بیلیارد";

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-felt-950 px-6 py-14 text-white md:px-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(212,165,116,.35), transparent 40%), radial-gradient(circle at 80% 70%, rgba(79,154,112,.4), transparent 35%)",
          }}
        />
        <div className="relative max-w-2xl">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-cue-400">{brand}</p>
          <h1 className="font-display text-3xl leading-tight md:text-5xl">
            مسابقات، جدول و رنکینگ در یک نگاه
          </h1>
          <p className="mt-4 text-felt-100/80">
            ثبت‌نام آنلاین، برنامه بازی‌ها، نتایج زنده و آرشیو کامل هیأت.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/billiard/register" className="btn bg-cue-500 text-felt-950 hover:bg-cue-400">
              ثبت‌نام مسابقه
            </Link>
            <Link href="/billiard/tournaments" className="btn border border-white/30 hover:bg-white/10">
              مشاهده مسابقات
            </Link>
          </div>
        </div>
      </section>

      {!home.ok ? (
        <div className="card-soft space-y-2 text-felt-800">
          <p className="font-medium">اتصال به API برقرار نشد.</p>
          <p className="text-sm break-all">{home.message}</p>
          <p className="text-xs text-felt-600 break-all">URL: {home.url}</p>
          <p className="text-xs text-felt-600">
            مقدار <code>NEXT_PUBLIC_BASE_URL</code> در env فرانت را چک کنید و بعد از تغییر،
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
            <h2 className="mb-4 font-display text-2xl">آخرین نتایج</h2>
            <div className="card-soft divide-y divide-felt-900/5">
              {(data.latest_results || []).slice(0, 8).map((m: any) => (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <span className="font-medium">{m.player1?.full_name || "—"}</span>
                    <span className="mx-2 text-felt-500">vs</span>
                    <span className="font-medium">{m.player2?.full_name || "—"}</span>
                    <div className="text-xs text-felt-500">{m.tournament?.name}</div>
                  </div>
                  <div className="font-display text-felt-800">
                    {m.score1 ?? "-"} – {m.score2 ?? "-"}
                  </div>
                </div>
              ))}
              {(data.latest_results || []).length === 0 && (
                <p className="py-4 text-sm text-felt-600">هنوز نتیجه‌ای ثبت نشده است.</p>
              )}
            </div>
          </section>
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-2xl">رنکینگ برتر</h2>
              <Link href="/billiard/ranking" className="text-sm text-felt-700 hover:underline">
                مشاهده کامل
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {(data.rankings || []).map((block: any) => (
                <div key={block.discipline?.id} className="card-soft">
                  <h3 className="mb-3 font-display text-lg">{block.discipline?.name}</h3>
                  <ol className="space-y-2 text-sm">
                    {(block.entries || []).slice(0, 5).map((e: any) => (
                      <li key={e.player_id} className="flex justify-between">
                        <span>
                          <span className="ml-2 text-felt-500">{e.rank}.</span>
                          {e.player?.full_name}
                        </span>
                        <span className="text-felt-700">{e.points}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
          <Section title="اطلاعیه‌ها" href="/billiard/news">
            <div className="grid gap-3 md:grid-cols-3">
              {(data.news || []).map((n: any) => (
                <Link key={n.id} href={`/billiard/news/${n.slug}`} className="card-soft block hover:border-felt-400">
                  <h3 className="font-medium">{n.title}</h3>
                  <p className="mt-2 text-xs text-felt-600">{n.excerpt}</p>
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
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-2xl">{title}</h2>
        <Link href={href} className="text-sm text-felt-700 hover:underline">
          همه
        </Link>
      </div>
      {children}
    </section>
  );
}

function Grid({ items }: { items: Tournament[] }) {
  if (!items?.length) {
    return <p className="text-sm text-felt-600">موردی نیست.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => (
        <TournamentCard key={t.id} t={t} />
      ))}
    </div>
  );
}
