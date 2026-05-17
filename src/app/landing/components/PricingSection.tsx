import React from "react";
import { FaCheck } from "react-icons/fa";

const plans = [
  {
    name: "استارتر",
    link: "/admin/register-shop",
    price: "رایگان",
    description: "10 روز رایگان",
    features: [
      "مدیریت محصولات",
      "مدیریت انبار",
      "ثبت فروش",
      "مدیریت مشتریان",
      "گزارشات پایه",
    ],
    popular: false,
  },
  {
    name: "حرفه‌ای",
    link: "/admin/register-shop",
    price: "3,950,000 تومان",
    description: "مناسب اکثر فروشگاه‌ها",
    features: [
      "تمام امکانات استارتر",
      "فروش اقساطی",
      "انبارداری",
      "باشگاه مشتریان",
      "گزارشات مالی",
      "پنل ارسال پیامک",
    ],
    popular: true,
  },
  {
    name: "سازمانی",
    link: "/admin/register-shop",
    price: "اختصاصی",
    description: "برای فروشگاه‌های بزرگ",
    features: [
      "تمام امکانات حرفه‌ای",
      "API اختصاصی",
      "پشتیبانی ویژه",
      "آموزش اختصاصی",
      "گزارشات سفارشی",
    ],
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section
      id="pricing"
      className="py-24 bg-zinc-950 text-white relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#10b98122,_transparent_40%)]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            تعرفه‌های اشتراک
          </h2>
          <p className="text-zinc-400 text-lg">
            پلن مناسب کسب‌وکار خود را انتخاب کنید
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-3xl p-8 backdrop-blur-xl border transition hover:scale-105 ${
                plan.popular
                  ? "bg-emerald-500/10 border-emerald-400 shadow-2xl"
                  : "bg-white/5 border-white/10"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-5 left-5 bg-emerald-500 text-white text-xs px-4 py-1 rounded-full">
                  پیشنهادی
                </div>
              )}

              <h3 className="text-2xl font-bold mb-3">{plan.name}</h3>

              <p className="text-zinc-400 mb-6">{plan.description}</p>

              <div className="text-4xl font-bold mb-8 text-emerald-400">
                {plan.price}
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <FaCheck className="text-emerald-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.link}
                className={`block text-center py-4 rounded-2xl font-semibold transition ${
                  plan.popular
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                شروع کنید
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;