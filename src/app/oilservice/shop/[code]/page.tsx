import {
  isOilApiError,
  oilPublicShop,
} from "@/app/lib/oil/api";
import OilShopPhoneGate from "./OilShopPhoneGate";

type Props = { params: { code: string } };

export default async function OilShopLandingPage({ params }: Props) {
  const code = decodeURIComponent(params.code || "").trim();
  if (!code) {
    return (
      <div className="oil-page">
        <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>سوابق تعویض روغن</h1>
        <div className="oil-empty">فروشگاه یافت نشد.</div>
      </div>
    );
  }

  const res = await oilPublicShop(code);
  if (isOilApiError(res)) {
    return (
      <div className="oil-page">
        <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>سوابق تعویض روغن</h1>
        <div className="oil-empty">
          {res.statusCode === 404 ? "فروشگاه یافت نشد." : res.message}
        </div>
      </div>
    );
  }

  return <OilShopPhoneGate shopCode={res.code || code} shopName={res.name} />;
}
