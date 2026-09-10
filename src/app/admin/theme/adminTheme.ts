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

/** کارت/پنل سطح اول */
export const adminSurfaceCardSx = {
  backgroundColor: "var(--admin-surface)",
  border: "1px solid var(--admin-border)",
  borderRadius: "16px",
  color: "var(--admin-text)",
} as const;

/** فیلدهای ورودی — هر دو تم */
export const adminFieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-input-bg, var(--admin-surface-alt))",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-input-border, var(--admin-border))" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputBase-input": {
    color: "var(--admin-text)",
  },
  "& .MuiInputLabel-root": {
    color: "var(--admin-text-muted)",
  },
  "& .MuiFormHelperText-root": {
    color: "var(--admin-error)",
  },
} as const;

export const adminDialogPaperSx = {
  backgroundColor: "var(--admin-surface)",
  color: "var(--admin-text)",
  backgroundImage: "none",
  border: "1px solid var(--admin-border)",
} as const;

export const adminDialogTitleSx = {
  color: "var(--admin-text)",
  borderBottom: "1px solid var(--admin-border)",
} as const;

export const adminDialogActionsSx = {
  padding: "16px 24px",
  borderTop: "1px solid var(--admin-border)",
  gap: "8px",
} as const;

export const adminCartTableContainerSx = {
  maxWidth: "100%",
  overflowX: "auto",
  borderRadius: { xs: "16px", md: "20px" },
  backgroundColor: "var(--admin-cart-surface)",
  border: "1px solid var(--admin-accent-border)",
  transition: "all 0.3s ease",
  "&:hover": {
    border: "1px solid var(--admin-accent)",
  },
} as const;

export const adminCartTableHeadCellSx = {
  color: "var(--admin-text)",
  fontWeight: 700,
  backgroundColor: "var(--admin-cart-head-bg)",
  borderBottom: "2px solid var(--admin-accent-border)",
} as const;

export const adminCartTableRowSx = {
  backgroundColor: "var(--admin-cart-surface)",
  borderBottom: "1px solid var(--admin-divider)",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "var(--admin-cart-row-hover)",
  },
} as const;

export const adminActionEditButtonSx = {
  backgroundColor: "var(--admin-action-edit)",
  color: "var(--admin-on-accent)",
  "&:hover": { backgroundColor: "var(--admin-action-edit-hover)" },
} as const;

export const adminActionPurpleButtonSx = {
  backgroundColor: "var(--admin-action-purple)",
  color: "var(--admin-on-accent)",
  "&:hover": { backgroundColor: "var(--admin-action-purple-hover)" },
} as const;

export const adminActionBlueButtonSx = {
  backgroundColor: "var(--admin-action-blue)",
  color: "var(--admin-on-accent)",
  "&:hover": { backgroundColor: "var(--admin-action-blue-hover)" },
} as const;

export const adminActionDeleteButtonSx = {
  backgroundColor: "var(--admin-action-delete)",
  color: "var(--admin-on-accent)",
  "&:hover": { backgroundColor: "var(--admin-action-delete-hover)" },
} as const;
