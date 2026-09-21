import { readAdminPosSettings, type AdminPosSettings } from "@/app/lib/adminPosSettings";

export const SETTINGS_SETUP_DONE_KEY = "admin_settings_setup_v1_done";
export const SETTINGS_SETUP_PROGRESS_KEY = "admin_settings_setup_v1_progress";
export const SETTINGS_SETUP_START_EVENT = "admin-settings-setup-start";

export type SettingsSetupToggleKey = Extract<
  keyof AdminPosSettings,
  | "menuMode"
  | "menuModeShowProductImages"
  | "menuTableOrdersPopupEnabled"
  | "showProductListOnMainPage"
  | "classicPosMode"
  | "installmentPaymentEnabled"
  | "debtPaymentEnabled"
  | "chequePaymentEnabled"
  | "kgSalesEnabled"
  | "askCustomerName"
  | "showDailyTicketNumber"
>;

export type SettingsSetupStepKind = "intro" | "toggle" | "finish";

export type SettingsSetupAnswers = Partial<Record<SettingsSetupToggleKey, boolean | "skipped">>;

export type SettingsSetupVisibleCtx = {
  answers: SettingsSetupAnswers;
  restaurantCafeEnabled: boolean;
};

export type SettingsSetupStep = {
  id: string;
  kind: SettingsSetupStepKind;
  title: string;
  body: string;
  settingKey?: SettingsSetupToggleKey;
  enableLabel?: string;
  disableLabel?: string;
  visible?: (ctx: SettingsSetupVisibleCtx) => boolean;
};

