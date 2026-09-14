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
  const shopName = (await fetchPublicShopName(shopCode)) || "فروشگاه";
  const description = `منوی دیجیتال و خدمات ${shopName} — اتاق ${table}`;

  return pageMetadata({
    title: shopName,
    description,
    path: shopPath(shopCode, `/room/${table}`),
    siteName: shopName,
    noIndex: true,
    keywords: [shopName, "سفارش اتاق", "منوی دیجیتال"],
  });
}

export default function RoomReservLayout({ children }: { children: React.ReactNode }) {
  return children;
}
