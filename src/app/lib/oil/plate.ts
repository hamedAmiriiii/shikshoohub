import type { OilPlateParts } from "./types";

export const OIL_PLATE_LETTERS = [
  "الف",
  "ب",
  "پ",
  "ت",
  "ث",
  "ج",
  "د",
  "س",
  "ص",
  "ط",
  "ع",
  "ق",
  "ک",
  "گ",
  "ل",
  "م",
  "ن",
  "و",
  "ه",
  "ی",
] as const;

const LETTER_SET = new Set<string>(OIL_PLATE_LETTERS);

const LATIN_TO_FA: Record<string, string> = {
  A: "الف",
  B: "ب",
  P: "پ",
  T: "ت",
  S: "س",
  J: "ج",
  D: "د",
  C: "ص",
  L: "ل",
  M: "م",
  N: "ن",
  V: "و",
  W: "و",
  O: "و",
  H: "ه",
  Y: "ی",
  I: "ی",
  Q: "ق",
  K: "ک",
  G: "گ",
  E: "ع",
  U: "ع",
  F: "ق",
};

const FA_LETTER_ALIASES: Record<string, string> = {
  ا: "الف",
  آ: "الف",
  الف: "الف",
  ك: "ک",
  گ: "گ",
  ي: "ی",
  ی: "ی",
  ى: "ی",
  ه: "ه",
  ة: "ه",
  و: "و",
  ص: "ص",
  س: "س",
  ث: "ث",
  ب: "ب",
  پ: "پ",
  ت: "ت",
  ج: "ج",
  د: "د",
  ط: "ط",
  ع: "ع",
  ق: "ق",
  ل: "ل",
  م: "م",
  ن: "ن",
};

export function toEnglishDigits(value: string): string {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function emptyPlateParts(): OilPlateParts {
  return { serial: "", letter: "ب", middle: "", province: "" };
}

export function normalizePlateLetter(raw: string): string | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  if (LETTER_SET.has(trimmed)) return trimmed;
  if (FA_LETTER_ALIASES[trimmed]) return FA_LETTER_ALIASES[trimmed];
  const upper = trimmed.toUpperCase();
  if (LATIN_TO_FA[upper]) return LATIN_TO_FA[upper];
  if (trimmed.length === 1 && LATIN_TO_FA[upper]) return LATIN_TO_FA[upper];
  return null;
}

export function compactPlate(parts: OilPlateParts): string {
  return `${parts.serial}${parts.letter}${parts.middle}${parts.province}`;
}

export function displayPlate(parts: OilPlateParts): string {
  if (!isPlateComplete(parts)) return "";
  return `${parts.serial} ${parts.letter} ${parts.middle} | ${parts.province}`;
}

export function isPlateComplete(parts: OilPlateParts): boolean {
  return (
    /^\d{2}$/.test(parts.serial) &&
    LETTER_SET.has(parts.letter) &&
    /^\d{3}$/.test(parts.middle) &&
    /^\d{2}$/.test(parts.province)
  );
}

export function parsePlate(input: string | null | undefined): OilPlateParts | null {
  if (!input) return null;
  let text = toEnglishDigits(input)
    .replace(/ایران/g, " ")
    .replace(/[|،,.\-_]/g, " ")
    .replace(/[^\dA-Za-zآ-یالف\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const compact = text.replace(/\s+/g, "");
  const alef = compact.match(/^(\d{2})(الف)(\d{3})(\d{2})$/);
  if (alef) {
    return {
      serial: alef[1],
      letter: "الف",
      middle: alef[3],
      province: alef[4],
    };
  }

  const single = compact.match(/^(\d{2})([\u0600-\u06FFa-zA-Z])(\d{3})(\d{2})$/);
  if (single) {
    const letter = normalizePlateLetter(single[2]);
    if (!letter) return null;
    return {
      serial: single[1],
      letter,
      middle: single[3],
      province: single[4],
    };
  }

  const spaced = text.match(
    /(\d{2})\s+(الف|[A-Za-z\u0600-\u06FF])\s+(\d{3})\s+(\d{2})/,
  );
  if (spaced) {
    const letter = normalizePlateLetter(spaced[2]);
    if (!letter) return null;
    return {
      serial: spaced[1],
      letter,
      middle: spaced[3],
      province: spaced[4],
    };
  }

  return null;
}

/** از خروجی شلوغ OCR یک پلاک سواری دربیاور */
export function extractPlateFromOcr(raw: string): OilPlateParts | null {
  const direct = parsePlate(raw);
  if (direct) return direct;

  const text = toEnglishDigits(raw).replace(/[|]/g, " ");
  const re =
    /(\d{2})\s*([A-Za-zآ-ی]{1,3}|الف)\s*(\d{3})\s*(\d{2})/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const letter = normalizePlateLetter(match[2]);
    if (!letter) continue;
    const parts: OilPlateParts = {
      serial: match[1],
      letter,
      middle: match[3],
      province: match[4],
    };
    if (isPlateComplete(parts)) return parts;
  }

  const digitsOnly = text.replace(/[^\dA-Za-zآ-یالف]/g, "");
  return parsePlate(digitsOnly);
}

export function formatKm(n: number | string | null | undefined): string {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("fa-IR").format(Math.floor(num));
}

export function normalizeOilPublicPhone(raw: string): string {
  let digits = toEnglishDigits(decodeURIComponent(raw || "")).replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length >= 12) {
    digits = `0${digits.slice(2)}`;
  }
  if (digits.startsWith("9") && digits.length === 10) {
    digits = `0${digits}`;
  }
  return digits.slice(0, 11);
}