export const SETTINGS_SETUP_STEPS: SettingsSetupStep[] = [
  {
    id: "intro",
    kind: "intro",
    title: "تنظیم فروشگاه",
    body:
      "چند تنظیم مهم را مرحله‌به‌مرحله مشخص کن تا صفحه فروش مطابق کار خودت باشد.\n\n" +
      "هر مورد را می‌توانی رد کنی و بعداً از تنظیمات عوض کنی.",
  },
  {
    id: "menuMode",
    kind: "toggle",
    title: "حالت منو",
    body: "صفحه فروش به کارت‌های لمسی با فیلتر دسته تبدیل می‌شود. مناسب رستوران، کافه و فروش لمسی.",
    settingKey: "menuMode",
    enableLabel: "فعال شود",
    disableLabel: "غیرفعال بماند",
  },
  {
    id: "menuModeShowProductImages",
    kind: "toggle",
    title: "عکس کالا در حالت منو",
    body: "روی کارت‌های منو عکس کالا نشان داده شود. اگر خاموش باشد فقط نام و قیمت می‌آید.",
    settingKey: "menuModeShowProductImages",
    enableLabel: "عکس نشان داده شود",
    disableLabel: "بدون عکس",
    visible: ({ answers }) => isSettingChosenOn(answers, "menuMode"),
  },
  {
    id: "menuTableOrdersPopup",
    kind: "toggle",
    title: "پاپ‌آپ سفارش حضوری",
    body: "وقتی مشتری از منوی میز سفارش جدید بدهد، روی صفحه فروش خبر می‌آید تا سریع رسیدگی کنی.",
    settingKey: "menuTableOrdersPopupEnabled",
    enableLabel: "خبر بیاید",
    disableLabel: "لازم نیست",
    visible: ({ answers, restaurantCafeEnabled }) =>
      restaurantCafeEnabled && isSettingChosenOn(answers, "menuMode"),
  },
  {
    id: "showProductListOnMainPage",
    kind: "toggle",
    title: "لیست کالا در صفحه فروش",
    body: "جدول کالا روی صندوق برای جستجو و افزودن سریع از کش محلی. در حالت منو معمولاً لازم نیست.",
    settingKey: "showProductListOnMainPage",
    enableLabel: "لیست نشان داده شود",
    disableLabel: "مخفی بماند",
    visible: ({ answers }) => !isSettingChosenOn(answers, "menuMode"),
  },
  {
    id: "classicPosMode",
    kind: "toggle",
    title: "تم کلاسیک فاکتور",
    body: "ظاهر فاکتور ستونی نام، تعداد، قیمت و جمع. با حالت منو هم قابل ترکیب است.",
    settingKey: "classicPosMode",
    enableLabel: "تم کلاسیک",
    disableLabel: "ظاهر فعلی",
  },
  {
    id: "installmentPaymentEnabled",
    kind: "toggle",
    title: "پرداخت اقساطی",
    body: "گزینه اقساط هنگام ثبت فروش در سبد دیده شوند.",
    settingKey: "installmentPaymentEnabled",
    enableLabel: "فعال باشد",
    disableLabel: "پنهان شود",
  },
  {
    id: "debtPaymentEnabled",
    kind: "toggle",
    title: "فروش نسیه",
    body: "مشتری بصورت قرضی خرید می‌کند و بدهکار می‌شود و بعداً از بخش بدهکاران تسویه می‌کنی.",
    settingKey: "debtPaymentEnabled",
    enableLabel: "نسیه داشته باشم",
    disableLabel: "لازم نیست",
  },
  {
    id: "chequePaymentEnabled",
    kind: "toggle",
    title: "فروش چکی",
    body: "پرداخت با چک دریافتی ثبت‌شده. اول چک را در مالی ثبت می‌کنی، بعد در فروش همان را انتخاب می‌کنی.",
    settingKey: "chequePaymentEnabled",
    enableLabel: "چک داشته باشم",
    disableLabel: "لازم نیست",
  },
  {
    id: "kgSalesEnabled",
    kind: "toggle",
    title: "فروش کیلویی",
    body: "برای کالاهایی مثل مواد غذایی می‌توانی واحد کیلو بگذاری و در سبد مقدار اعشاری بزنی.",
    settingKey: "kgSalesEnabled",
    enableLabel: "فروش کیلو",
    disableLabel: "لازم نیست",
  },
  {
    id: "askCustomerName",
    kind: "toggle",
    title: "نام مشتری هنگام ثبت",
    body: "علاوه بر شماره تلفن، نام مشتری هم پرسیده شود.",
    settingKey: "askCustomerName",
    enableLabel: "نام هم گرفته شود",
    disableLabel: "فقط تلفن",
  },
  {
    id: "showDailyTicketNumber",
    kind: "toggle",
    title: "شماره فیش روزانه",
    body: "هر فروش یک شماره از ۱ می‌گیرد و هر روز از نو شروع می‌شود. در لیست فروش هم دیده می‌شود.",
    settingKey: "showDailyTicketNumber",
    enableLabel: "نمایش داده شود",
    disableLabel: "لازم نیست",
  },
  {
    id: "finish",
    kind: "finish",
    title: "تنظیمات آماده است",
    body:
      "هر زمان از صفحه تنظیمات می‌توانی این گزینه‌ها را عوض کنی.\n" +
      "مواردی که رد کردی با مقدار پیش‌فرض مانده‌اند.",
  },
];

export function isSettingChosenOn(
  answers: SettingsSetupAnswers,
  key: SettingsSetupToggleKey,
): boolean {
  const answered = answers[key];
  if (answered === true) return true;
  if (answered === false) return false;
  return Boolean(readAdminPosSettings()[key]);
}

export function getVisibleSettingsSetupSteps(
  ctx: SettingsSetupVisibleCtx,
): SettingsSetupStep[] {
  return SETTINGS_SETUP_STEPS.filter((step) => !step.visible || step.visible(ctx));
}

export function resolveSettingsSetupStepIndex(
  visibleSteps: SettingsSetupStep[],
  stepId: string,
): number {
  const found = visibleSteps.findIndex((step) => step.id === stepId);
  if (found >= 0) return found;
  const allIndex = SETTINGS_SETUP_STEPS.findIndex((step) => step.id === stepId);
  if (allIndex < 0) return 0;
  const next = visibleSteps.find((step) => {
    const idx = SETTINGS_SETUP_STEPS.findIndex((item) => item.id === step.id);
    return idx > allIndex;
  });
  if (next) {
    return Math.max(0, visibleSteps.findIndex((step) => step.id === next.id));
  }
  return Math.max(0, visibleSteps.length - 1);
}
