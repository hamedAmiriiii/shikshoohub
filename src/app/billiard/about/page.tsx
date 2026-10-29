export default function AboutPage() {
  const brand = process.env.NEXT_PUBLIC_BRAND_NAME || "هیأت بیلیارد";
  return (
    <div className="card-soft mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-3xl">درباره {brand}</h1>
      <p className="text-sm leading-7 text-felt-800">
        این سامانه برای مدیریت کامل مسابقات هیأت طراحی شده است: از ثبت‌نام و پرداخت تا
        قرعه‌کشی، جدول، برنامه بازی‌ها، نتایج و رنکینگ بازیکنان در رشته‌های مختلف بیلیارد.
      </p>
    </div>
  );
}
