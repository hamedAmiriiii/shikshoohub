import { roundSalePrice } from "@/app/lib/salePriceRounding";

export type RawMaterialLot = {
  id: number;
  quantity_kg: number;
  remaining_kg: number;
  price_per_kg: number;
  purchased_at?: string | null;
  note?: string | null;
  invoice_id?: number | null;
  invoice_item_id?: number | null;
  invoice_link?: "whole" | "item" | string | null;
};

export type RawMaterialUnit = "kg" | "piece";

export type RawMaterial = {
  unit_type?: RawMaterialUnit | string | null;
  id: number;
  name: string;
  sale_price?: number;
  note?: string | null;
  stock_kg?: number;
  open_lots_count?: number;
  next_price_per_kg?: number | null;
  lots?: RawMaterialLot[];
  /** عکس لایهٔ منوی سه‌بعدی (PNG شفاف؛ نمای کنار یا بالا بسته به کالا) */
  layer_image_url?: string | null;
};

export type LayerComposeMode = "side" | "overlay";

/** یک لایه در چینش عکس منوی سه‌بعدی */
export type LayerOrderEntry = {
  raw_material_id: number;
  /** مقیاس عرض (۱ = عادی) */
  scale_x: number;
  /** مقیاس ارتفاع (۱ = عادی) */
  scale_y: number;
  /**
   * فاصلهٔ اضافه نسبت به هم‌پوشانی پیش‌فرض (٪).
   * ۰ = حالت عادی · مثبت = جدا · منفی = فشرده‌تر
   */
  gap: number;
};

export const LAYER_SCALE_MIN = 0.4;
export const LAYER_SCALE_MAX = 2;
export const LAYER_SCALE_STEP = 0.05;
export const LAYER_GAP_MIN = -20;
export const LAYER_GAP_MAX = 40;
export const LAYER_GAP_STEP = 1;

export function clampLayerScale(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(LAYER_SCALE_MAX, Math.max(LAYER_SCALE_MIN, Math.round(n * 100) / 100));
}

export function clampLayerGap(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(LAYER_GAP_MAX, Math.max(LAYER_GAP_MIN, Math.round(n)));
}

export function defaultLayerOrderEntry(rawMaterialId: number): LayerOrderEntry {
  return { raw_material_id: rawMaterialId, scale_x: 1, scale_y: 1, gap: 0 };
}

/** CSS transform برای لایه (عرض / ارتفاع جدا) */
export function layerScaleTransform(row: Pick<LayerOrderEntry, "scale_x" | "scale_y">): string {
  return `scale(${clampLayerScale(row.scale_x)}, ${clampLayerScale(row.scale_y)})`;
}

