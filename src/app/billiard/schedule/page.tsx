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
      <h1 className="mb-2 font-display text-3xl text-slate-100">برنامه بازی‌ها</h1>
      <p className="mb-6 text-sm text-slate-400">زمان‌بندی میزها و مراحل مسابقات</p>
      <div className="card-soft overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-right text-slate-500">
              <th className="py-2.5 font-medium">تاریخ</th>
              <th className="font-medium">ساعت</th>
              <th className="font-medium">میز</th>
              <th className="font-medium">بازیکن ۱</th>
              <th className="font-medium">بازیکن ۲</th>
              <th className="font-medium">مرحله</th>
              <th className="font-medium">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {(data.data || []).map((m: any) => (
              <tr key={m.id} className="border-b border-white/5 text-slate-200">
                <td className="py-3">{m.scheduled_on || "—"}</td>
                <td>{m.scheduled_at || "—"}</td>
                <td>{m.table?.name || "—"}</td>
                <td>{m.player1?.full_name || "TBD"}</td>
                <td>{m.player2?.full_name || "TBD"}</td>
                <td className="text-slate-400">{m.round_label}</td>
                <td className="text-cyan-300/90">{statusLabel[m.status] || m.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.data?.length && <p className="py-6 text-center text-slate-500">برنامه‌ای ثبت نشده است.</p>}
      </div>
    </div>
  );
}
