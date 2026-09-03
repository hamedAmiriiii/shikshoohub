export const REGISTER_URL = "/admin/register-shop";
export const LOGIN_URL = "/admin/login";
export const OIL_LOGIN_URL = "/oil/login";
export const AGENCY_REQUEST_URL = "/agency-request";
export const SUPPORT_PHONE = "09399166196";
export const SUPPORT_TEL = "tel:09399166196";
export const LINK_BALE = "https://ble.ir/AmiriWebino";
export const LINK_RUBIKA = "https://rubika.ir/WebinoPlus";
export const ENAMAD_HTML =
  "<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=7529264&Code=GLi3yveM4jposDINx6Ukri04cknZLvuY'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=7529264&Code=GLi3yveM4jposDINx6Ukri04cknZLvuY' alt='' style='cursor:pointer' code='GLi3yveM4jposDINx6Ukri04cknZLvuY'></a>";

export const TRIAL_SHORT = "یک هفته";
export const TRIAL_CTA = "شروع رایگان یک هفته‌ای";
export const TRIAL_BADGE = "۸ محصول — یک هفته تست رایگان";

export type ProductIconName =
  | "calculator"
  | "droplets"
  | "gift"
  | "coins"
  | "calendar"
  | "video"
  | "share"
  | "store";

export type LandingScreenshot = { src: string; title: string };

export type LandingProduct = {
  slug: string;
  href: string;
  title: string;
  tag?: string;
  icon: ProductIconName;
  color: string;
  desc: string;
  lead: string;
  items: string[];
  loginUrl: string;
  registerUrl: string;
  loginLabel: string;
  screenshots: LandingScreenshot[];
};

