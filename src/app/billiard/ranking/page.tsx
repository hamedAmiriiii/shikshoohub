import Link from "next/link";
import { apiUrl } from "@/app/lib/billiard/api";

async function getRanking(disciplineId?: string) {
  const qs = disciplineId ? `?discipline_id=${disciplineId}` : "";
  try {
    const res = await fetch(apiUrl(`/ranking${qs}`), { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ discipline_id?: string }>;
}) {
  const sp = await searchParams;
  const data = await getRanking(sp.discipline_id);

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl text-slate-100">رنکینگ</h1>
      <p className="mb-6 text-sm text-slate-400">بر اساس آخرین تورنمنت‌های هر رشته</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {(data?.disciplines || []).map((d: any) => {
          const active = Number(data?.discipline_id) === d.id;
          return (
            <Link
              key={d.id}
              href={`/billiard/ranking?discipline_id=${d.id}`}
              className={`rounded-xl px-3.5 py-1.5 text-sm transition ${
                active
                  ? "bg-gradient-to-l from-cyan-500 to-violet-600 text-white"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {d.name}
            </Link>
          );
        })}
      </div>
      <div className="card-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-right text-slate-500">
              <th className="py-2.5 font-medium">رتبه</th>
              <th className="font-medium">بازیکن</th>
              <th className="font-medium">امتیاز</th>
              <th className="font-medium">برد/باخت</th>
              <th className="font-medium">قهرمانی</th>
            </tr>
          </thead>
          <tbody>
            {(data?.entries || []).map((e: any) => (
              <tr key={e.player_id} className="border-b border-white/5 text-slate-200">
                <td className="py-3 text-cyan-400">{e.rank}</td>
                <td>
                  <Link href={`/billiard/players/${e.player_id}`} className="hover:text-cyan-300 transition">
                    {e.player?.full_name}
                  </Link>
                </td>
                <td className="text-fuchsia-300">{e.points}</td>
                <td className="text-slate-400">
                  {e.wins}/{e.losses}
                </td>
                <td>{e.titles}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.entries?.length && <p className="py-6 text-center text-slate-500">رنکینگی ثبت نشده است.</p>}
      </div>
    </div>
  );
}
