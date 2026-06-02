"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { resolveCustomerShopCode } from "@/app/lib/shopStorefront";

export function useResolvedCustomerShop(explicitShop?: string) {
  const searchParams = useSearchParams();
  const [pickedShop, setPickedShop] = useState<string | null>(null);

  const shopCode = useMemo(
    () =>
      resolveCustomerShopCode({
        explicitShop: explicitShop || pickedShop,
        queryShop: searchParams.get("shop"),
        redirect: searchParams.get("redirect"),
      }),
    [explicitShop, pickedShop, searchParams],
  );

  return {
    shopCode,
    setPickedShop,
    redirectUrl: searchParams.get("redirect") || "",
  };
}
