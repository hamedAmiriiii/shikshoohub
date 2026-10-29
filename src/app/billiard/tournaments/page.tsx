import Link from "next/link";
import { apiUrl } from "@/app/lib/billiard/api";
import { TournamentCard, type Tournament } from "@/app/billiard/components/TournamentCard";

async function getTournaments(searchParams: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  if (searchParams.status) qs.set("status", searchParams.status);
  if (searchParams.archive) qs.set("archive", searchParams.archive);
  try {
    const res = await fetch(apiUrl(`/tournaments?${qs}`), { next: { revalidate: 20 } });
    if (!res.ok) return { data: [] as Tournament[] };
    return res.json();
  } catch {
    return { data: [] as Tournament[] };
  }
}

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const data = await getTournaments(sp);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">مسابقات</h1>
          <p className="mt-1 text-sm text-felt-700/70">لیست تورنمنت‌های هیأت</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/billiard/tournaments" className="btn-secondary">
            همه
          </Link>
          <Link href="/billiard/tournaments?status=live" className="btn-secondary">
            زنده
          </Link>
          <Link href="/billiard/tournaments?status=registration_open" className="btn-secondary">
            ثبت‌نام باز
          </Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data.data || []).map((t: Tournament) => (
          <TournamentCard key={t.id} t={t} />
        ))}
      </div>
    </div>
  );
}
