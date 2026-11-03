"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, type ApiError } from "@/app/lib/billiard/api";
import { useAuth } from "@/app/lib/billiard/auth";
import { billiardHref } from "@/app/lib/billiardHosts";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";

type Discipline = { id: number; name: string; is_active?: boolean };
type Competition = {
  id: number;
  title: string;
  discipline_id: number;
  discipline?: Discipline | null;
};
type EntryRequest = {
  id: number;
  title: string;
  status: string;
  status_label: string;
  note?: string | null;
  admin_note?: string | null;
  discipline?: Discipline | null;
  created_at?: string | null;
};

export default function NationalEntryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [mine, setMine] = useState<EntryRequest[]>([]);
  const [competitionId, setCompetitionId] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [title, setTitle] = useState("");
  const [disciplineId, setDisciplineId] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace(billiardHref("/login"));
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      apiFetch<{ data: Competition[] }>("/national-competitions"),
      apiFetch<{ data: Discipline[] }>("/disciplines", { auth: false }),
      apiFetch<{ data: EntryRequest[] }>("/me/national-entry-requests"),
    ])
      .then(([c, d, m]) => {
        setCompetitions(c.data || []);
        setDisciplines((d.data || []).filter((x) => x.is_active !== false));
        setMine(m.data || []);
        if (!(c.data || []).length) setCustomMode(true);
      })
      .catch(() => setMsg("بارگذاری فرم ناموفق بود."));
  }, [user]);

  const selected = useMemo(
    () => competitions.find((c) => String(c.id) === competitionId) || null,
    [competitions, competitionId],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const body: Record<string, unknown> = { note: note.trim() || undefined };
      if (!customMode && competitionId) {
        body.national_competition_id = Number(competitionId);
      } else {
        body.title = title.trim();
        body.discipline_id = Number(disciplineId);
      }
      const res = await apiFetch<{ message: string; request: EntryRequest }>("/national-entry-requests", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setMsg(res.message || "ثبت شد.");
      setNote("");
      setTitle("");
      setCompetitionId("");
      setDisciplineId("");
      const list = await apiFetch<{ data: EntryRequest[] }>("/me/national-entry-requests");
      setMine(list.data || []);
    } catch (err) {
      setMsg((err as ApiError).message || "خطا در ثبت درخواست");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return <p className="text-slate-400">در حال بارگذاری...</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="font-display text-3xl text-slate-100">درخواست شرکت در مسابقات کشوری</h1>
        <p className="mt-2 text-sm text-slate-400">
          عنوان مسابقه و نوع (رشته) را انتخاب کنید تا درخواستتان برای هیأت ثبت شود.
        </p>
      </div>

      <form onSubmit={submit} className="card-soft space-y-3">
        {competitions.length > 0 && (
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              className={`rounded-xl px-3 py-1.5 ${!customMode ? "bg-cyan-500/20 text-cyan-200" : "text-slate-400"}`}
              onClick={() => setCustomMode(false)}
            >
              از فهرست
            </button>
            <button
              type="button"
              className={`rounded-xl px-3 py-1.5 ${customMode ? "bg-cyan-500/20 text-cyan-200" : "text-slate-400"}`}
              onClick={() => setCustomMode(true)}
            >
              عنوان دستی
            </button>
          </div>
        )}

        {!customMode ? (
          <div>
            <label className="label">عنوان مسابقه</label>
            <select
              className="input"
              value={competitionId}
              onChange={(e) => setCompetitionId(e.target.value)}
              required
            >
              <option value="">انتخاب کنید</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                  {c.discipline?.name ? ` — ${c.discipline.name}` : ""}
                </option>
              ))}
            </select>
            {selected?.discipline?.name && (
              <p className="mt-1 text-xs text-slate-500">نوع: {selected.discipline.name}</p>
            )}
          </div>
        ) : (
          <>
            <div>
              <label className="label">عنوان مسابقه</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً مسابقات کشوری پاکت ۱۴۰۴"
                required
              />
            </div>
            <div>
              <label className="label">نوع (رشته)</label>
              <select
                className="input"
                value={disciplineId}
                onChange={(e) => setDisciplineId(e.target.value)}
                required
              >
                <option value="">انتخاب کنید</option>
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <label className="label">توضیح (اختیاری)</label>
          <textarea className="input min-h-[88px]" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {msg && <p className="text-sm text-cyan-300">{msg}</p>}
        <BilliardButton type="submit" loading={busy} fullWidth>
          ثبت درخواست
        </BilliardButton>
      </form>

      <section>
        <h2 className="mb-3 font-display text-xl text-slate-100">درخواست‌های من</h2>
        <div className="card-soft divide-y divide-white/10">
          {mine.length === 0 && <p className="py-3 text-sm text-slate-500">هنوز درخواستی ندارید.</p>}
          {mine.map((r) => (
            <div key={r.id} className="py-3 text-sm">
              <div className="font-medium text-slate-100">{r.title}</div>
              <div className="text-xs text-slate-500">
                {r.discipline?.name ? `${r.discipline.name} · ` : ""}
                {r.status_label}
              </div>
              {r.admin_note && <div className="mt-1 text-xs text-amber-200/90">یادداشت مدیر: {r.admin_note}</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
