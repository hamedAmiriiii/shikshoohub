"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useShopContext } from "@/app/context/ShopContext";
import {
  customerRegisterPath,
  saveLastShopCode,
} from "@/app/lib/shopStorefront";
import CustomerAuthShell from "./CustomerAuthShell";
import CustomerRegisterForm from "./CustomerRegisterForm";
import ShopCodePicker from "./ShopCodePicker";
import { useResolvedCustomerShop } from "./useResolvedCustomerShop";
import { CustomerLoginLoading } from "./CustomerLoginForm";

type Props = {
  shopCodeFromRoute?: string;
};

function CustomerRegisterInner({ shopCodeFromRoute }: Props) {
  const router = useRouter();
  const { shop } = useShopContext();
  const { shopCode } = useResolvedCustomerShop(shopCodeFromRoute);
  const activeShop = shopCodeFromRoute || shopCode;
  const shopName = (shop?.name as string) || activeShop || undefined;

  useEffect(() => {
    if (shopCodeFromRoute || !shopCode) return;
    router.replace(customerRegisterPath(shopCode));
  }, [shopCodeFromRoute, shopCode, router]);

  const handlePickShop = (code: string) => {
    saveLastShopCode(code);
    router.replace(customerRegisterPath(code));
  };

  if (!shopCodeFromRoute && !shopCode) {
    return (
      <CustomerAuthShell
        title="ثبت‌نام مشتری"
        subtitle="حساب خریدار برای این فروشگاه"
      >
        <ShopCodePicker onConfirm={handlePickShop} />
      </CustomerAuthShell>
    );
  }

  if (!shopCodeFromRoute) {
    return (
      <CustomerAuthShell title="ثبت‌نام مشتری" subtitle="">
        <CustomerLoginLoading />
      </CustomerAuthShell>
    );
  }

  return (
    <CustomerAuthShell
      title="ثبت‌نام مشتری"
      subtitle="حساب خریدار برای این فروشگاه"
      shopName={shopName}
    >
      <CustomerRegisterForm shopCode={shopCodeFromRoute} />
    </CustomerAuthShell>
  );
}

export default function CustomerRegisterPageContent(props: Props) {
  return (
    <Suspense
      fallback={
        <CustomerAuthShell title="ثبت‌نام مشتری" subtitle="">
          <CustomerLoginLoading />
        </CustomerAuthShell>
      }
    >
      <CustomerRegisterInner {...props} />
    </Suspense>
  );
}