export function parseLayerOrderEntry(raw: unknown): LayerOrderEntry | null {
  if (typeof raw === "number" || typeof raw === "string") {
    const id = Number(raw);
    if (!Number.isFinite(id) || id <= 0) return null;
    return defaultLayerOrderEntry(id);
  }
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = Number(row.raw_material_id ?? row.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const legacy = row.scale != null ? clampLayerScale(row.scale) : null;
  const scaleX = row.scale_x != null ? clampLayerScale(row.scale_x) : legacy ?? 1;
  const scaleY = row.scale_y != null ? clampLayerScale(row.scale_y) : legacy ?? 1;
  return {
    raw_material_id: id,
    scale_x: scaleX,
    scale_y: scaleY,
    gap: clampLayerGap(row.gap ?? 0),
  };
}

export type IngredientCostLot = {
  lot_id?: number | null;
  source_production_id?: number | null;
  quantity_kg: number;
  price_per_kg: number;
  cost: number;
  estimated?: boolean;
};

export type IngredientKind = "raw_material" | "produced_good";

export type IngredientCost = {
  unit_type?: RawMaterialUnit | string | null;
  id?: number;
  ingredient_kind?: IngredientKind | string | null;
  raw_material_id?: number | null;
  ingredient_produced_good_id?: number | null;
  name?: string | null;
  grams_per_kg: number;
  is_removable?: boolean;
  is_addable?: boolean;
  needed_kg?: number;
  cost?: number;
  lots?: IngredientCostLot[];
  shortage_kg?: number;
};

export type MaterialShortage = {
  raw_material_id?: number | null;
  ingredient_produced_good_id?: number | null;
  name?: string | null;
  needed_kg: number;
  shortage_kg: number;
};

export type SalePriceMode = "percent" | "manual";

export type ProducedGood = {
  unit_type?: RawMaterialUnit | string | null;
  /** true = نهایی (منو/فروش) · false = نیمه‌ساخته (فرمول تولید) */
  is_final?: boolean | number | string | null;
  id: number;
  name: string;
  sale_price?: number;
  sale_price_mode?: SalePriceMode | string | null;
  markup_percent?: number | null;
  round_sale_price?: boolean | number | string | null;
  note?: string | null;
  quantity_kg?: number;
  total_cost?: number;
  cost_per_kg?: number;
  profit_per_kg?: number;
  profit_percent?: number | null;
  stock_kg?: number;
  stock_sufficient?: boolean;
  shortages?: MaterialShortage[];
  ingredient_costs?: IngredientCost[];
  /**
   * ترتیب لایه‌های عکس منوی سه‌بعدی (بالا به پایین؛ تکرار مجاز).
   * عدد = فقط شناسه ماده | آبجکت = شناسه + scale_x/scale_y/gap
   */
  layer_order?: Array<number | LayerOrderEntry | Record<string, unknown>> | null;
  /** side = ساندویچ نمای کنار | overlay = پیتزا نمای بالا */
  layer_compose?: LayerComposeMode | string | null;
  /** عکس کلی کالا (بدون لایه‌های مواد)؛ اگر نباشد از لایه‌ها استفاده می‌شود */
  cover_image_url?: string | null;
  cover_image_path?: string | null;
  category_ids?: Array<number | string>;
  categories?: Array<{ id?: number | string; name?: string } | number | string>;
};

export function layerComposeFromGood(good: ProducedGood): LayerComposeMode {
  return good.layer_compose === "overlay" ? "overlay" : "side";
}

export function categoryIdsFromGood(good: ProducedGood): number[] {
  const ids: number[] = [];
  const seen = new Set<number>();
  const push = (raw: unknown) => {
    const n = Number(raw);
    if (!Number.isFinite(n) || seen.has(n)) return;
    seen.add(n);
    ids.push(n);
  };
  if (Array.isArray(good.category_ids)) {
    for (const id of good.category_ids) push(id);
  }
  if (Array.isArray(good.categories)) {
    for (const cat of good.categories) {
      if (cat && typeof cat === "object") push((cat as { id?: unknown }).id);
      else push(cat);
    }
  }
  return ids;
}

export type ProductionConsumption = {
  id: number;
  ingredient_kind?: IngredientKind | string | null;
  raw_material_id?: number | null;
  raw_material_name?: string | null;
  ingredient_produced_good_id?: number | null;
  raw_material_lot_id?: number | null;
  source_production_id?: number | null;
  quantity_kg: number;
  price_per_kg: number;
  cost: number;
};

export type ProductionRecord = {
  unit_type?: RawMaterialUnit | string | null;
  id: number;
  produced_good_id: number;
  produced_good_name?: string;
  quantity_kg: number;
  total_cost: number;
  cost_per_kg: number;
  note?: string | null;
  created_at?: string;
  consumptions?: ProductionConsumption[];
};

export type RecipeLine = {
  /** ماده اولیه یا کالای تولیدی نیمه‌ساخته */
  kind: IngredientKind;
  raw_material_id: number | "";
  ingredient_produced_good_id: number | "";
  grams_per_kg: number;
  /** مشتری در منوی سه‌بعدی بتواند این ماده را بردارد (فقط ماده اولیه) */
  is_removable?: boolean;
  /** مشتری در منوی سه‌بعدی بتواند یک واحد اضافه (مثلاً دوبل) سفارش دهد */
  is_addable?: boolean;
};

export function isNestedRecipeLine(line: Pick<RecipeLine, "kind" | "ingredient_produced_good_id">): boolean {
  return line.kind === "produced_good" || Number(line.ingredient_produced_good_id) > 0;
}

export function recipeLineKey(line: Pick<RecipeLine, "kind" | "raw_material_id" | "ingredient_produced_good_id">): string {
  if (isNestedRecipeLine(line)) {
    return `pg:${Number(line.ingredient_produced_good_id) || 0}`;
  }
  return `rm:${Number(line.raw_material_id) || 0}`;
}

export function isPieceMaterial(material?: { unit_type?: string | null } | null): boolean {
  return material?.unit_type === "piece";
}

/** پیش‌فرض نهایی است؛ فقط false صریح = نیمه‌ساخته */
export function isFinalProducedGood(good?: Pick<ProducedGood, "is_final"> | null): boolean {
  if (!good) return true;
  const value = good.is_final as unknown;
  if (value === false || value === 0 || value === "0") return false;
  return true;
}

/** «کیلو» یا «عدد» */
export function materialUnitLabel(material?: { unit_type?: string | null } | null): string {
  return isPieceMaterial(material) ? "عدد" : "کیلو";
}

/** «قیمت هر کیلو» یا «قیمت هر عدد» */
export function materialPriceLabel(material?: { unit_type?: string | null } | null): string {
  return isPieceMaterial(material) ? "قیمت هر عدد" : "قیمت هر کیلو";
}

function normalizeDigits(value: string): string {
  return String(value)
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function parseAmount(raw: string): number {
  const cleaned = normalizeDigits(raw).replace(/[^\d.]/g, "");
  if (!cleaned) return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function formatToman(num: number): string {
  return new Intl.NumberFormat("fa-IR").format(Math.round(num || 0));
}

export function formatKg(num: number): string {
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 3 }).format(num || 0);
}

export function extractList<T>(res: unknown): T[] {
  if (!res || typeof res !== "object") return [];
  if (Array.isArray(res)) return res as T[];
  const obj = res as { data?: unknown };
  if (Array.isArray(obj.data)) return obj.data as T[];
  return [];
}

export function asProducedGood(res: unknown): ProducedGood | null {
  if (!res || typeof res !== "object" || Array.isArray(res)) return null;
  const obj = res as ProducedGood & { data?: ProducedGood };
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    return obj.data;
  }
  if (obj.id != null) return obj;
  return null;
}

