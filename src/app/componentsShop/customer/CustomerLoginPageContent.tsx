"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useShopContext } from "@/app/context/ShopContext";
import {
  customerLoginPath,
  saveLastShopCode,
} from "@/app/lib/shopStorefront";
import CustomerAuthShell from "./CustomerAuthShell";
import CustomerLoginForm, { CustomerLoginLoading } from "./CustomerLoginForm";
import ShopCodePicker from "./ShopCodePicker";
import { useResolvedCustomerShop } from "./useResolvedCustomerShop";

type Props = {
  shopCodeFromRoute?: string;
};

function CustomerLoginInner({ shopCodeFromRoute }: Props) {
  const router = useRouter();
  const { shop } = useShopContext();
  const { shopCode, redirectUrl } = useResolvedCustomerShop(shopCodeFromRoute);
  const activeShop = shopCodeFromRoute || shopCode;
  const shopName = (shop?.name as string) || activeShop || undefined;

  useEffect(() => {
    if (shopCodeFromRoute || !shopCode) return;
    const q = redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : "";
    router.replace(`${customerLoginPath(shopCode)}${q}`);
  }, [shopCodeFromRoute, shopCode, redirectUrl, router]);

  const handlePickShop = (code: string) => {
    saveLastShopCode(code);
    const q = redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : "";
    router.replace(`${customerLoginPath(code)}${q}`);
  };

  if (!shopCodeFromRoute && !shopCode) {
    return (
      <CustomerAuthShell
        title="ورود مشتری"
        subtitle="برای خرید از فروشگاه وارد شوید"
      >
        <ShopCodePicker onConfirm={handlePickShop} />
      </CustomerAuthShell>
    );
  }

  if (!shopCodeFromRoute) {
    return (
      <CustomerAuthShell title="ورود مشتری" subtitle="">
        <CustomerLoginLoading />
      </CustomerAuthShell>
    );
  }

  return (
    <CustomerAuthShell
      title="ورود مشتری"
      subtitle="برای خرید از فروشگاه وارد شوید"
      shopName={shopName}
    >
      <CustomerLoginForm shopCode={shopCodeFromRoute} redirectUrl={redirectUrl} />
    </CustomerAuthShell>
  );
}

export default function CustomerLoginPageContent(props: Props) {
  return (
    <Suspense
      fallback={
        <CustomerAuthShell title="ورود مشتری" subtitle="">
          <CustomerLoginLoading />
        </CustomerAuthShell>
      }
    >
      <CustomerLoginInner {...props} />
    </Suspense>
  );
}
