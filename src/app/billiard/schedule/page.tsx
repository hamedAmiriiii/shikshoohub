import { apiUrl, statusLabel } from "@/app/lib/billiard/api";

async function getSchedule() {
  try {
    const res = await fetch(apiUrl("/schedule"), { next: { revalidate: 15 } });
    if (!res.ok) return { data: [] };
    return res.json();
  } catch {
    return { data: [] };
  }
}

export default async function SchedulePage() {
  const data = await getSchedule();
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">برنامه بازی‌ها</h1>
      <div className="card-soft overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-felt-900/10 text-right text-felt-600">
              <th className="py-2">تاریخ</th>
              <th>ساعت</th>
              <th>میز</th>
              <th>بازیکن ۱</th>
              <th>بازیکن ۲</th>
              <th>مرحله</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {(data.data || []).map((m: any) => (
              <tr key={m.id} className="border-b border-felt-900/5">
                <td className="py-2">{m.scheduled_on || "—"}</td>
                <td>{m.scheduled_at || "—"}</td>
                <td>{m.table?.name || "—"}</td>
                <td>{m.player1?.full_name || "TBD"}</td>
                <td>{m.player2?.full_name || "TBD"}</td>
                <td>{m.round_label}</td>
                <td>{statusLabel[m.status] || m.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.data?.length && <p className="py-6 text-center text-felt-600">برنامه‌ای ثبت نشده است.</p>}
      </div>
    </div>
  );
}
