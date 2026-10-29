import Link from "next/link";
import { apiUrl } from "@/app/lib/billiard/api";

async function getNews() {
  try {
    const res = await fetch(apiUrl("/news"), { next: { revalidate: 30 } });
    if (!res.ok) return { data: [] };
    return res.json();
  } catch {
    return { data: [] };
  }
}

function formatDate(value?: string | null) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function NewsPage() {
  const data = await getNews();
  const items = data.data || [];

  return (
    <div className="space-y-6 pb-8">
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-[0.18em] text-cyan-400">NEWS</p>
        <h1 className="font-display text-3xl tracking-tight text-slate-100 sm:text-4xl">اخبار و اطلاعیه‌ها</h1>
        <p className="max-w-xl text-sm leading-7 text-slate-400">
          آخرین خبرهای هیأت، زمان‌بندی مسابقات و اطلاعیه‌های رسمی.
        </p>
      </header>

      {!items.length ? (
        <div className="card-soft px-4 py-14 text-center text-sm text-slate-500">
          هنوز خبری منتشر نشده است.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((n: any, index: number) => (
            <Link
              key={n.id}
              href={`/billiard/news/${n.slug}`}
              className={`group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:-translate-y-0.5 hover:border-cyan-400/35 hover:bg-white/[0.07] ${
                index === 0 ? "sm:col-span-2" : ""
              }`}
            >
              <div
                className={`bg-cover bg-center ${
                  index === 0 ? "aspect-[16/9] sm:aspect-[21/9]" : "aspect-[16/10]"
                }`}
                style={
                  n.cover_url
                    ? {
                        backgroundImage: `linear-gradient(180deg, transparent 45%, rgba(11,15,26,.85)), url(${n.cover_url})`,
                      }
                    : {
                        backgroundImage:
                          "radial-gradient(circle at 20% 20%, rgba(34,211,238,.28), transparent 45%), linear-gradient(135deg, #1e1b4b, #0b0f1a)",
                      }
                }
              />
              <div className="space-y-2 p-4 sm:p-5">
                <div className="text-xs text-slate-500">{formatDate(n.published_at)}</div>
                <h2
                  className={`font-semibold leading-8 text-slate-100 group-hover:text-cyan-300 ${
                    index === 0 ? "text-xl sm:text-2xl" : "text-lg"
                  }`}
                >
                  {n.title}
                </h2>
                <p className="line-clamp-2 text-sm leading-7 text-slate-400">{n.excerpt}</p>
                <div className="pt-1 text-sm font-medium text-cyan-400">ادامه مطلب ←</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
