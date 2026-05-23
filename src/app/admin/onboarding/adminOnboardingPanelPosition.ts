/** موقعیت مشترک پنل‌های شناور آموزش (مودال راهنما و نوار عملی) */
export const ADMIN_ONBOARDING_PANEL_BOTTOM = {
  xs: 100,
  md: 24,
} as const;

export const adminOnboardingFloatingPanelSx = {
  position: "fixed" as const,
  bottom: ADMIN_ONBOARDING_PANEL_BOTTOM,
  left: { xs: "50%", md: 24 },
  right: { xs: "auto", md: "auto" },
  transform: { xs: "translateX(-50%)", md: "none" },
  width: { xs: "calc(100% - 32px)", sm: 420 },
  maxWidth: 440,
};
