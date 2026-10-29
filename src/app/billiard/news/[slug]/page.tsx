import { notFound } from "next/navigation";
import { apiUrl } from "@/app/lib/billiard/api";

async function getNews(slug: string) {
  try {
    const res = await fetch(apiUrl(`/news/${slug}`), { next: { revalidate: 60 } });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function NewsItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getNews(slug);
  if (!data) notFound();
  const n = data.news;
  return (
    <article className="card-soft mx-auto max-w-3xl">
      <h1 className="font-display text-3xl">{n.title}</h1>
      <div className="mt-2 text-xs text-felt-600">{n.published_at}</div>
      <div className="mt-6 whitespace-pre-wrap text-sm leading-7">{n.body}</div>
    </article>
  );
}
