export const PRODUCT_IMPORT_FIELDS = [
  {
    key: "name",
    label: "نام کالا",
    required: true,
    aliases: ["نام کالا", "نام محصول", "نام", "کالا", "name", "product", "product name"],
  },
  {
    key: "barcode",
    label: "بارکد",
    required: false,
    aliases: ["بارکد", "بار كد", "barcode", "sku"],
  },
  {
    key: "purchase_price",
    label: "قیمت خرید",
    required: true,
    aliases: ["قیمت خرید", "خرید", "purchase", "purchase price", "buy"],
  },
  {
    key: "sale_price",
    label: "قیمت فروش",
    required: true,
    aliases: ["قیمت فروش", "فروش", "قیمت", "sale", "sale price", "price"],
  },
  {
    key: "quantity",
    label: "موجودی",
    required: true,
    aliases: ["موجودی", "تعداد", "quantity", "stock", "qty"],
  },
] as const;

export type ProductImportFieldKey = (typeof PRODUCT_IMPORT_FIELDS)[number]["key"];

export type ColumnMapping = Record<ProductImportFieldKey, string>;

export type ParsedSheet = {
  headers: string[];
  rows: Record<string, string>[];
};

export type ImportProductItem = {
  name: string;
  barcode?: string;
  purchase_price: number;
  sale_price: number;
  quantity: number;
};

export type ProductImportPayload = {
  products: ImportProductItem[];
};

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function emptyColumnMapping(): ColumnMapping {
  return {
    name: "",
    barcode: "",
    purchase_price: "",
    sale_price: "",
    quantity: "",
  };
}

function normalizeText(value: string): string {
  return value
    .trim()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function normalizeDigits(value: string): string {
  return String(value).replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d))).replace(
    /[٠-٩]/g,
    (d) => String(ARABIC_DIGITS.indexOf(d)),
  );
}

function uniqueHeaders(rawHeaders: string[]): string[] {
  const seen = new Map<string, number>();
  return rawHeaders.map((header, index) => {
    const base = header.trim() || `ستون ${index + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });
}

export async function parseExcelFile(file: File): Promise<ParsedSheet> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("فایل شیت معتبری ندارد");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  });

  if (!matrix.length) {
    throw new Error("فایل خالی است");
  }

  const headers = uniqueHeaders(matrix[0].map((cell) => String(cell ?? "")));
  const rows = matrix.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = String(row[index] ?? "").trim();
    });
    return record;
  }).filter((row) => Object.values(row).some((value) => value !== ""));

  if (!rows.length) {
    throw new Error("ردیفی برای ایمپورت پیدا نشد");
  }

  return { headers, rows };
}

export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping = emptyColumnMapping();
  const used = new Set<string>();

  PRODUCT_IMPORT_FIELDS.forEach((field) => {
    const match = headers.find((header) => {
      if (used.has(header)) return false;
      const normalized = normalizeText(header);
      return field.aliases.some((alias) => normalized === normalizeText(alias) || normalized.includes(normalizeText(alias)));
    });
    if (match) {
      mapping[field.key] = match;
      used.add(match);
    }
  });

  return mapping;
}

function parseNumber(value: string): number | null {
  const cleaned = normalizeDigits(value)
    .replace(/,/g, "")
    .replace(/٬/g, "")
    .replace(/ تومان/g, "")
    .replace(/\s/g, "");
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

function isRequiredValueFilled(key: ProductImportFieldKey, raw: string): boolean {
  if (key === "name") return raw.trim().length > 0;
  if (key === "purchase_price" || key === "sale_price" || key === "quantity") {
    return parseNumber(raw) != null;
  }
  return true;
}

export function findIncompleteRequiredRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
): number[] {
  return rows.reduce<number[]>((invalid, row, index) => {
    const missingRequired = PRODUCT_IMPORT_FIELDS.some((field) => {
      if (!field.required) return false;
      const mapped = mapping[field.key];
      if (!mapped) return true;
      return !isRequiredValueFilled(field.key, String(row[mapped] ?? ""));
    });
    if (missingRequired) invalid.push(index + 1);
    return invalid;
  }, []);
}

export function buildImportPayload(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
): ProductImportPayload {
  const products = rows
    .map((row) => {
      const name = String(row[mapping.name] ?? "").trim();
      const barcode = normalizeDigits(String(row[mapping.barcode] ?? "")).trim();
      const item: ImportProductItem = {
        name,
        barcode,
        purchase_price: parseNumber(String(row[mapping.purchase_price] ?? "")) ?? 0,
        sale_price: parseNumber(String(row[mapping.sale_price] ?? "")) ?? 0,
        quantity: parseNumber(String(row[mapping.quantity] ?? "")) ?? 0,
      };
      return item;
    })
    .filter((item) => item.name)
    .map((item) =>
      item.barcode
        ? item
        : {
            name: item.name,
            purchase_price: item.purchase_price,
            sale_price: item.sale_price,
            quantity: item.quantity,
          },
    );

  return { products };
}

export function findDuplicateBarcodes(products: ImportProductItem[]): string[] {
  const counts = new Map<string, number>();
  products.forEach((item) => {
    const barcode = String(item.barcode ?? "").trim();
    if (!barcode) return;
    counts.set(barcode, (counts.get(barcode) ?? 0) + 1);
  });
  return [...counts.entries()].filter(([, count]) => count > 1).map(([barcode]) => barcode);
}

export function mappingIsComplete(mapping: ColumnMapping): boolean {
  return PRODUCT_IMPORT_FIELDS.filter((field) => field.required).every((field) =>
    Boolean(mapping[field.key]),
  );
}

export function isMappedCellEmpty(
  row: Record<string, string>,
  mapping: ColumnMapping,
  key: ProductImportFieldKey,
): boolean {
  const field = PRODUCT_IMPORT_FIELDS.find((item) => item.key === key);
  if (!field?.required) return false;
  const mapped = mapping[key];
  if (!mapped) return true;
  return !isRequiredValueFilled(key, String(row[mapped] ?? ""));
}
