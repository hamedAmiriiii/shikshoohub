"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  isOilApiError,
  oilBroadcastMessage,
  oilListBroadcastCustomers,
  type OilBroadcastCustomer,
} from "@/app/lib/oil/api";
import { toEnglishDigits } from "@/app/lib/oil/plate";
import OilSmsQuotaCard from "../../OilSmsQuotaCard";

export default function OilBroadcastSmsPage() {
  const [customers, setCustomers] = useState<OilBroadcastCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [manualPhones, setManualPhones] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await oilListBroadcastCustomers();
        if (cancelled) return;
        if (isOilApiError(res)) {
          toast.error(res.message);
          return;
        }
        setCustomers(Array.isArray(res.customers) ? res.customers : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const searchNorm = search.trim().toLowerCase().replace(/\s/g, "");

  const filtered = useMemo(() => {
    if (!searchNorm) return customers;
    return customers.filter((c) => {
      const phone = String(c.phone || "").replace(/\s/g, "");
      const name = String(c.name || "").toLowerCase().replace(/\s/g, "");
      return phone.includes(searchNorm) || name.includes(searchNorm);
    });
  }, [customers, searchNorm]);

  const filteredManual = useMemo(() => {
    if (!searchNorm) return manualPhones;
    return manualPhones.filter((p) => p.includes(searchNorm));
  }, [manualPhones, searchNorm]);

  const allFilteredSelected = useMemo(() => {
    const phones = [...filtered.map((c) => c.phone), ...filteredManual].filter(Boolean);
    return phones.length > 0 && phones.every((p) => selected.includes(p));
  }, [filtered, filteredManual, selected]);

  const toggle = (phone: string) => {
    setSelected((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone],
    );
  };

  const selectAllFiltered = (checked: boolean) => {
    const phones = [...filtered.map((c) => c.phone), ...filteredManual].filter(Boolean);
    if (checked) {
      setSelected((prev) => Array.from(new Set([...prev, ...phones])));
    } else {
      const remove = new Set(phones);
      setSelected((prev) => prev.filter((p) => !remove.has(p)));
    }
  };

  const addManual = () => {
    const phone = toEnglishDigits(manualInput).replace(/\D/g, "").slice(0, 11);
    if (!/^09\d{9}$/.test(phone)) {
      toast.error("شماره باید با ۰۹ شروع شود و ۱۱ رقم باشد");
      return;
    }
    if (selected.includes(phone) || manualPhones.includes(phone) || customers.some((c) => c.phone === phone)) {
      toast.error("این شماره قبلاً هست");
      return;
    }
    setManualPhones((prev) => [...prev, phone]);
    setSelected((prev) => [...prev, phone]);
    setManualInput("");
  };

  const handleSend = async () => {
    if (selected.length === 0) {
      toast.error("حداقل یک شماره انتخاب کنید");
      return;
    }
    if (!message.trim()) {
      toast.error("متن پیام را وارد کنید");
      return;
    }
    setSending(true);
    try {
      const res = await oilBroadcastMessage(message.trim(), selected);
      if (isOilApiError(res)) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message || `پیام برای ${selected.length} شماره ارسال شد`);
      setSelected(manualPhones);
      setMessage("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="oil-page" style={{ paddingBottom: 88 }}>
      <OilSmsQuotaCard />

      <p className="oil-muted" style={{ marginTop: 12 }}>
        مشتریان تعویض روغن را انتخاب کنید یا شماره دستی اضافه کنید و پیام بفرستید.
      </p>

      <div className="oil-field">
        <label>متن پیام</label>
        <textarea
          rows={4}
          value={message}
          placeholder="متن پیامک…"
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: "100%", resize: "vertical" }}
        />
      </div>

      <button
        type="button"
        className="oil-btn oil-btn-primary"
        disabled={sending}
        onClick={() => void handleSend()}
      >
        {sending ? "در حال ارسال…" : `ارسال به ${selected.length || 0} شماره`}
      </button>

      <div className="oil-field" style={{ marginTop: 16 }}>
        <label>جستجو</label>
        <input
          value={search}
          placeholder="موبایل یا نام"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="oil-field oil-field-row">
        <label>شماره دستی</label>
        <input
          dir="ltr"
          inputMode="numeric"
          placeholder="09121234567"
          value={manualInput}
          onChange={(e) =>
            setManualInput(toEnglishDigits(e.target.value).replace(/\D/g, "").slice(0, 11))
          }
        />
      </div>
      <button type="button" className="oil-btn oil-btn-ghost" onClick={addManual}>
        افزودن شماره
      </button>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 16,
          marginBottom: 8,
          fontWeight: 700,
        }}
      >
        <input
          type="checkbox"
          checked={allFilteredSelected}
          onChange={(e) => selectAllFiltered(e.target.checked)}
        />
        انتخاب همه فیلترشده
      </label>

      {loading ? (
        <div className="oil-empty">در حال بارگذاری مشتریان…</div>
      ) : filtered.length === 0 && filteredManual.length === 0 ? (
        <div className="oil-empty">مشتری‌ای پیدا نشد.</div>
      ) : (
        <ul className="oil-product-list">
          {filteredManual.map((phone) => (
            <li key={`m-${phone}`} className="oil-product-row">
              <label style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                <input
                  type="checkbox"
                  checked={selected.includes(phone)}
                  onChange={() => toggle(phone)}
                />
                <span dir="ltr">{phone}</span>
                <em className="oil-kind-badge">دستی</em>
              </label>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  setManualPhones((prev) => prev.filter((p) => p !== phone));
                  setSelected((prev) => prev.filter((p) => p !== phone));
                }}
              >
                حذف
              </button>
            </li>
          ))}
          {filtered.map((c) => (
            <li key={c.phone} className="oil-product-row">
              <label style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <input
                  type="checkbox"
                  checked={selected.includes(c.phone)}
                  onChange={() => toggle(c.phone)}
                />
                <span style={{ minWidth: 0 }}>
                  {c.name ? <strong style={{ display: "block" }}>{c.name}</strong> : null}
                  <span dir="ltr">{c.phone}</span>
                  <small className="oil-muted" style={{ display: "block" }}>
                    {c.total_purchases} مراجعه
                  </small>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
