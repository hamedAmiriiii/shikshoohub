import type { Metadata } from "next";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_OIL_PUBLIC_BASE_URL ||
  "https://webinoo-plus.ir"
).replace(/\/$/, "");

export const SITE_NAME = "وبینو";
export const SITE_NAME_EN = "Webino";
export const SITE_EMAIL = "info@webinoo-plus.ir";
export const SITE_PHONE = "09399166196";
export const SITE_PHONE_INTL = "+989399166196";
export const DEFAULT_OG_IMAGE = "/icon-512.png";

export const DEFAULT_TITLE =
  "وبینو | نرم‌افزار حسابداری فروشگاهی، تعویض روغن، طلا و فروشگاه آنلاین";

export const DEFAULT_DESCRIPTION =
  "وبینو مجموعه نرم‌افزارهای کسب‌وکار: حسابداری و فروش فروشگاهی، تعویض روغن، باشگاه مشتریان، خرید و فروش طلا، نوبت‌دهی، کلاس آنلاین یادینو، شبکه اجتماعی و فروشگاه اینترنتی. نصب روی موبایل و ویندوز، یک هفته تست رایگان.";

export const DEFAULT_KEYWORDS = [
  "وبینو",
  "Webino",
  "نرم افزار حسابداری فروشگاهی",
  "نرم افزار فروشگاهی",
  "حسابداری فروشگاه",
  "نرم افزار تعویض روغن",
  "نرم افزار طلافروشی",
  "نرم افزار نوبت دهی",
  "باشگاه مشتریان",
  "فروشگاه آنلاین",
  "کلاس آنلاین",
  "یادینو",
  "فاکتور فروش",
  "مدیریت انبار",
  "نرم افزار صندوق فروش",
  "PWA",
];

export const ORGANIZATION = {
  name: SITE_NAME,
  legalName: SITE_NAME_EN,
  url: SITE_URL,
  email: SITE_EMAIL,
  telephone: SITE_PHONE_INTL,
  address: "کرمان، بلوار جمهوری، پلاک ۳۰۱",
  sameAs: ["https://ble.ir/AmiriWebino", "https://rubika.ir/WebinoPlus"],
} as const;

const APP_ICONS: NonNullable<Metadata["icons"]> = {
  icon: [
    { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
  apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
};

const NOINDEX_PREFIXES = [
  "/admin",
  "/oil",
  "/oilservice",
  "/cart",
  "/orders",
  "/main",
  "/referrals",
  "/api",
];

export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isNoIndexPath(pathname: string): boolean {
  const p = pathname || "/";
  if (NOINDEX_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))) {
    return true;
  }
  return p.includes("/reserv/") || p.includes("/room/");
}

export const NOINDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
    noarchive: true,
  },
};

export const INDEX_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
};

export function pageMetadata({
  title,
  description,
  path,
  keywords,
  image,
  noIndex = false,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = absoluteUrl(image || DEFAULT_OG_IMAGE);

  return {
    title,
    description,
    keywords: keywords?.length ? [...DEFAULT_KEYWORDS, ...keywords] : DEFAULT_KEYWORDS,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "technology",
    alternates: {
      canonical: url,
      languages: { "fa-IR": url },
    },
    robots: noIndex ? NOINDEX_ROBOTS : INDEX_ROBOTS,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "fa_IR",
      type: "website",
      images: [{ url: ogImage, width: 512, height: 512, alt: title }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [ogImage],
    },
    icons: APP_ICONS,
  };
}

export const defaultPublicMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...pageMetadata({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: "/",
  }),
  icons: APP_ICONS,
};

export { APP_ICONS };
