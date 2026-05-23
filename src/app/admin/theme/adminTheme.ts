export type AdminThemeMode = "dark" | "light";

export const ADMIN_THEME_STORAGE_KEY = "admin_theme_mode";

/** حالت تیره: همان ظاهر فعلی ادمین */
export const adminDarkColors = {
  bgGradient: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)",
  surface: "#2b3143",
  surfaceAlt: "#1a1d2e",
  headerBg: "#1a1d2e",
  text: "#ffffff",
  textMuted: "rgba(255,255,255,0.7)",
  textSecondary: "#999999",
  border: "#505669",
  accent: "#78b568",
  accentHover: "#5a9a4a",
  titleGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  menuHover: "rgba(120, 181, 104, 0.15)",
  iconMutedBg: "rgba(255,255,255,0.1)",
  iconMutedBgHover: "rgba(255,255,255,0.2)",
} as const;

/** حالت روشن: پالت لندینگ — پس‌زمینه کمی تیره‌تر */
export const adminLightColors = {
  bgGradient: "linear-gradient(180deg, #e8edf2 0%, #dfe8e4 45%, #d8e2ea 100%)",
  surface: "#f1f5f9",
  surfaceAlt: "#e2e8f0",
  headerBg: "#eef2f6",
  text: "#0f172a",
  textMuted: "#64748b",
  textSecondary: "#475569",
  border: "#e2e8f0",
  accent: "#059669",
  accentHover: "#047857",
  titleGradient: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  menuHover: "rgba(5, 150, 105, 0.1)",
  iconMutedBg: "rgba(15, 23, 42, 0.06)",
  iconMutedBgHover: "rgba(15, 23, 42, 0.1)",
} as const;

export type AdminColors = typeof adminDarkColors;

export function getAdminColors(mode: AdminThemeMode): AdminColors {
  return mode === "light" ? adminLightColors : adminDarkColors;
}

export const adminPageSx = {
  minHeight: "100vh",
  direction: "rtl" as const,
  background: "var(--admin-bg-gradient)",
  color: "var(--admin-text)",
};

/** فاصله آیکون و متن در دکمه‌های MUI (RTL) */
export const adminButtonStartIconSx = {
  gap: "8px",
  "& .MuiButton-startIcon": {
    margin: 0,
    marginInlineEnd: "8px",
  },
  "& .MuiButton-endIcon": {
    margin: 0,
    marginInlineStart: "8px",
  },
} as const;
