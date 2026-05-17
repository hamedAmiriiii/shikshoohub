"use client";

import React from "react";
import {
  FaBox,
  FaCashRegister,
  FaUsers,
  FaWarehouse,
  FaChartLine,
  FaCog,
  FaChevronDown,
  FaFileInvoice,
  FaSms,
} from "react-icons/fa";

const features = [
  {
    icon: <FaBox />,
    title: "مدیریت محصولات",
    items: [
      "ثبت، ویرایش و حذف کالا",
      "مشاهده کالاهای پرفروش",
      "اعمال تخفیف گروهی",
      "مدیریت تصاویر محصول",
      "انتخاب تولیدکننده",
    ],
  },
  {
    icon: <FaCashRegister />,
    title: "فروش و اقساط",
    items: [
      "ثبت خرید حضوری",
      "فروش اقساطی",
      "اتصال کارت‌خوان",
      "برگشت کالا",
      "ثبت نهایی خرید",
    ],
  },
  {
    icon: <FaUsers />,
    title: "مدیریت مشتریان",
    items: [
      "باشگاه مشتریان",
      "اعتبار مشتری",
      "ارسال پیامک",
      "مشاهده سوابق خرید",
    ],
  },
  {
    icon: <FaWarehouse />,
    title: "انبارداری",
    items: [
      "مشاهده موجودی",
      "انبارگردانی",
      "قیمت خرید و فروش کل انبار",
    ],
  },
  {
    icon: <FaChartLine />,
    title: "گزارشات مالی",
    items: [
      "گزارش فروش روزانه",
      "سود و زیان",
      "گزارش مالیاتی",
      "خروجی ماهانه",
    ],
  },
  {
    icon: <FaFileInvoice />,
    title: "هزینه‌ها و فاکتورها",
    items: [
      "ثبت هزینه",
      "مدیریت فاکتور",
      "ویرایش و حذف",
      "گزارش تجمیعی",
    ],
  },
  {
    icon: <FaSms />,
    title: "پیامک و ارتباط با مشتری",
    items: [
      "ارسال گروهی",
      "شارژ پنل",
      "پیامک خودکار",
      "لاگ پیامک‌ها",
    ],
  },
  {
    icon: <FaCog />,
    title: "تنظیمات فروشگاه",
    items: [
      "فعال‌سازی باشگاه مشتریان",
      "تنظیم اعتبار",
      "ارسال پیام مناسبتی",
      "عرضه کالا در بازار",
    ],
  },
];

const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="py-24 bg-zinc-950 text-white relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#10b98122,_transparent_40%)]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-5">
            امکانات کامل نرم‌افزار
          </h2>
          <p className="text-zinc-400 text-lg max-w-3xl mx-auto">
            تمامی ابزارهای مدیریت فروشگاه، حسابداری، انبار و مشتریان در یک
            پنل مدرن
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {features.map((feature, index) => (
            <details
              key={index}
              className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
            >
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <div className="flex items-center gap-4">
                  <div className="text-emerald-400 text-2xl">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>

                <FaChevronDown className="transition group-open:rotate-180" />
              </summary>

              <div className="px-6 pb-6">
                <ul className="space-y-3 text-zinc-300">
                  {feature.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="border-b border-white/5 pb-2"
                    >
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;