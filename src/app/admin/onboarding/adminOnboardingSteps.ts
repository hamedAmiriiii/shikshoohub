export const ADMIN_ONBOARDING_STORAGE_KEY = "admin_onboarding_v2_done";
export const ADMIN_ONBOARDING_STEP_KEY = "admin_onboarding_v2_step";
export const ADMIN_ONBOARDING_PRACTICE_KEY = "admin_onboarding_v2_practice";
export const ADMIN_ONBOARDING_START_EVENT = "admin-onboarding-start";

export type AdminOnboardingStepKind = "intro" | "practice" | "finish";

export type AdminOnboardingStep = {
  id: string;
  kind: AdminOnboardingStepKind;
  title: string;
  body: string;
  /** مسیر پیشنهادی برای انجام عملی این مرحله */
  path?: string;
};

export const ADMIN_ONBOARDING_STEPS: AdminOnboardingStep[] = [
  {
    id: "intro",
    kind: "intro",
    title: "آموزش عملی وبینو",
    body:
      "می‌خواهم قدم‌به‌قدم یاد بگیری چطور همه کارهای فروشگاهت را انجام بدهی.\n\n" +
      "در هر مرحله خودت همان کار را انجام می‌دهی؛ وقتی تمام شد «انجام دادم — ادامه آموزش» را بزن تا برویم مرحله بعد.",
  },
  {
    id: "register-product",
    kind: "practice",
    title: "مرحله ۱: ثبت کالا",
    body:
      "یک کالا ثبت کن:\n" +
      "• نام و بارکد (یکتا)\n" +
      "• قیمت خرید و قیمت فروش\n" +
      "• موجودی اولیه\n\n" +
      "بعد از ذخیره، «انجام دادم — ادامه آموزش» را بزن.",
    path: "/admin/product/create",
  },
  {
    id: "products-print",
    kind: "practice",
    title: "مرحله ۲: مشاهده کالا و چاپ لیبل",
    body:
      "به لیست کالاها برو و همان محصول را پیدا کن.\n" +
      "از دکمه چاپ (پرینت) لیبل بارکد را چاپ بگیر.\n\n" +
      "وقتی تمام شد ادامه آموزش را بزن.",
    path: "/admin/product",
  },
  {
    id: "sale-add-cart",
    kind: "practice",
    title: "مرحله ۳: افزودن به سبد فروش",
    body:
      "به صفحه فروش (خانه) برو.\n" +
      "• دکمه اسکن: بارکدخوان یا ورود دستی کد\n" +
      "• یا بارکد را در جستجو وارد کن\n\n" ,
    path: "/admin",
  },
  {
    id: "complete-sale",
    kind: "practice",
    title: "مرحله ۴: ثبت فروش (نقد / اقساط)",
    body:
      "همان صفحه فروش:\n" +
      "• شماره مشتری برای ارسال پیامک خرید و پیامک اعتبار\n" +
      "• در صورت نیاز تخفیف\n" +
      "• نوع پرداخت: نقدی یا اقساطی و تعداد قسط\n" +
      "• دکمه «ثبت خرید»\n\n" +
      "یک فروش نمونه ثبت کن و بعد ادامه آموزش را بزن.",
    path: "/admin",
  },
  {
    id: "view-sales",
    kind: "practice",
    title: "مرحله ۵: مشاهده فروش‌ها",
    body:
      "به بخش «فروش» برو (نوار پایین یا منو).\n" +
      "فاکتور ثبت‌شده را در لیست پیدا کن و جزئیات را ببین.\n\n" +
      "بعد «انجام دادم — ادامه آموزش».",
    path: "/admin/purchas",
  },
  {
    id: "reports",
    kind: "practice",
    title: "مرحله ۶: گزارشات",
    body:
      "به صفحه گزارشات برو (منوی همبرگر → مالی → گزارشات).\n" +
      "خلاصه فروش و آمار را مرور کن.\n\n" +
      "در پایان ادامه آموزش را بزن.",
    path: "/admin/reports",
  },
  {
    id: "finish",
    kind: "finish",
    title: "آفرین — آموزش تمام شد",
    body:
      "حالا می‌توانی همه کارها را خودت انجام بدهی.\n" +
      "هر زمان از تنظیمات → «مشاهده راهنما» می‌توانی این آموزش را دوباره ببینی.",
  },
];
