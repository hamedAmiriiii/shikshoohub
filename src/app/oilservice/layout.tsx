import type { Metadata } from "next";
import "../oil/oil.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "سوابق تعویض روغن",
  description: "مشاهده پلاک، کیلومتر و روغن بدون ورود",
  robots: { index: false, follow: false },
};

export default function OilServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="oil-app">
      <div className="oil-wrap">{children}</div>
    </div>
  );
}
