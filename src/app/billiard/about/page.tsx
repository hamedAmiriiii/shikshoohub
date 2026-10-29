export default function AboutPage() {
  const brand = process.env.NEXT_PUBLIC_BILLIARD_BRAND_NAME || process.env.NEXT_PUBLIC_BRAND_NAME || "هیأت بیلیارد شهرستان کرمان";
  return (
    <div className="card-soft mx-auto max-w-3xl space-y-4">
      <p className="text-sm text-cyan-400">درباره</p>
      <h1 className="font-display text-3xl text-slate-100">درباره {brand}</h1>
      <p className="text-sm leading-8 text-slate-400">
        این سامانه برای مدیریت کامل مسابقات هیأت طراحی شده است: از ثبت‌نام و پرداخت تا
        قرعه‌کشی، جدول، برنامه بازی‌ها، نتایج و رنکینگ بازیکنان در رشته‌های مختلف بیلیارد.
      </p>
    </div>
  );
}
