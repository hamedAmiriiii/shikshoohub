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
      <h1 className="mb-2 font-display text-3xl">بازیکنان</h1>
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
          <Link key={p.id} href={`/billiard/players/${p.id}`} className="card-soft flex items-center gap-3">
            <div
              className="h-14 w-14 rounded-full bg-felt-200 bg-cover bg-center"
              style={p.photo_url ? { backgroundImage: `url(${p.photo_url})` } : undefined}
            />
            <div>
              <div className="font-medium">{p.full_name}</div>
              <div className="text-xs text-felt-600">
                {[p.city, p.club].filter(Boolean).join(" · ")}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