export const LANDING_PRODUCTS: LandingProduct[] = [
  {
    slug: "accounting",
    href: "/landing/shop",
    title: "حسابداری و فروش",
    tag: "پرفروش",
    icon: "calculator",
    color: "from-emerald-500 to-teal-500",
    desc: "صندوق فروش، فاکتور، انبار، کارتخوان، اقساط و گزارش سود — همه در یک پنل.",
    lead: "مدیریت کامل فروشگاه: فروش، انبار، اقساط، گزارش و چاپ. قابل نصب روی موبایل و ویندوز.",
    items: ["ثبت فروش و بارکد", "انبار و موجودی", "گزارش سود و زیان", "اقساط و نسیه"],
    loginUrl: LOGIN_URL,
    registerUrl: REGISTER_URL,
    loginLabel: "ورود به پنل فروش",
    screenshots: [
      { src: "/landing/1.png", title: "صفحه فروش" },
      { src: "/landing/2.png", title: "حالت منو" },
      { src: "/landing/3.png", title: "لیست محصولات" },
      { src: "/landing/4.png", title: "گزارش فروش" },
      { src: "/landing/5.png", title: "موجودی انبار" },
      { src: "/landing/9.png", title: "چاپ فاکتور" },
      { src: "/landing/10.png", title: "داشبورد" },
    ],
  },
  {
    slug: "oil",
    href: "/landing/products/oil",
    title: "تعویض روغن",
    tag: "جدید",
    icon: "droplets",
    color: "from-yellow-500 to-amber-600",
    desc: "مخصوص تعویض روغنی: پلاک، پیامک یادآوری، روغن و فیلتر، فروش و سود.",
    lead: "ثبت تعویض با پلاک ایران، پیامک نوبت بعدی، محصولات روغن و فیلتر با قیمت خرید و فروش، و گزارش ساده سود. قابل نصب روی موبایل.",
    items: ["ثبت تعویض با پلاک", "پیامک یادآوری", "روغن و فیلتر", "گزارش فروش و سود"],
    loginUrl: OIL_LOGIN_URL,
    registerUrl: OIL_LOGIN_URL,
    loginLabel: "ورود تعویض روغن",
    screenshots: [],
  },
  {
    slug: "club",
    href: "/landing/products/club",
    title: "باشگاه مشتریان",
    icon: "gift",
    color: "from-violet-500 to-fuchsia-500",
    desc: "امتیاز، اعتبار و پیامک وفاداری تا مشتری دوباره به کسب‌وکارت برگردد.",
    lead: "سطح مشتری، امتیاز، اعتبار و پیامک مناسبتی — برای برگشت دوباره خریدار.",
    items: ["امتیاز و اعتبار", "پیامک هدفمند", "سطح مشتری", "تخفیف وفاداری"],
    loginUrl: LOGIN_URL,
    registerUrl: REGISTER_URL,
    loginLabel: "ورود به پنل باشگاه",
    screenshots: [
      { src: "/landing/6.png", title: "مدیریت مشتریان" },
      { src: "/landing/7.png", title: "فروش اقساطی و اعتبار" },
    ],
  },
  {
    slug: "gold",
    href: "/landing/products/gold",
    title: "خرید و فروش طلا",
    icon: "coins",
    color: "from-amber-500 to-orange-500",
    desc: "وزن، عیار و نرخ روز. موجودی طلا و سود هر معامله برای طلافروشی.",
    lead: "ثبت خرید و فروش طلا با وزن، عیار و نرخ. موجودی صندوق و سود معامله مشخص است.",
    items: ["نرخ روز", "وزن و عیار", "موجودی طلا", "سود معامله"],
    loginUrl: LOGIN_URL,
    registerUrl: REGISTER_URL,
    loginLabel: "ورود به پنل طلا",
    screenshots: [{ src: "/landing/4.png", title: "گزارش و سود معامله" }],
  },
  {
    slug: "booking",
    href: "/landing/products/booking",
    title: "نوبت‌دهی",
    icon: "calendar",
    color: "from-cyan-500 to-blue-500",
    desc: "رزرو نوبت آنلاین، تقویم خدمات و پیامک یادآوری برای مشتری و پرسنل.",
    lead: "تقویم نوبت، خدمات، پرسنل و پیامک یادآوری — مخصوص تعمیرگاه، سالن و خدمات.",
    items: ["تقویم نوبت", "پیامک یادآوری", "خدمات و پرسنل", "نوبت مشتری"],
    loginUrl: OIL_LOGIN_URL,
    registerUrl: OIL_LOGIN_URL,
    loginLabel: "ورود به نوبت‌دهی",
    screenshots: [],
  },
  {
    slug: "class",
    href: "/landing/products/class",
    title: "کلاس آنلاین و اتاق جلسه",
    icon: "video",
    color: "from-pink-500 to-rose-500",
    desc: "کلاس زنده و اتاق جلسه با لینک ورود — بدون نصب نرم‌افزار سنگین.",
    lead: "اتاق جلسه و کلاس زنده از مرورگر. لینک دعوت بفرست؛ دانشجو یا همکار وارد می‌شود.",
    items: ["اتاق جلسه", "کلاس زنده", "لینک دعوت", "ورود از مرورگر"],
    loginUrl: LOGIN_URL,
    registerUrl: REGISTER_URL,
    loginLabel: "ورود به کلاس و جلسه",
    screenshots: [],
  },
  {
    slug: "social",
    href: "/landing/products/social",
    title: "شبکه اجتماعی",
    icon: "share",
    color: "from-indigo-500 to-violet-500",
    desc: "فضای اجتماعی کسب‌وکار: پست، فید و ارتباط با مخاطبان.",
    lead: "پست بگذار، با مخاطب در تعامل باش و پروفایل کسب‌وکارت را زنده نگه دار.",
    items: ["پست و فید", "تعامل مخاطب", "پروفایل کسب‌وکار", "اعلان"],
    loginUrl: LOGIN_URL,
    registerUrl: REGISTER_URL,
    loginLabel: "ورود به شبکه اجتماعی",
    screenshots: [],
  },
  {
    slug: "store",
    href: "/landing/products/store",
    title: "فروشگاه آنلاین",
    icon: "store",
    color: "from-teal-500 to-emerald-500",
    desc: "ویترین اینترنتی با همان موجودی پنل. مشتری سفارش می‌دهد، شما پیگیری می‌کنید.",
    lead: "ویترین کالا، سبد و سفارش اینترنتی روی همان موجودی حسابداری.",
    items: ["ویترین کالا", "سبد خرید", "سفارش اینترنتی", "پرداخت"],
    loginUrl: LOGIN_URL,
    registerUrl: REGISTER_URL,
    loginLabel: "ورود به فروشگاه آنلاین",
    screenshots: [
      { src: "/landing/8.png", title: "سفارشات اینترنتی" },
      { src: "/landing/3.png", title: "محصولات ویترین" },
    ],
  },
];

export function getLandingProduct(slug: string) {
  return LANDING_PRODUCTS.find((p) => p.slug === slug);
}
