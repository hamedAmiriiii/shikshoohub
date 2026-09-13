import type { Metadata } from "next";
import { pageMetadata } from "../../../lib/seo";
import { fetchPublicShopName, shopPath } from "../../../lib/shopStorefront";

type Props = {
  children: React.ReactNode;
  params: { shop: string; table: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shopCode = params.shop?.trim() || "";
  const table = params.table?.trim() || "";
  const shopName = (await fetchPublicShopName(shopCode)) || shopCode || "فروشگاه";
  const title = shopName;
  const description = `منوی دیجیتال ${shopName} — سفارش از میز ${table}`;

  return pageMetadata({
    title,
    description,
    path: shopPath(shopCode, `/reserv/${table}`),
    siteName: shopName,
    noIndex: true,
    keywords: [shopName, "سفارش آنلاین", "منوی دیجیتال", "میز"],
  });
}

export default function ReservTableLayout({ children }: { children: React.ReactNode }) {
  return children;
}
