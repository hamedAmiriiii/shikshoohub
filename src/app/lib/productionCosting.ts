export type RawMaterialLot = {
  id: number;
  quantity_kg: number;
  remaining_kg: number;
  price_per_kg: number;
  purchased_at?: string | null;
  note?: string | null;
};

export type RawMaterial = {
  id: number;
  name: string;
  sale_price?: number;
  note?: string | null;
  stock_kg?: number;
  open_lots_count?: number;
  next_price_per_kg?: number | null;
  lots?: RawMaterialLot[];
};

export type IngredientCostLot = {
  lot_id: number;
  quantity_kg: number;
  price_per_kg: number;
  cost: number;
};

export type IngredientCost = {
  id?: number;
  raw_material_id: number;
  name?: string | null;
  grams_per_kg: number;
  needed_kg?: number;
  cost?: number;
  lots?: IngredientCostLot[];
  shortage_kg?: number;
};

export type MaterialShortage = {
  raw_material_id: number;
  name?: string | null;
  needed_kg: number;
  shortage_kg: number;
};

export type ProducedGood = {
  id: number;
  name: string;
  sale_price?: number;
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
};

export type ProductionConsumption = {
  id: number;
  raw_material_id: number;
  raw_material_name?: string | null;
  raw_material_lot_id?: number;
  quantity_kg: number;
  price_per_kg: number;
  cost: number;
};

export type ProductionRecord = {
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
  raw_material_id: number | "";
  grams_per_kg: number;
};

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
  if (!lines.length) return [{ raw_material_id: "", grams_per_kg: 0 }];
  return lines.map((line) => ({
    raw_material_id: line.raw_material_id,
    grams_per_kg: Number(line.grams_per_kg) || 0,
  }));
}

export function salePriceFromProfitPercent(costPerKg: number, percent: number): number {
  return Math.round((costPerKg || 0) * (1 + (percent || 0) / 100));
}

export function profitPercentFromSale(costPerKg: number, salePrice: number): number {
  if (!costPerKg || costPerKg <= 0) return 0;
  return Math.round((((salePrice || 0) - costPerKg) / costPerKg) * 10000) / 100;
}
