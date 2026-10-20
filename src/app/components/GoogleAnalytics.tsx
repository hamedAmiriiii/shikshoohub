import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";

/** Measurement ID از env؛ بدون مقدار، اسکریپت لود نمی‌شود. */
export const GA_MEASUREMENT_ID = 'G-NG1SBR763P'
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;
  return <NextGoogleAnalytics gaId={GA_MEASUREMENT_ID} />;
}
