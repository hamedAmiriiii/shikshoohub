"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  isOilApiError,
  oilCreateProduct,
  oilDeleteProduct,
  oilListProducts,
  oilLogout,
  oilPatchProduct,
  oilPatchShop,
  normalizeOilProductCatalog,
} from "@/app/lib/oil/api";
import { formatKm, toEnglishDigits } from "@/app/lib/oil/plate";
import type { OilProduct, OilProductKind, OilProductKindGroup } from "@/app/lib/oil/types";
import { OIL_PRODUCT_KINDS } from "@/app/lib/oil/types";
import { useOilAuth } from "../OilAuth";
import OilSmsQuotaCard from "../OilSmsQuotaCard";

const emptyDrafts: Record<OilProductKind, string> = {
  oil: "",
  air_filter: "",
  oil_filter: "",
};

function productPlaceholder(kind: OilProductKind) {
  if (kind === "oil") return "مثلاً بهران ۱۰W۴۰";
  if (kind === "air_filter") return "مثلاً سرکان";
  return "مثلاً فولکس";
}

export default function OilSettingsPage() {
  const router = useRouter();
  const { session, setSession, logoutLocal } = useOilAuth();
  const [shopName, setShopName] = useState(session?.shop?.name || "");
  const [intervalKm, setIntervalKm] = useState(
    String(session?.shop?.oil_interval_km || 5000),
  );
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<OilProductKindGroup[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [drafts, setDrafts] = useState(emptyDrafts);
  const [addingKind, setAddingKind] = useState<OilProductKind | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const days = session?.shop_access?.shop_access_days_remaining;
  const active = session?.shop_access?.shop_access_active !== false;

  const loadCatalog = async () => {
    setCatalogLoading(true);
    try {
      const res = await oilListProducts(true);
      if (isOilApiError(res)) {
        toast.error(res.message);
        setCatalog(normalizeOilProductCatalog(null));
        return;
      }
      setCatalog(normalizeOilProductCatalog(res));
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    setShopName(session.shop.name);
    setIntervalKm(String(session.shop.oil_interval_km || 5000));
  }, [session]);

  useEffect(() => {
    if (!session) return;
    void loadCatalog();
  }, [session]);

  const handleSave = async () => {
    const km = Number(toEnglishDigits(intervalKm).replace(/\D/g, ""));
    const body: { shop_name?: string; oil_interval_km?: number } = {};
    if (shopName.trim() && shopName.trim() !== session?.shop?.name) {
      body.shop_name = shopName.trim();
    }
    if (Number.isFinite(km) && km !== session?.shop?.oil_interval_km) {
      body.oil_interval_km = km;
    }
    if (!body.shop_name && body.oil_interval_km == null) {
      toast.info("تغییری برای ذخیره نیست");
      return;
    }
    setSaving(true);
    try {
      const res = await oilPatchShop(body);
      if (isOilApiError(res)) {
        toast.error(res.message);
        return;
      }
      setSession(res);
      toast.success("تنظیمات ذخیره شد");
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = async (kind: OilProductKind) => {
    const name = drafts[kind].trim();
    if (!name) {
      toast.error("نام محصول را وارد کنید");
      return;
    }
    setAddingKind(kind);
    try {
      const res = await oilCreateProduct({ kind, name });
      if (isOilApiError(res)) {
        toast.error(res.message);
        return;
      }
      setDrafts((prev) => ({ ...prev, [kind]: "" }));
      toast.success(res.message || "محصول اضافه شد.");
      await loadCatalog();
    } finally {
      setAddingKind(null);
    }
  };

  const handleSaveName = async (product: OilProduct) => {
    const name = editName.trim();
    if (!name) {
      toast.error("نام محصول را وارد کنید");
      return;
    }
    setBusyId(product.id);
    try {
      const res = await oilPatchProduct(product.id, {
        name,
        is_active: product.is_active,
      });
      if (isOilApiError(res)) {
        toast.error(res.message);
        return;
      }
      setEditingId(null);
      toast.success(res.message || "محصول ویرایش شد.");
      await loadCatalog();
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (product: OilProduct) => {
    setBusyId(product.id);
    try {
      const res = await oilPatchProduct(product.id, { is_active: !product.is_active });
      if (isOilApiError(res)) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message || (product.is_active ? "غیرفعال شد." : "فعال شد."));
      await loadCatalog();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (product: OilProduct) => {
    if (
      !window.confirm(
        `«${product.name}» حذف شود؟ اگر در سابقه استفاده شده باشد فقط غیرفعال می‌شود.`,
      )
    ) {
      return;
    }
    setBusyId(product.id);
    try {
      const res = await oilDeleteProduct(product.id);
      if (isOilApiError(res)) {
        toast.error(res.message);
        return;
      }
      toast.success(
        res.message ||
          (res.data && res.data.is_active === false
            ? "چون در سابقه استفاده شده، فقط غیرفعال شد."
            : "حذف شد."),
      );
      await loadCatalog();
    } finally {
      setBusyId(null);
    }
  };

  const handleLogout = async () => {
    await oilLogout();
    logoutLocal();
    router.replace("/oil/login");
  };

  const groups =
    catalog.length > 0
      ? catalog
      : OIL_PRODUCT_KINDS.map((k) => ({ ...k, products: [] as OilProductKindGroup["products"] }));

  return (
    <div className="oil-page">
      <div className={`oil-banner ${active ? "ok" : "warn"}`}>
        {active
          ? `دسترسی فعال است${days != null ? ` — ${days} روز مانده` : ""}`
          : "دوره دسترسی مغازه تمام شده است."}
      </div>

      <OilSmsQuotaCard />

      <div className="oil-field">
        <label>نام مغازه</label>
        <input
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
        />
      </div>
      <div className="oil-field">
        <label>فاصله تعویض بعدی (کیلومتر)</label>
        <input
          dir="ltr"
          inputMode="numeric"
          value={intervalKm}
          onChange={(e) =>
            setIntervalKm(toEnglishDigits(e.target.value).replace(/\D/g, "").slice(0, 5))
          }
        />
        <p className="oil-muted" style={{ marginTop: 6 }}>
          الان {formatKm(Number(intervalKm) || 0)} کیلومتر بعد از هر تعویض پیشنهاد می‌شود.
        </p>
      </div>

      <button
        type="button"
        className="oil-btn oil-btn-primary"
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? "در حال ذخیره…" : "ذخیره"}
      </button>

      <h2 className="oil-section-title">روغن و فیلترها</h2>
      <p className="oil-muted" style={{ marginTop: 0, marginBottom: 12 }}>
        محصول را اینجا تعریف کنید. موقع ثبت تعویض فقط از همین لیست انتخاب می‌شود.
      </p>
      {catalogLoading && catalog.every((g) => g.products.length === 0) ? (
        <p className="oil-muted">در حال بارگذاری محصولات…</p>
      ) : (
        groups.map((group) => (
          <div key={group.kind} className="oil-catalog-block">
            <h3>{group.kind_label}</h3>
            {group.products.length === 0 ? (
              <p className="oil-muted">هنوز محصولی نیست.</p>
            ) : (
              <ul className="oil-catalog-list">
                {group.products.map((product) => {
                  const busy = busyId === product.id;
                  const editing = editingId === product.id;
                  return (
                    <li key={product.id}>
                      <div className="oil-catalog-name">
                        {editing ? (
                          <input
                            value={editName}
                            autoFocus
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void handleSaveName(product);
                              }
                              if (e.key === "Escape") setEditingId(null);
                            }}
                          />
                        ) : (
                          <>
                            <span>{product.name}</span>
                            {!product.is_active && <em>غیرفعال</em>}
                          </>
                        )}
                      </div>
                      <div className="oil-catalog-actions">
                        {editing ? (
                          <button
                            type="button"
                            title="ذخیره"
                            disabled={busy}
                            onClick={() => void handleSaveName(product)}
                          >
                            <Check size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="ویرایش"
                            disabled={busy}
                            onClick={() => {
                              setEditingId(product.id);
                              setEditName(product.name);
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        {product.is_active ? (
                          <button
                            type="button"
                            className="danger"
                            title="حذف"
                            disabled={busy}
                            onClick={() => void handleDelete(product)}
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="فعال‌سازی"
                            disabled={busy}
                            onClick={() => void handleToggleActive(product)}
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="oil-catalog-add">
              <input
                value={drafts[group.kind]}
                placeholder={productPlaceholder(group.kind)}
                onChange={(e) =>
                  setDrafts((prev) => ({ ...prev, [group.kind]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleAddProduct(group.kind);
                  }
                }}
              />
              <button
                type="button"
                className="oil-btn oil-btn-ghost"
                disabled={addingKind === group.kind}
                onClick={() => void handleAddProduct(group.kind)}
              >
                {addingKind === group.kind ? "…" : "افزودن"}
              </button>
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        className="oil-btn oil-btn-danger"
        style={{ marginTop: 16 }}
        onClick={handleLogout}
      >
        خروج
      </button>
    </div>
  );
}
