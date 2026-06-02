import CustomerLoginPageContent from "@/app/componentsShop/customer/CustomerLoginPageContent";

type Props = {
  params: { shop: string };
};

export default function ShopCustomerLoginPage({ params }: Props) {
  return <CustomerLoginPageContent shopCodeFromRoute={params.shop} />;
}
