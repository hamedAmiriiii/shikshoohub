import React from "react";

const HeroSection = () => {
  return (
    <section className="relative bg-zinc-950 text-white overflow-hidden py-28">
      {/* background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#10b98122,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#22c55e10,_transparent_40%)]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left */}
        <div className="text-center lg:text-right">
          <span className="inline-block px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-emerald-400">
            نرم‌افزار حسابداری فروشگاهی نسل جدید
          </span>

          <h1 className="text-4xl md:text-6xl font-bold mt-6 leading-tight">
            مدیریت کامل فروشگاه در یک پنل ساده و سریع
          </h1>

          <p className="text-zinc-400 text-lg mt-6">
            فروش، محصولات، مشتریان، انبار و گزارشات مالی — همه در یک وب‌اپ قابل نصب روی ویندوز و موبایل
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center lg:justify-end">
            <a
              href="/admin/register-shop"
              className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 transition font-semibold"
            >
              ثبت‌نام دمو
            </a>

            <a
              href="/admin/login"
              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              ورود به پنل
            </a>
          </div>
        </div>

        {/* Right - mock dashboard */}
        <div className="relative">
          <div className="rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 p-6 shadow-2xl">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="h-32 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-sm text-emerald-300">
                فروش روزانه
              </div>

              <div className="h-32 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-sm text-zinc-300">
                مشتریان
              </div>

              <div className="h-32 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-sm text-zinc-300">
                انبار
              </div>

              <div className="h-32 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-sm text-emerald-300">
                سود و گزارش
              </div>
            </div>

            <div className="mt-6 h-32 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-white/10 flex items-center justify-center text-zinc-400 text-sm">
              نمودار زنده فروش
            </div>

          </div>

          {/* glow behind card */}
          <div className="absolute -inset-6 bg-emerald-500/10 blur-3xl rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;