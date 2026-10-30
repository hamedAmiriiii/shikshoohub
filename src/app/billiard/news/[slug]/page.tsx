import Link from "next/link";
import { notFound } from "next/navigation";
import { apiUrl } from "@/app/lib/billiard/api";
import { NewsCover } from "../NewsCover";

async function getNews(slug: string) {
  try {
    const res = await fetch(apiUrl(`/news/${slug}`), { next: { revalidate: 30 } });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
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

export default async function NewsItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getNews(slug);
  if (!data) notFound();
  const n = data.news;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-10">
      <Link href="/billiard/news" className="inline-flex min-h-10 items-center text-sm text-cyan-400 hover:text-cyan-300 transition">
        → بازگشت به اخبار
      </Link>

      <article className="rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
        <NewsCover url={n.cover_url} alt={n.title} />
        <div className="text-[11px] text-slate-500">{formatDate(n.published_at)}</div>
        <h1 className="mt-1 font-display text-xl leading-8 text-slate-100 sm:text-2xl">{n.title}</h1>
        <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">{n.body}</div>
      </article>
    </div>
  );
}
