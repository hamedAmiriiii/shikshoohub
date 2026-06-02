import CustomerRegisterPageContent from "@/app/componentsShop/customer/CustomerRegisterPageContent";

type Props = {
  params: { shop: string };
};

export default function ShopCustomerRegisterPage({ params }: Props) {
  return <CustomerRegisterPageContent shopCodeFromRoute={params.shop} />;
}
