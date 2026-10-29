import { apiUrl } from "@/app/lib/billiard/api";
import { TournamentCard, type Tournament } from "@/app/billiard/components/TournamentCard";

async function getArchive() {
  try {
    const res = await fetch(apiUrl("/tournaments?archive=1"), { next: { revalidate: 60 } });
    if (!res.ok) return { data: [] };
    return res.json();
  } catch {
    return { data: [] };
  }
}

export default async function ArchivePage() {
  const data = await getArchive();
  return (
    <div>
      <h1 className="mb-2 font-display text-3xl text-slate-100">آرشیو مسابقات</h1>
      <p className="mb-6 text-sm text-slate-400">مسابقات برگزارشده و نتایج آرشیو</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data.data || []).map((t: Tournament) => (
          <TournamentCard key={t.id} t={t} />
        ))}
      </div>
      {!data.data?.length && <p className="text-sm text-slate-500">آرشیوی موجود نیست.</p>}
    </div>
  );
}
