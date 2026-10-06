export type ReservMenuThemeId = "classic" | "list" | "showcase" | "grid" | "cover" | "motion" | "video";

export type ReservMenuBackgroundType = "video" | "image";

export type ReservMenuThemeConfig = {
  id: ReservMenuThemeId;
  backgroundUrl: string | null;
  backgroundType: ReservMenuBackgroundType | null;
  iconUrl: string | null;
};

export const RESERV_MENU_THEME_SETTING_KEY = "reserv_menu_theme";

export const RESERV_MENU_PREVIEW_QUERY = "preview_theme";

export const RESERV_MENU_BG_MAX_BYTES = 15 * 1024 * 1024;

export const RESERV_MENU_ICON_MAX_BYTES = 2 * 1024 * 1024;

export const RESERV_MENU_THEMES: Array<{
  id: ReservMenuThemeId;
  title: string;
  hint: string;
}> = [
  { id: "classic", title: "کلاسیک", hint: "هدر تیره، غذای ویژه بالای صفحه و ردیف‌های منو با خطچین قیمت" },
  { id: "list", title: "لیستی", hint: "کارت‌های خاکستری نرم، عکس بزرگ کنار نام و قیمت" },
  { id: "showcase", title: "ویترین طلایی", hint: "هدر نام و میز، دسته‌ها ستون باریک سمت راست و آیتم‌ها عمودی" },
  { id: "grid", title: "جدولی", hint: "دو ستون کارت با عکس بالای کارت" },
  { id: "cover", title: "صفحه خوش‌آمد", hint: "اول یک صفحهٔ ورود با کاور و دکمهٔ مشاهده منو" },
  { id: "motion", title: "متحرک", hint: "پس‌زمینهٔ شفق متحرک و ردیف‌های کشویی با انیمیشن" },
  { id: "video", title: "ویدیو پس‌زمینه", hint: "ویدیو یا گیف خودتان زیر منو، کارت‌های شیشه‌ای" },
];

const THEME_IDS = new Set<string>(RESERV_MENU_THEMES.map((theme) => theme.id));

export function normalizeReservMenuThemeId(value: unknown): ReservMenuThemeId {
  const id = typeof value === "string" ? value.trim().toLowerCase() : "";
  return THEME_IDS.has(id) ? (id as ReservMenuThemeId) : "classic";
}

function resolveApiMediaUrl(url: string): string {
  if (url.startsWith("/storage/")) return `https://api.webinoo-plus.ir${url}`;
  return url;
}

export function parseReservMenuTheme(res: unknown): ReservMenuThemeConfig | null {
  if (!res || typeof res !== "object") return null;
  const obj = res as Record<string, unknown>;
  const nested = obj.data && typeof obj.data === "object" ? (obj.data as Record<string, unknown>) : null;
  const raw = obj.menu_theme ?? nested?.menu_theme;
  if (!raw || typeof raw !== "object") return null;
  const theme = raw as Record<string, unknown>;
  const url = typeof theme.background_url === "string" && theme.background_url.trim()
    ? resolveApiMediaUrl(theme.background_url.trim())
    : null;
  const iconUrl =
    typeof theme.icon_url === "string" && theme.icon_url.trim()
      ? resolveApiMediaUrl(theme.icon_url.trim())
      : null;
  return {
    id: normalizeReservMenuThemeId(theme.id),
    backgroundUrl: url,
    backgroundType: url ? (theme.background_type === "image" ? "image" : "video") : null,
    iconUrl,
  };
}
