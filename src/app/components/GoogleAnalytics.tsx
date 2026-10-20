import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";
import { GA_MEASUREMENT_ID } from "@/app/lib/googleAnalytics";

export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;
  return <NextGoogleAnalytics gaId={GA_MEASUREMENT_ID} />;
}
