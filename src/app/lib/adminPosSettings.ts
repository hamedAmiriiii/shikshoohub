export const ADMIN_POS_SETTINGS_KEY = "admin_pos_settings";
export const ADMIN_POS_SETTINGS_CHANGED_EVENT = "admin-pos-settings-changed";

export type AdminPosSettings = {
  showProductListOnMainPage: boolean;
  menuMode: boolean;
  installmentPaymentEnabled: boolean;
};

const DEFAULT_SETTINGS: AdminPosSettings = {
  showProductListOnMainPage: false,
  menuMode: false,
  installmentPaymentEnabled: true,
};

export function readAdminPosSettings(): AdminPosSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(ADMIN_POS_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeAdminPosSettings(partial: Partial<AdminPosSettings>): AdminPosSettings {
  const merged = { ...readAdminPosSettings(), ...partial };
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_POS_SETTINGS_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(ADMIN_POS_SETTINGS_CHANGED_EVENT));
  }
  return merged;
}
