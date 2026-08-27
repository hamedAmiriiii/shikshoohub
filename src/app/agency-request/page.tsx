import type { Metadata } from "next";
import AgencyRequestClient from "./AgencyRequestClient";

export const metadata: Metadata = {
  title: "درخواست نمایندگی | وبینو",
  description:
    "فرم درخواست نمایندگی نرم‌افزار وبینو — ثبت نام، استان، شهر، شماره تماس و مدرک تحصیلی",
};

export default function AgencyRequestPage() {
  return <AgencyRequestClient />;
}
