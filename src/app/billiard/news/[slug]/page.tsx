import Link from "next/link";
import { notFound } from "next/navigation";
import { apiUrl } from "@/app/lib/billiard/api";

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
    <article className="mx-auto max-w-3xl space-y-5 pb-10">
      <Link href="/billiard/news" className="inline-flex min-h-10 items-center text-sm text-cyan-400 hover:text-cyan-300 transition">
        → بازگشت به اخبار
      </Link>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur">
        <div
          className="aspect-[16/10] bg-cover bg-center sm:aspect-[21/9]"
          style={
            n.cover_url
              ? { backgroundImage: `url(${n.cover_url})` }
              : {
                  backgroundImage:
                    "radial-gradient(circle at 30% 30%, rgba(34,211,238,.35), transparent 40%), linear-gradient(135deg, #1e1b4b, #0b0f1a)",
                }
          }
        />
        <div className="space-y-4 p-5 sm:p-8">
          <div className="text-xs text-slate-500">{formatDate(n.published_at)}</div>
          <h1 className="font-display text-2xl leading-10 tracking-tight text-slate-100 sm:text-4xl sm:leading-[1.35]">
            {n.title}
          </h1>
          <div className="whitespace-pre-wrap text-[15px] leading-8 text-slate-300 sm:text-base sm:leading-8">
            {n.body}
          </div>
        </div>
      </div>
    </article>
  );
}
