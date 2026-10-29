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
      <h1 className="mb-2 font-display text-3xl">رنکینگ</h1>
      <p className="mb-6 text-sm text-felt-700/70">بر اساس آخرین تورنمنت‌های هر رشته</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {(data?.disciplines || []).map((d: any) => (
          <Link
            key={d.id}
            href={`/billiard/ranking?discipline_id=${d.id}`}
            className={`rounded-full px-3 py-1.5 text-sm ${
              Number(data?.discipline_id) === d.id ? "bg-felt-700 text-white" : "bg-white/70"
            }`}
          >
            {d.name}
          </Link>
        ))}
      </div>
      <div className="card-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-felt-900/10 text-right text-felt-600">
              <th className="py-2">رتبه</th>
              <th>بازیکن</th>
              <th>امتیاز</th>
              <th>برد/باخت</th>
              <th>قهرمانی</th>
            </tr>
          </thead>
          <tbody>
            {(data?.entries || []).map((e: any) => (
              <tr key={e.player_id} className="border-b border-felt-900/5">
                <td className="py-2.5">{e.rank}</td>
                <td>
                  <Link href={`/billiard/players/${e.player_id}`} className="hover:underline">
                    {e.player?.full_name}
                  </Link>
                </td>
                <td>{e.points}</td>
                <td>
                  {e.wins}/{e.losses}
                </td>
                <td>{e.titles}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.entries?.length && <p className="py-6 text-center text-felt-600">رنکینگی ثبت نشده است.</p>}
      </div>
    </div>
  );
}
