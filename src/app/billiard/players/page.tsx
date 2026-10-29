import Link from "next/link";
import { apiUrl } from "@/app/lib/billiard/api";

async function getPlayers(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  try {
    const res = await fetch(apiUrl(`/players${qs}`), { next: { revalidate: 20 } });
    if (!res.ok) return { data: [] };
    return res.json();
  } catch {
    return { data: [] };
  }
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const data = await getPlayers(sp.q);

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl text-slate-100">بازیکنان</h1>
      <p className="mb-6 text-sm text-slate-400">جستجو و مشاهده پروفایل بازیکنان</p>
      <form className="mb-6">
        <input
          name="q"
          defaultValue={sp.q || ""}
          placeholder="جستجوی نام، شهر یا باشگاه..."
          className="input max-w-md"
        />
      </form>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {(data.data || []).map((p: any) => (
          <Link
            key={p.id}
            href={`/billiard/players/${p.id}`}
            className="card-soft flex items-center gap-3 transition hover:border-cyan-400/30"
          >
            <div
              className="h-14 w-14 rounded-full border border-white/10 bg-white/10 bg-cover bg-center"
              style={p.photo_url ? { backgroundImage: `url(${p.photo_url})` } : undefined}
            />
            <div>
              <div className="font-medium text-slate-100">{p.full_name}</div>
              <div className="text-xs text-slate-500">{[p.city, p.club].filter(Boolean).join(" · ")}</div>
            </div>
          </Link>
        ))}
      </div>
      {!data.data?.length && <p className="mt-4 text-sm text-slate-500">بازیکنی پیدا نشد.</p>}
    </div>
  );
}