export function asRawMaterial(res: unknown): RawMaterial | null {
  if (!res || typeof res !== "object" || Array.isArray(res)) return null;
  const obj = res as RawMaterial & { data?: RawMaterial };
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    return obj.data;
  }
  if (obj.id != null) return obj;
  return null;
}

export function asProductionRecord(res: unknown): ProductionRecord | null {
  if (!res || typeof res !== "object" || Array.isArray(res)) return null;
  const obj = res as ProductionRecord & { data?: ProductionRecord };
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    return obj.data;
  }
  if (obj.id != null && obj.quantity_kg != null) return obj;
  return null;
}

export function recipeLinesFromGood(good: ProducedGood): RecipeLine[] {
  const lines = good.ingredient_costs || [];
  if (!lines.length) {
    return [{ kind: "raw_material", raw_material_id: "", ingredient_produced_good_id: "", grams_per_kg: 0 }];
  }
  return lines.map((line) => {
    const nestedId = Number(line.ingredient_produced_good_id) || 0;
    const isNested =
      line.ingredient_kind === "produced_good" || nestedId > 0;
    return {
      kind: isNested ? "produced_good" : "raw_material",
      raw_material_id: isNested ? "" : (Number(line.raw_material_id) || ""),
      ingredient_produced_good_id: isNested ? nestedId : "",
      grams_per_kg: Number(line.grams_per_kg) || 0,
      is_removable: !isNested && line.is_removable === true,
      is_addable: !isNested && line.is_addable === true,
    };
  });
}

