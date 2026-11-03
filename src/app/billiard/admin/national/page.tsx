"use client";

import { useEffect, useState } from "react";
import { apiFetch, type ApiError } from "@/app/lib/billiard/api";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";

type Discipline = { id: number; name: string };
type Competition = {
  id: number;
  title: string;
  discipline_id: number;
  is_active: boolean;
  sort_order: number;
  discipline?: Discipline | null;
};
type EntryRequest = {
  id: number;
  title: string;
  status: string;
  status_label: string;
  note?: string | null;
  admin_note?: string | null;
  created_at?: string | null;
  discipline?: Discipline | null;
  player?: {
    id: number;
    full_name?: string | null;
    phone?: string;
    city?: string | null;
    club?: string | null;
  } | null;
};

export default function AdminNationalPage() {
  const [tab, setTab] = useState<"requests" | "competitions">("requests");
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [requests, setRequests] = useState<EntryRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [msg, setMsg] = useState("");
  const [title, setTitle] = useState("");
  const [disciplineId, setDisciplineId] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState<number | null>(null);

  async function loadCompetitions() {
    const res = await apiFetch<{ data: Competition[] }>("/admin/national-competitions");
    setCompetitions(res.data || []);
  }

  async function refreshRequests() {
    const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
    const res = await apiFetch<{ data: EntryRequest[] }>(`/admin/national-entry-requests${q}`);
    setRequests(res.data || []);
  }

  useEffect(() => {
    apiFetch<{ data: Discipline[] }>("/admin/disciplines")
      .then((d) => setDisciplines(d.data || []))
      .catch(() => {});
    loadCompetitions().catch(() => setMsg("بارگذاری عناوین ناموفق بود."));
  }, []);

  useEffect(() => {
    refreshRequests().catch(() => setMsg("بارگذاری درخواست‌ها ناموفق بود."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function createCompetition(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !disciplineId) return;
    setBusy(true);
    setMsg("");
    try {
      await apiFetch("/admin/national-competitions", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), discipline_id: Number(disciplineId) }),
      });
      setTitle("");
      setMsg("عنوان اضافه شد.");
      await loadCompetitions();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function toggleCompetition(c: Competition) {
    try {
      await apiFetch(`/admin/national-competitions/${c.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !c.is_active }),
      });
      await loadCompetitions();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    }
  }

  async function removeCompetition(c: Competition) {
    if (!window.confirm(`«${c.title}» حذف شود؟`)) return;
    try {
      await apiFetch(`/admin/national-competitions/${c.id}`, { method: "DELETE" });
      await loadCompetitions();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    }
  }

  async function review(id: number, status: "approved" | "rejected") {
    const admin_note =
      status === "rejected" ? window.prompt("علت رد (اختیاری):") ?? undefined : undefined;
    setReviewBusy(id);
    setMsg("");
    try {
      await apiFetch(`/admin/national-entry-requests/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ status, admin_note: admin_note || undefined }),
      });
      await refreshRequests();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setReviewBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-slate-100">مسابقات کشوری</h1>
        <p className="mt-1 text-sm text-slate-400">عناوین قابل انتخاب و درخواست‌های بازیکنان</p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("requests")}
          className={`rounded-xl px-3 py-2 text-sm ${tab === "requests" ? "bg-violet-600 text-white" : "bg-white/5 text-slate-300"}`}
        >
          درخواست‌ها
        </button>
        <button
          type="button"
          onClick={() => setTab("competitions")}
          className={`rounded-xl px-3 py-2 text-sm ${tab === "competitions" ? "bg-violet-600 text-white" : "bg-white/5 text-slate-300"}`}
        >
          عناوین مسابقه
        </button>
      </div>

      {msg && <p className="text-sm text-cyan-300">{msg}</p>}

      {tab === "requests" ? (
        <div className="space-y-3">
          <select className="input max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="pending">در انتظار</option>
            <option value="approved">تأیید شده</option>
            <option value="rejected">رد شده</option>
            <option value="">همه</option>
          </select>
          <div className="card-soft divide-y divide-white/10">
            {requests.length === 0 && <p className="py-4 text-sm text-slate-500">موردی نیست.</p>}
            {requests.map((r) => (
              <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="font-medium text-slate-100">{r.title}</div>
                  <div className="text-xs text-slate-500">
                    {r.player?.full_name || "—"} · {r.player?.phone}
                    {r.discipline?.name ? ` · ${r.discipline.name}` : ""}
                    {` · ${r.status_label}`}
                  </div>
                  {r.note && <div className="mt-1 text-xs text-slate-400">یادداشت بازیکن: {r.note}</div>}
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <BilliardButton
                      type="button"
                      loading={reviewBusy === r.id}
                      onClick={() => void review(r.id, "approved")}
                    >
                      تأیید
                    </BilliardButton>
                    <BilliardButton
                      type="button"
                      variant="secondary"
                      loading={reviewBusy === r.id}
                      onClick={() => void review(r.id, "rejected")}
                    >
                      رد
                    </BilliardButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <form onSubmit={createCompetition} className="card-soft grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <input
              className="input"
              placeholder="عنوان مسابقه کشوری"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <select className="input" value={disciplineId} onChange={(e) => setDisciplineId(e.target.value)} required>
              <option value="">نوع / رشته</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <BilliardButton type="submit" loading={busy}>
              افزودن
            </BilliardButton>
          </form>
          <div className="card-soft divide-y divide-white/10">
            {competitions.length === 0 && (
              <p className="py-4 text-sm text-slate-500">هنوز عنوانی ثبت نشده. بازیکن می‌تواند عنوان را دستی وارد کند.</p>
            )}
            {competitions.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <div className={`font-medium ${c.is_active ? "text-slate-100" : "text-slate-500"}`}>{c.title}</div>
                  <div className="text-xs text-slate-500">{c.discipline?.name || "—"}</div>
                </div>
                <div className="flex gap-2">
                  <BilliardButton type="button" variant="secondary" onClick={() => void toggleCompetition(c)}>
                    {c.is_active ? "غیرفعال" : "فعال"}
                  </BilliardButton>
                  <BilliardButton type="button" variant="secondary" onClick={() => void removeCompetition(c)}>
                    حذف
                  </BilliardButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
