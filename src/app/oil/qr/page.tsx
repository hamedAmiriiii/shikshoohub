"use client";

import { useOilAuth } from "../OilAuth";
import OilQrPanel from "../OilQrPanel";

export default function OilQrPage() {
  const { session } = useOilAuth();
  const shopCode = session?.shop?.code || "";
  const shopName = session?.shop?.name || "";

  if (!shopCode) {
    return (
      <div className="oil-page">
        <div className="oil-empty">کد فروشگاه برای ساخت QR موجود نیست.</div>
      </div>
    );
  }

  return <OilQrPanel shopCode={shopCode} shopName={shopName} variant="full" />;
}
