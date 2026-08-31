import { Metadata } from "next";
import OilApp from "./OilApp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تعویض روغن",
  description: "اپ تعویض روغن وبینو",
  manifest: "/manifest-oil.json",
  applicationName: "تعویض روغن",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "تعویض روغن",
  },
};

export default function OilLayout({ children }: { children: React.ReactNode }) {
  return <OilApp>{children}</OilApp>;
}
