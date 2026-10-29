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
  const status = sp.status || "";

  const filters = [
    { href: "/billiard/tournaments", label: "همه", value: "" },
    { href: "/billiard/tournaments?status=live", label: "زنده", value: "live" },
    { href: "/billiard/tournaments?status=registration_open", label: "ثبت‌نام باز", value: "registration_open" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-slate-100">مسابقات</h1>
          <p className="mt-1 text-sm text-slate-400">لیست تورنمنت‌های هیأت</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {filters.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={`rounded-xl px-3.5 py-2 transition ${
                status === f.value
                  ? "bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/30"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data.data || []).map((t: Tournament) => (
          <TournamentCard key={t.id} t={t} />
        ))}
      </div>
      {!data.data?.length && (
        <p className="card-soft mt-2 text-center text-sm text-slate-500">مسابقه‌ای پیدا نشد.</p>
      )}
    </div>
  );
}
