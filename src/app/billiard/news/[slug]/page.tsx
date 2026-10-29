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
      <Link href="/billiard/news" className="inline-flex min-h-10 items-center text-sm text-felt-700">
        → بازگشت به اخبار
      </Link>

      <div className="overflow-hidden rounded-[1.75rem] border border-felt-900/8 bg-white/85 shadow-sm backdrop-blur">
        <div
          className="aspect-[16/10] bg-felt-800 bg-cover bg-center sm:aspect-[21/9]"
          style={
            n.cover_url
              ? { backgroundImage: `url(${n.cover_url})` }
              : {
                  backgroundImage:
                    "radial-gradient(circle at 30% 30%, rgba(196,137,74,.4), transparent 40%), linear-gradient(135deg, #1f5038, #0b1e16)",
                }
          }
        />
        <div className="space-y-4 p-5 sm:p-8">
          <div className="text-xs text-felt-600">{formatDate(n.published_at)}</div>
          <h1 className="text-2xl font-semibold leading-10 tracking-tight text-felt-950 sm:text-4xl sm:leading-[1.35]">
            {n.title}
          </h1>
          <div className="whitespace-pre-wrap text-[15px] leading-8 text-felt-900/90 sm:text-base sm:leading-8">
            {n.body}
          </div>
        </div>
      </div>
    </article>
  );
}
