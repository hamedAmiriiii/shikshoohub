/** Measurement ID از env؛ بدون مقدار، تگ GA لود نمی‌شود. */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

/** داشبورد وب Google Analytics (ورود با همان اکانت پراپرتی). */
export const GA_DASHBOARD_URL = "https://analytics.google.com/analytics/web/";
