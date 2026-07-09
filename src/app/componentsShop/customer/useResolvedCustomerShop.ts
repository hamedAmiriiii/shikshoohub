"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { resolveCustomerShopCode } from "@/app/lib/shopStorefront";

export function useResolvedCustomerShop(explicitShop?: string) {
  const searchParams = useSearchParams();
  const [pickedShop, setPickedShop] = useState<string | null>(null);
  const [includeStoredShop, setIncludeStoredShop] = useState(false);

  useEffect(() => {
    setIncludeStoredShop(true);
  }, []);

  const shopCode = useMemo(
    () =>
      resolveCustomerShopCode({
        explicitShop: explicitShop || pickedShop,
        queryShop: searchParams.get("shop"),
        redirect: searchParams.get("redirect"),
        includeStoredShop,
      }),
    [explicitShop, pickedShop, searchParams, includeStoredShop],
  );

  return {
    shopCode,
    setPickedShop,
    redirectUrl: searchParams.get("redirect") || "",
  };
}
