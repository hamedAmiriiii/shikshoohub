import Link from "next/link";
import { apiUrl } from "@/app/lib/billiard/api";

async function getNews() {
  try {
    const res = await fetch(apiUrl("/news"), { next: { revalidate: 60 } });
    if (!res.ok) return { data: [] };
    return res.json();
  } catch {
    return { data: [] };
  }
}

export default async function NewsPage() {
  const data = await getNews();
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">اخبار و اطلاعیه‌ها</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {(data.data || []).map((n: any) => (
          <Link key={n.id} href={`/billiard/news/${n.slug}`} className="card-soft block">
            <h2 className="font-display text-xl">{n.title}</h2>
            <p className="mt-2 text-sm text-felt-700">{n.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
