import { redirect } from "next/navigation";
import CustomerRegisterPageContent from "@/app/componentsShop/customer/CustomerRegisterPageContent";

type Props = {
  searchParams?: { ref?: string };
};

/** ثبت‌نام مشتری (خریدار) — جدا از /admin/register-shop */
export default function CustomerRegisterPage({ searchParams }: Props) {
  const ref = searchParams?.ref?.trim();
  if (ref) {
    redirect(`/admin/register-shop?ref=${encodeURIComponent(ref)}`);
  }

  return <CustomerRegisterPageContent />;
}
