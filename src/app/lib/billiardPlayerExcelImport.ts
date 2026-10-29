export const PLAYER_IMPORT_FIELDS = [
  {
    key: "first_name",
    label: "نام",
    required: true,
    aliases: ["نام", "اسم", "first name", "firstname", "first_name", "name"],
  },
  {
    key: "last_name",
    label: "نام خانوادگی",
    required: true,
    aliases: ["نام خانوادگی", "فامیلی", "نام‌خانوادگی", "last name", "lastname", "last_name", "family"],
  },
  {
    key: "phone",
    label: "موبایل",
    required: true,
    aliases: ["موبایل", "تلفن", "شماره", "شماره موبایل", "phone", "mobile", "tel"],
  },
  {
    key: "city",
    label: "شهر",
    required: false,
    aliases: ["شهر", "city", "town"],
  },
  {
    key: "club",
    label: "باشگاه",
    required: false,
    aliases: ["باشگاه", "باشگاه ورزشی", "club", "team"],
  },
  {
    key: "national_id",
    label: "کد ملی",
    required: false,
    aliases: ["کد ملی", "کدملی", "national id", "national_id", "nid", "کد"],
  },
] as const;

export type PlayerImportFieldKey = (typeof PLAYER_IMPORT_FIELDS)[number]["key"];

export type PlayerColumnMapping = Record<PlayerImportFieldKey, string>;

export type ParsedSheet = {
  headers: string[];
  rows: Record<string, string>[];
};

export type ImportPlayerItem = {
  first_name: string;
  last_name: string;
  phone: string;
  city?: string;
  club?: string;
  national_id?: string;
};

export type PlayerImportPayload = {
  players: ImportPlayerItem[];
};

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function emptyPlayerColumnMapping(): PlayerColumnMapping {
  return {
    first_name: "",
    last_name: "",
    phone: "",
    city: "",
    club: "",
    national_id: "",
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
  return String(value)
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
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
  const rows = matrix
    .slice(1)
    .map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = String(row[index] ?? "").trim();
      });
      return record;
    })
    .filter((row) => Object.values(row).some((value) => value !== ""));

  if (!rows.length) {
    throw new Error("ردیفی برای ایمپورت پیدا نشد");
  }

  return { headers, rows };
}

export function autoMapPlayerColumns(headers: string[]): PlayerColumnMapping {
  const mapping = emptyPlayerColumnMapping();
  const used = new Set<string>();

  PLAYER_IMPORT_FIELDS.forEach((field) => {
    const match = headers.find((header) => {
      if (used.has(header)) return false;
      const normalized = normalizeText(header);
      return field.aliases.some(
        (alias) => normalized === normalizeText(alias) || normalized.includes(normalizeText(alias)),
      );
    });
    if (match) {
      mapping[field.key] = match;
      used.add(match);
    }
  });

  return mapping;
}

function mappedValue(row: Record<string, string>, mapping: PlayerColumnMapping, key: PlayerImportFieldKey): string {
  const col = mapping[key];
  if (!col) return "";
  return String(row[col] ?? "").trim();
}

export function findIncompleteRequiredPlayerRows(
  rows: Record<string, string>[],
  mapping: PlayerColumnMapping,
): number[] {
  return rows.reduce<number[]>((invalid, row, index) => {
    const missing = PLAYER_IMPORT_FIELDS.some((field) => {
      if (!field.required) return false;
      if (!mapping[field.key]) return true;
      return !mappedValue(row, mapping, field.key);
    });
    if (missing) invalid.push(index + 1);
    return invalid;
  }, []);
}

export function buildPlayerImportPayload(
  rows: Record<string, string>[],
  mapping: PlayerColumnMapping,
): PlayerImportPayload {
  const players = rows
    .map((row) => {
      const item: ImportPlayerItem = {
        first_name: mappedValue(row, mapping, "first_name"),
        last_name: mappedValue(row, mapping, "last_name"),
        phone: normalizeDigits(mappedValue(row, mapping, "phone")).replace(/\D/g, ""),
        city: mappedValue(row, mapping, "city") || undefined,
        club: mappedValue(row, mapping, "club") || undefined,
        national_id: normalizeDigits(mappedValue(row, mapping, "national_id")).replace(/\D/g, "") || undefined,
      };
      return item;
    })
    .filter((item) => item.first_name && item.last_name && item.phone);

  return { players };
}

export function findDuplicatePhones(players: ImportPlayerItem[]): string[] {
  const counts = new Map<string, number>();
  players.forEach((item) => {
    const phone = item.phone.trim();
    if (!phone) return;
    counts.set(phone, (counts.get(phone) ?? 0) + 1);
  });
  return [...counts.entries()].filter(([, count]) => count > 1).map(([phone]) => phone);
}

export function playerMappingIsComplete(mapping: PlayerColumnMapping): boolean {
  return PLAYER_IMPORT_FIELDS.filter((field) => field.required).every((field) => Boolean(mapping[field.key]));
}

export function isPlayerMappedCellEmpty(
  row: Record<string, string>,
  mapping: PlayerColumnMapping,
  key: PlayerImportFieldKey,
): boolean {
  const field = PLAYER_IMPORT_FIELDS.find((item) => item.key === key);
  if (!field?.required) return false;
  if (!mapping[key]) return true;
  return !mappedValue(row, mapping, key);
}

/** دانلود فایل نمونه اکسل */
export async function downloadPlayerImportTemplate(): Promise<void> {
  const XLSX = await import("xlsx");
  const rows = [
    ["نام", "نام خانوادگی", "موبایل", "شهر", "باشگاه", "کد ملی"],
    ["علی", "محمدی", "09131234567", "کرمان", "باشگاه نمونه", ""],
    ["رضا", "احمدی", "09139876543", "کرمان", "", ""],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "بازیکنان");
  XLSX.writeFile(book, "نمونه-ورود-بازیکنان.xlsx");
}