/** ترتیب اولیهٔ لایه‌ها: ترتیب ذخیره‌شده، وگرنه ترتیب فرمول */
export function layerOrderFromGood(good: ProducedGood): LayerOrderEntry[] {
  const stored = Array.isArray(good.layer_order)
    ? good.layer_order.map(parseLayerOrderEntry).filter((row): row is LayerOrderEntry => row != null)
    : [];
  if (stored.length) return stored;
  return (good.ingredient_costs || [])
    .map((line) => Number(line.raw_material_id))
    .filter((n) => Number.isFinite(n) && n > 0)
    .map((id) => defaultLayerOrderEntry(id));
}

export function salePriceFromProfitPercent(costPerKg: number, percent: number): number {
  return Math.round((costPerKg || 0) * (1 + (percent || 0) / 100));
}

export function profitPercentFromSale(costPerKg: number, salePrice: number): number {
  if (!costPerKg || costPerKg <= 0) return 0;
  return Math.round((((salePrice || 0) - costPerKg) / costPerKg) * 10000) / 100;
}

export function isPercentSaleMode(good: Pick<ProducedGood, "sale_price_mode" | "markup_percent">): boolean {
  if (good.sale_price_mode === "percent") return true;
  if (good.sale_price_mode === "manual") return false;
  return good.markup_percent != null;
}

export function storedMarkupPercent(good: Pick<ProducedGood, "markup_percent" | "profit_percent">): number | null {
  if (good.markup_percent != null && Number.isFinite(Number(good.markup_percent))) {
    return Number(good.markup_percent);
  }
  if (good.profit_percent != null && Number.isFinite(Number(good.profit_percent))) {
    return Number(good.profit_percent);
  }
  return null;
}

export function isRoundSalePrice(good: Pick<ProducedGood, "round_sale_price">): boolean {
  const value = good.round_sale_price as unknown;
  return value === true || value === 1 || value === "1";
}

/** نزدیک‌ترین هزار تومان: ۳۲۵۶۰ → ۳۳۰۰۰ */
export function roundSalePriceToThousand(price: number): number {
  const n = Number(price) || 0;
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n / 1000) * 1000;
}

export function applySalePriceRounding(price: number, round: boolean): number {
  const n = Math.round(Number(price) || 0);
  return round ? roundSalePrice(n) : n;
}

export type InventoryWasteKind = "raw_material" | "produced_good";

export type InventoryWasteConsumption = {
  id: number;
  raw_material_lot_id?: number | null;
  production_id?: number | null;
  source_label?: string | null;
  quantity_kg: number;
  price_per_kg: number;
  cost: number;
};

export type InventoryWaste = {
  id: number;
  kind: InventoryWasteKind | string;
  raw_material_id?: number | null;
  produced_good_id?: number | null;
  item_name?: string | null;
  unit_type?: RawMaterialUnit | string | null;
  quantity_kg: number;
  total_cost: number;
  cost_per_kg?: number;
  note?: string | null;
  wasted_at?: string | null;
  created_at?: string | null;
  consumptions?: InventoryWasteConsumption[];
};

export type InventoryWasteSummary = {
  count: number;
  total_cost: number;
  total_quantity: number;
  raw_material_cost: number;
  produced_good_cost: number;
};

export function asInventoryWaste(res: unknown): InventoryWaste | null {
  if (!res || typeof res !== "object" || Array.isArray(res)) return null;
  const obj = res as InventoryWaste & { data?: InventoryWaste };
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    return obj.data;
  }
  if (obj.id != null) return obj;
  return null;
}

export function extractWasteList(res: unknown): {
  rows: InventoryWaste[];
  summary: InventoryWasteSummary | null;
} {
  if (!res || typeof res !== "object") return { rows: [], summary: null };
  const obj = res as {
    data?: unknown;
    summary?: InventoryWasteSummary;
  };
  const rows = Array.isArray(obj.data)
    ? (obj.data as InventoryWaste[])
    : Array.isArray(res)
      ? (res as InventoryWaste[])
      : [];
  return {
    rows,
    summary: obj.summary && typeof obj.summary === "object" ? obj.summary : null,
  };
}
