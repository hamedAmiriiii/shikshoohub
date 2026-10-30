import Link from "next/link";
import { apiUrl } from "@/app/lib/billiard/api";
import { NewsCover } from "./NewsCover";

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
      month: "short",
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
    <div className="space-y-4 pb-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl tracking-tight text-slate-100 sm:text-3xl">اخبار</h1>
        <p className="text-xs leading-6 text-slate-400">تیتر و متن کوتاه هر خبر</p>
      </header>

      {!items.length ? (
        <div className="card-soft px-4 py-10 text-center text-sm text-slate-500">هنوز خبری منتشر نشده است.</div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((n: any) => (
            <Link
              key={n.id}
              href={`/billiard/news/${n.slug}`}
              className="group block overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition hover:border-cyan-400/30"
            >
              <NewsCover url={n.cover_url} alt={n.title} />
              <div className="text-[10px] text-slate-500">{formatDate(n.published_at)}</div>
              <h2 className="text-sm font-semibold leading-6 text-slate-100 group-hover:text-cyan-300">
                {n.title}
              </h2>
              <p className="mt-0.5 line-clamp-3 text-xs leading-5 text-slate-400">{n.excerpt}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
