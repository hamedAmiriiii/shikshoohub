"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Send } from "lucide-react";
import { toast } from "react-toastify";
import { isOilApiError, oilListReminders } from "@/app/lib/oil/api";
import { runOilRemindersForToday } from "@/app/lib/oil/reminders";
import { formatKm } from "@/app/lib/oil/plate";
import type { OilReminderSms } from "@/app/lib/oil/types";
import { useOilAuth } from "../OilAuth";
import OilSmsQuotaCard from "../OilSmsQuotaCard";

export default function OilSmsPage() {
  const { session, ready } = useOilAuth();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<OilReminderSms[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 350);
    return () => clearTimeout(id);
  }, [q]);

  const load = useCallback(async (nextPage: number, replace: boolean) => {
    setLoading(true);
    try {
      const res = await oilListReminders(debounced || undefined, nextPage, 30);
      if (isOilApiError(res)) {
        toast.error(res.message);
        return;
      }
      setPage(res.current_page);
      setLastPage(res.last_page);
      setItems((prev) => (replace ? res.data : [...prev, ...res.data]));
    } finally {
      setLoading(false);
    }
  }, [debounced]);

  useEffect(() => {
    if (!ready || !session?.shop?.id) return;
    const shopId = session.shop.id;
    let cancelled = false;
    void (async () => {
      await runOilRemindersForToday(shopId);
      if (!cancelled) await load(1, true);
    })();
    return () => {
      cancelled = true;
    };
  }, [load, ready, session?.shop?.id]);

  const emptyText = useMemo(() => {
    if (loading && items.length === 0) return "در حال بارگذاری…";
    if (debounced) return "پیامکی با این جستجو پیدا نشد.";
    return "هنوز نوبت نزدیکی نبوده؛ وقتی نزدیک شود پیامک خودکار می‌رود.";
  }, [debounced, items.length, loading]);

  const handleRun = async () => {
    if (!session?.shop?.id) return;
    setRunning(true);
    try {
      const res = await runOilRemindersForToday(session.shop.id, true);
      if (!res) return;
      if (isOilApiError(res)) {
        toast.error(res.message);
        return;
      }
      if (res.sent > 0) toast.success(res.message);
      else if (res.failed > 0) toast.warn(res.message);
      else toast.info(res.message || "نوبت نزدیکی برای ارسال نبود.");
      await load(1, true);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="oil-page">
      <OilSmsQuotaCard />

      <p className="oil-muted" style={{ marginTop: 16, marginBottom: 12 }}>
        با باز شدن اپ در هر روز، نوبت‌های ۱۰ روز آینده خودش پیامک می‌شود. این دکمه برای ارسال دستی است.
      </p>

      <button
        type="button"
        className="oil-btn oil-btn-ghost"
        disabled={running}
        onClick={handleRun}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Send size={18} />
          {running ? "در حال بررسی…" : "بررسی نوبت‌ها و ارسال"}
        </span>
      </button>

      <div style={{ position: "relative", marginTop: 16 }}>
        <Search
          size={18}
          style={{
            position: "absolute",
            left: 12,
            top: 14,
            color: "#9aa3ad",
            pointerEvents: "none",
          }}
        />
        <input
          className="oil-search"
          placeholder="جستجو پلاک، موبایل یا متن"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ paddingLeft: 36 }}
        />
      </div>

      {items.length === 0 ? (
        <div className="oil-empty">{emptyText}</div>
      ) : (
        items.map((row) => (
          <article key={row.id} className="oil-card">
            <div className="oil-card-meta" style={{ marginTop: 0 }}>
              <span className="oil-km">{row.plate_display}</span>
              <span dir="ltr">{row.phone}</span>
            </div>
            <div className="oil-card-meta">
              <span>
                نوبت {row.estimated_due_on_jalali}
                {row.days_until_due != null ? ` — ${row.days_until_due} روز` : ""}
              </span>
              <span>کیلومتر {formatKm(row.next_km)}</span>
            </div>
            <p className="oil-muted" style={{ margin: "8px 0 0", whiteSpace: "pre-line" }}>
              {row.message}
            </p>
            <div className="oil-card-meta">
              <span>{row.created_at_jalali}</span>
              {row.sms_sent ? (
                <span style={{ color: "#8ee0b2" }}>ارسال شد</span>
              ) : (
                <span style={{ color: "#ffb4b4" }}>
                  {row.sms_error || "ارسال نشد"}
                </span>
              )}
            </div>
          </article>
        ))
      )}

      {page < lastPage && (
        <button
          type="button"
          className="oil-btn oil-btn-ghost"
          style={{ marginTop: 16 }}
          disabled={loading}
          onClick={() => void load(page + 1, false)}
        >
          بارگذاری بیشتر
        </button>
      )}
    </div>
  );
}
