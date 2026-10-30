import { apiUrl } from "@/app/lib/billiard/api";
import { ScheduleClient } from "./ScheduleClient";

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
      <ScheduleClient matches={data.data || []} />
    </div>
  );
}
