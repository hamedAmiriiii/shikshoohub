"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import {
  isOilApiError,
  oilCreateProduct,
  oilDeleteProduct,
  oilListProducts,
  oilPatchProduct,
  normalizeOilProductCatalog,
} from "@/app/lib/oil/api";
import { toEnglishDigits } from "@/app/lib/oil/plate";
import type { OilProduct, OilProductKind } from "@/app/lib/oil/types";
import { OIL_PRODUCT_KINDS } from "@/app/lib/oil/types";
import { useOilAuth } from "../OilAuth";

type ProductForm = {
  kind: OilProductKind;
  name: string;
  purchase_price: string;
  sale_price: string;
};

const emptyForm: ProductForm = {
  kind: "oil",
  name: "",
  purchase_price: "",
  sale_price: "",
};

function kindLabel(kind: OilProductKind, fallback?: string) {
  return OIL_PRODUCT_KINDS.find((item) => item.kind === kind)?.kind_label || fallback || kind;
}

function productPlaceholder(kind: OilProductKind) {
  if (kind === "oil") return "مثلاً بهران ۱۰W۴۰";
  if (kind === "air_filter") return "مثلاً سرکان";
  return "مثلاً فولکس";
}

function parsePrice(value: string): number {
  const n = Number(toEnglishDigits(value).replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function priceInput(value: string) {
  return toEnglishDigits(value).replace(/[^\d]/g, "").slice(0, 12);
}

function formatPrice(value: number | string | null | undefined) {
  const n =
    typeof value === "number"
      ? value
      : Number(toEnglishDigits(String(value ?? "")).replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n < 0) return "۰";
  return new Intl.NumberFormat("fa-IR").format(n);
}

export default function OilProductsPage() {
  const { session } = useOilAuth();
  const [products, setProducts] = useState<OilProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OilProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadCatalog = async () => {
    setCatalogLoading(true);
    try {
      const res = await oilListProducts(true);
      if (isOilApiError(res)) {
        toast.error(res.message);
        setProducts([]);
        return;
      }
      setProducts(normalizeOilProductCatalog(res).flatMap((group) => group.products));
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    void loadCatalog();
  }, [session]);

  useEffect(() => {
    if (!formOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) closeForm();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [formOpen, saving]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormOpen(true);
  };

  const openEdit = (product: OilProduct) => {
    setEditing(product);
    setForm({
      kind: product.kind,
      name: product.name,
      purchase_price:
        product.purchase_price == null || product.purchase_price === ""
          ? ""
          : String(parsePrice(String(product.purchase_price))),
      sale_price:
        product.sale_price == null || product.sale_price === ""
          ? ""
          : String(parsePrice(String(product.sale_price))),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setForm({ ...emptyForm });
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("نام محصول را وارد کنید");
      return;
    }
    const purchase_price = parsePrice(form.purchase_price);
    const sale_price = parsePrice(form.sale_price);
    setSaving(true);
    try {
      if (editing) {
        const res = await oilPatchProduct(editing.id, {
          name,
          is_active: editing.is_active,
          purchase_price,
          sale_price,
        });
        if (isOilApiError(res)) {
          toast.error(res.message);
          return;
        }
        toast.success(res.message || "محصول ویرایش شد.");
      } else {
        const res = await oilCreateProduct({
          kind: form.kind,
          name,
          purchase_price,
          sale_price,
        });
        if (isOilApiError(res)) {
          toast.error(res.message);
          return;
        }
        toast.success(res.message || "محصول اضافه شد.");
      }
      setFormOpen(false);
      setEditing(null);
      setForm({ ...emptyForm });
      await loadCatalog();
    } finally {
      setSaving(false);
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

  return (
    <div className="oil-page" style={{ paddingBottom: 88 }}>
      <p className="oil-muted" style={{ marginTop: 0, marginBottom: 12 }}>
        اگر قیمت فروش صفر باشد، با ثبت تعویض فاکتور ساخته نمی‌شود.
      </p>

      {catalogLoading && products.length === 0 ? (
        <p className="oil-muted">در حال بارگذاری محصولات…</p>
      ) : products.length === 0 ? (
        <div className="oil-empty">هنوز محصولی نیست. از دکمه افزودن شروع کنید.</div>
      ) : (
        <ul className="oil-product-list">
          {products.map((product) => {
            const busy = busyId === product.id;
            const saleZero = parsePrice(String(product.sale_price ?? "0")) === 0;
            return (
              <li key={product.id} className="oil-product-row">
                <div className="oil-product-main">
                  <div className="oil-product-title">
                    <span>{product.name}</span>
                    <em className="oil-kind-badge">{kindLabel(product.kind, product.kind_label)}</em>
                  </div>
                  <small className="oil-catalog-price-meta">
                    خرید {formatPrice(product.purchase_price)} — فروش {formatPrice(product.sale_price)}
                    {saleZero ? " (بدون فاکتور)" : ""}
                    {!product.is_active ? " — غیرفعال" : ""}
                  </small>
                </div>
                <div className="oil-catalog-actions">
                  <button
                    type="button"
                    title="ویرایش"
                    disabled={busy}
                    onClick={() => openEdit(product)}
                  >
                    <Pencil size={16} />
                  </button>
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

      <button type="button" className="oil-fab" onClick={openCreate}>
        <Plus size={20} />
        افزودن
      </button>

      {formOpen && (
        <div className="oil-modal-backdrop" onClick={closeForm}>
          <div className="oil-modal" onClick={(e) => e.stopPropagation()}>
            <div className="oil-modal-head">
              <h3>{editing ? "ویرایش محصول" : "محصول جدید"}</h3>
              <button type="button" className="oil-icon-btn" aria-label="بستن" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <div className="oil-field">
              <label>نوع</label>
              <select
                value={form.kind}
                disabled={Boolean(editing)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, kind: e.target.value as OilProductKind }))
                }
              >
                {OIL_PRODUCT_KINDS.map((item) => (
                  <option key={item.kind} value={item.kind}>
                    {item.kind_label}
                  </option>
                ))}
              </select>
            </div>

            <div className="oil-field">
              <label>نام محصول</label>
              <input
                autoFocus
                value={form.name}
                placeholder={productPlaceholder(form.kind)}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSave();
                  }
                }}
              />
            </div>

            <div className="oil-catalog-prices">
              <div className="oil-field">
                <label>قیمت خرید</label>
                <input
                  dir="ltr"
                  inputMode="numeric"
                  placeholder="۰"
                  value={form.purchase_price}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, purchase_price: priceInput(e.target.value) }))
                  }
                />
              </div>
              <div className="oil-field">
                <label>قیمت فروش</label>
                <input
                  dir="ltr"
                  inputMode="numeric"
                  placeholder="۰"
                  value={form.sale_price}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sale_price: priceInput(e.target.value) }))
                  }
                />
              </div>
            </div>

            <button
              type="button"
              className="oil-btn oil-btn-primary"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? "در حال ذخیره…" : editing ? "ذخیره" : "افزودن محصول"}
            </button>
            <button
              type="button"
              className="oil-btn oil-btn-ghost"
              style={{ marginTop: 8 }}
              disabled={saving}
              onClick={closeForm}
            >
              انصراف
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
