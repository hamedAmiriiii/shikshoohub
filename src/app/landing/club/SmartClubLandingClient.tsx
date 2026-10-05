"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  BadgePercent,
  BarChart3,
  BellRing,
  Brain,
  CalendarClock,
  ChevronDown,
  CircleX,
  Clock,
  Coins,
  Crown,
  Database,
  Filter,
  LayoutDashboard,
  Layers,
  Megaphone,
  MessageSquareText,
  PackagePlus,
  Puzzle,
  Receipt,
  RefreshCcw,
  Repeat,
  Rocket,
  ScanSearch,
  Send,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  UserCheck,
  Users,
  UserX,
  Wallet,
  Zap,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import LandingChrome from "../LandingChrome";
import ConsultationRequestForm from "../ConsultationRequestForm";
import { LOGIN_URL } from "../catalog";

const CTA_LABEL = "فعال‌سازی باشگاه مشتریان";
const SHOP_LANDING_URL = "/landing/shop";

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
  };
}

const SEGMENTS = [
  { label: "VIP", bar: "bg-amber-400", chip: "border-amber-400/30 bg-amber-400/10 text-amber-200", share: 11 },
  { label: "همیشگی", bar: "bg-emerald-400", chip: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200", share: 21 },
  { label: "رو به رشد", bar: "bg-teal-400", chip: "border-teal-400/30 bg-teal-400/10 text-teal-200", share: 15 },
  { label: "تازه‌وارد", bar: "bg-cyan-400", chip: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200", share: 14 },
  { label: "مدتی نخریده", bar: "bg-yellow-400", chip: "border-yellow-400/30 bg-yellow-400/10 text-yellow-200", share: 12 },
  { label: "نزدیک به رفتن", bar: "bg-orange-400", chip: "border-orange-400/30 bg-orange-400/10 text-orange-200", share: 10 },
  { label: "دیگه نمیاد", bar: "bg-rose-500", chip: "border-rose-500/30 bg-rose-500/10 text-rose-200", share: 7 },
  { label: "بقیه", bar: "bg-slate-500", chip: "border-slate-400/30 bg-slate-400/10 text-slate-300", share: 10 },
];

const QUESTIONS: { icon: LucideIcon; text: string }[] = [
  { icon: CalendarClock, text: "چه زمانی احتمالاً دوباره خرید می‌کند؟" },
  { icon: UserX, text: "کدام مشتری‌ها دیگر برنمی‌گردند؟" },
  { icon: Coins, text: "کدام مشتری‌ها ارزش بیشتری برای کسب‌وکار شما دارند؟" },
  { icon: Crown, text: "چه کسی فقط یک خرید با VIP شدن فاصله دارد؟" },
  { icon: BadgePercent, text: "برای چه کسی تخفیف یا اعتبار بفرستید؟" },
  { icon: BarChart3, text: "کدام کمپین واقعاً برایتان فروش ایجاد کرده است؟" },
];

const NO_NEED = [
  { icon: Database, text: "لازم نیست مشتری‌ها را دوباره در یک سیستم جدا ثبت کنید." },
  { icon: ScanSearch, text: "لازم نیست حدس بزنید چه کسی مشتری خوبی است." },
  { icon: Send, text: "لازم نیست برای همه یک پیام یکسان بفرستید." },
];

type Feature = {
  icon: LucideIcon;
  gradient: string;
  title: string;
  body: ReactNode;
  chips?: string[];
  quotes?: string[];
  footer?: ReactNode;
};

const FEATURES: Feature[] = [
  {
    icon: Brain,
    gradient: "from-violet-500 to-fuchsia-500",
    title: "گروه‌بندی هوشمند مشتریان",
    body: (
      <>
        مشتری‌ها را با تحلیل <b className="text-white">RFM</b> بر اساس تازگی خرید، تعداد خرید و مبلغ خرید
        دسته‌بندی کنید. همراه با برچسب‌هایی مثل:
      </>
    ),
    chips: ["وقت خرید دوباره", "نزدیک به VIP", "خرید زیاد", "خرید کم"],
  },
  {
    icon: LayoutDashboard,
    gradient: "from-cyan-500 to-blue-500",
    title: "داشبورد هوشمند",
    body: "هر روز مهم‌ترین وضعیت مشتری‌ها را ببینید؛ همراه با نمودار روند و مقایسه عملکرد.",
    chips: ["VIP", "آماده خرید مجدد", "در معرض ریزش", "وفادار"],
  },
  {
    icon: Zap,
    gradient: "from-amber-500 to-orange-500",
    title: "پیشنهاد اقدام خودکار",
    body: "سیستم هر شب فرصت‌های مهم را پیدا می‌کند و برای هرکدام، اقدام پیشنهادی ارائه می‌دهد.",
    quotes: [
      "۲۳ مشتری در معرض ریزش هستند.",
      "۱۵ مشتری به VIP شدن نزدیک‌اند.",
      "۴۲ مشتری زمان خرید مجددشان رسیده است.",
    ],
    footer: <b className="text-amber-200">با یک کلیک اجرا کنید.</b>,
  },
  {
    icon: Megaphone,
    gradient: "from-fuchsia-500 to-pink-500",
    title: "کمپین‌های هدفمند",
    body: "به‌جای ارسال پیامک به همه، دقیقاً همان گروهی را انتخاب کنید که برای کمپین شما مناسب است. مثلاً:",
    quotes: [
      "مشتریانی که بیشتر از ۴۵ روز است خرید نکرده‌اند",
      "مشتریانی که حداقل ۳ بار خرید کرده‌اند",
      "مشتریانی که یک محصول خاص را خریده‌اند",
    ],
  },
  {
    icon: ShoppingBag,
    gradient: "from-emerald-500 to-teal-500",
    title: "کمپین کالایی",
    body: "یک محصول خاص را انتخاب کنید و مشتری‌ها را بر اساس رفتار خریدشان هدف بگیرید:",
    chips: ["محصول را خریده‌اند", "محصول را نخریده‌اند", "زمان خرید دوباره‌شان رسیده"],
    footer: (
      <>
        حتی برای فروش مکمل: <span className="text-emerald-200">کسانی که «محصول A» را خریده‌اند اما «محصول B» را نخریده‌اند.</span>
      </>
    ),
  },
  {
    icon: Wallet,
    gradient: "from-violet-500 to-indigo-500",
    title: "اعتبار خرید و کش‌بک",
    body: "بخشی از مبلغ خرید را به اعتبار خرید بعدی تبدیل کنید و برای خریدهای با مبلغ بالاتر، اعتبار بیشتری در نظر بگیرید. اعتبار قابل استفاده در:",
    chips: ["صندوق فروشگاه", "سفارش با QR", "فروشگاه آنلاین"],
    footer: (
      <span className="inline-flex items-center gap-2 font-bold text-violet-200">
        ۳٪ <ArrowLeft size={14} /> ۴٪ <ArrowLeft size={14} /> ۵٪
      </span>
    ),
  },
  {
    icon: MessageSquareText,
    gradient: "from-sky-500 to-cyan-500",
    title: "پیامک هوشمند",
    body: "پیامک‌های زیر را هدفمند ارسال کنید:",
    chips: ["خوش‌آمد", "اعتبار", "یادآوری خرید مجدد", "تولد", "کمپین تبلیغاتی"],
    footer: <span className="text-sky-200">چند پیام ارسال شد؟ چند پیام تحویل شد؟ و چه نتیجه‌ای داشت؟</span>,
  },
  {
    icon: TrendingUp,
    gradient: "from-rose-500 to-fuchsia-500",
    title: "گزارش اثر کمپین",
    body: "قبل از کمپین بدانید چه تعداد مشتری هدف هستند و چه میزان پیامک نیاز دارید. بعد از کمپین هم ببینید:",
    chips: ["نرخ تبدیل", "فروش", "تعداد فاکتور", "میانگین فاکتور", "فاصله تا بازگشت مشتری", "بازدهی اعتبار"],
  },
];

type Scenario = {
  id: string;
  icon: LucideIcon;
  tone: string;
  short: string;
  title: string;
  story: ReactNode[];
  suggestionLabel: string;
  suggestion: ReactNode;
  sms?: string;
  after?: string;
  result: ReactNode;
};

const SCENARIOS: Scenario[] = [
  {
    id: "churn",
    icon: TriangleAlert,
    tone: "text-rose-300 bg-rose-500/10 border-rose-500/30",
    short: "مشتری در حال رفتن",
    title: "مشتری‌ای که دارد از دست می‌رود",
    story: [
      "مشتری شما قبلاً هر ماه خرید می‌کرده.",
      "اما حالا ۵۰ روز است خبری از او نیست.",
      <>
        باشگاه این مشتری را در گروه <b className="text-rose-200">«در معرض ریزش»</b> قرار می‌دهد.
      </>,
    ],
    suggestionLabel: "پیشنهاد سیستم",
    suggestion: "کمپین بازگشت مشتری + اعتبار هدیه + پیامک",
    sms: "علی عزیز، دلمان برایتان تنگ شده! ۵۰,۰۰۰ تومان اعتبار هدیه در فروشگاه منتظر شماست.",
    after: "مشتری پیام را دریافت می‌کند، برمی‌گردد و خرید می‌کند.",
    result: "به‌جای از دست دادن یک مشتری قدیمی، برای بازگشت او اقدام کرده‌اید.",
  },
  {
    id: "near-vip",
    icon: Crown,
    tone: "text-amber-300 bg-amber-500/10 border-amber-500/30",
    short: "نزدیک به VIP",
    title: "مشتری نزدیک به VIP",
    story: [
      "یک مشتری در چند ماه گذشته مرتب خرید کرده و فقط کمی با شرایط VIP شدن فاصله دارد.",
      <>
        سیستم آن را با برچسب <b className="text-amber-200">«نزدیک به VIP»</b> مشخص می‌کند.
      </>,
    ],
    suggestionLabel: "پیشنهاد",
    suggestion: "یک اعتبار یا پیشنهاد تشویقی برای خرید بعدی.",
    sms: "مریم عزیز، یک قدم تا عضویت VIP مانده‌اید — با خرید بعدی وارد باشگاه ویژه شوید.",
    after: "مشتری یک قدم دیگر برمی‌دارد و به مشتری ویژه تبدیل می‌شود.",
    result: "به‌جای تخفیف دادن به همه، فقط مشتری‌ای را هدف گرفته‌اید که ارزش سرمایه‌گذاری بیشتری دارد.",
  },
  {
    id: "product",
    icon: PackagePlus,
    tone: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30",
    short: "فروش یک محصول خاص",
    title: "فروش یک محصول خاص",
    story: [
      "یک محصول جدید یا کم‌فروش دارید و می‌خواهید فروشش را بیشتر کنید.",
      "در باشگاه انتخاب می‌کنید:",
      <b key="b" className="text-cyan-200">
        مشتریانی که محصولات مشابه را خریده‌اند اما این محصول را نخریده‌اند.
      </b>,
    ],
    suggestionLabel: "اقدام",
    suggestion: "پیامک هدفمند فقط برای همین گروه",
    result: (
      <>
        به‌جای تبلیغ برای کل بانک مشتریان، محصول را به <b>مشتری‌هایی که احتمال خرید بیشتری دارند</b> معرفی
        می‌کنید.
      </>
    ),
  },
  {
    id: "complement",
    icon: Puzzle,
    tone: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    short: "فروش مکمل",
    title: "فروش مکمل",
    story: [
      "مشتری محصول A را خریده، اما محصول مکمل B را هنوز نخریده است.",
      "باشگاه این مشتری‌ها را پیدا می‌کند. مثلاً:",
      <b key="b" className="text-emerald-200">
        «محصول A را خریدند، محصول B را نخریدند.»
      </b>,
    ],
    suggestionLabel: "اقدام",
    suggestion: "ارسال یک پیشنهاد مناسب برای محصول B",
    result: <b>افزایش فروش بدون نیاز به پیدا کردن مشتری جدید.</b>,
  },
  {
    id: "repurchase",
    icon: Repeat,
    tone: "text-violet-300 bg-violet-500/10 border-violet-500/30",
    short: "آماده خرید مجدد",
    title: "مشتری آماده خرید مجدد",
    story: [
      "سیستم متوجه می‌شود مشتری طبق الگوی قبلی، معمولاً هر ۳۰ روز خرید می‌کند.",
      "حالا روزهای پایانی چرخه خرید اوست.",
    ],
    suggestionLabel: "یک پیامک ساده",
    suggestion: "یادآوری خرید مجدد، درست سر وقت",
    sms: "احتمالاً وقت خرید دوباره شما رسیده؛ منتظرتان هستیم.",
    result: "درست زمانی با مشتری ارتباط می‌گیرید که احتمال خرید مجدد او بیشتر است.",
  },
];

const FLOW: { icon: LucideIcon; text: string }[] = [
  { icon: Receipt, text: "فاکتور ثبت می‌شود" },
  { icon: Database, text: "اطلاعات خرید ذخیره می‌شود" },
  { icon: Activity, text: "رفتار مشتری تحلیل می‌شود" },
  { icon: Layers, text: "مشتری دسته‌بندی می‌شود" },
  { icon: Target, text: "فرصت فروش شناسایی می‌شود" },
  { icon: Megaphone, text: "کمپین اجرا می‌شود" },
  { icon: BarChart3, text: "نتیجه اندازه‌گیری می‌شود" },
];

const CREDIT_TIERS = [
  { range: "تا ۱ میلیون", pct: "۳٪", h: "h-16" },
  { range: "۱ تا ۳ میلیون", pct: "۴٪", h: "h-24" },
  { range: "بالای ۳ میلیون", pct: "۵٪", h: "h-32" },
];

const CREDIT_CYCLE: { icon: LucideIcon; text: string; pos: string }[] = [
  { icon: ShoppingBag, text: "مشتری خرید می‌کند", pos: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" },
  { icon: Wallet, text: "اعتبار می‌گیرد", pos: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2" },
  { icon: RefreshCcw, text: "برای استفاده از اعتبار برمی‌گردد", pos: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" },
  { icon: Repeat, text: "دوباره خرید می‌کند", pos: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2" },
];

const NOT_JUST = [
  "فقط یک دفترچه شماره تلفن نیست.",
  "فقط سیستم ارسال پیامک نیست.",
  "فقط کارت تخفیف دیجیتال نیست.",
  "فقط گزارش فروش نیست.",
];

const HUB_NODES: { icon: LucideIcon; label: string }[] = [
  { icon: Receipt, label: "فروش" },
  { icon: Coins, label: "حسابداری" },
  { icon: Activity, label: "رفتار مشتری" },
  { icon: Megaphone, label: "بازاریابی" },
];

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: "آیا باشگاه مشتریان به نرم‌افزار فروش و حسابداری متصل است؟",
    a: "بله. باشگاه مشتریان هوشمند با اطلاعات فروش و خرید ثبت‌شده در نرم‌افزار فروش و حسابداری کار می‌کند و از این اطلاعات برای تحلیل رفتار مشتری، گروه‌بندی و اجرای کمپین استفاده می‌کند.",
  },
  {
    q: "آیا باید اطلاعات مشتری‌ها را دستی وارد کنیم؟",
    a: "اطلاعات خرید مشتری‌ها از داده‌های فروش نرم‌افزار استفاده می‌شود و برای استفاده از امکانات باشگاه، اطلاعات مشتری می‌تواند در زمان ثبت فروش یا عضویت در باشگاه تکمیل شود.",
  },
  {
    q: "RFM چیست؟",
    a: (
      <>
        RFM روشی برای تحلیل ارزش و رفتار مشتری بر اساس سه شاخص است:{" "}
        <b className="text-white">آخرین خرید، تعداد خرید و مبلغ خرید.</b> باشگاه مشتریان با استفاده از این
        اطلاعات، مشتری‌ها را به گروه‌های مختلف تقسیم می‌کند تا بدانید برای هر گروه چه اقدامی مناسب‌تر است.
      </>
    ),
  },
  {
    q: "آیا خود سیستم مشتری‌های در معرض ریزش را پیدا می‌کند؟",
    a: (
      <>
        بله. باشگاه با تحلیل رفتار خرید مشتری‌ها، گروه‌هایی مانند{" "}
        <b className="text-white">«مدتی نخریده»، «نزدیک به رفتن» و «دیگه نمیاد»</b> را شناسایی می‌کند و برای
        آن‌ها پیشنهاد اقدام ارائه می‌دهد.
      </>
    ),
  },
  {
    q: "آیا می‌توانیم برای یک محصول خاص کمپین اجرا کنیم؟",
    a: (
      <>
        بله. می‌توانید مشتری‌ها را بر اساس خرید یک کالا هدف‌گذاری کنید؛ مثلاً کسانی که کالا را خریده‌اند،
        نخریده‌اند یا زمان خرید مجدد آن کالا برایشان رسیده است. حتی می‌توانید برای{" "}
        <b className="text-white">فروش محصولات مکمل</b> مشتریانی را پیدا کنید که محصول اول را خریده‌اند اما
        محصول مکمل را هنوز خریداری نکرده‌اند.
      </>
    ),
  },
  {
    q: "آیا امکان ارسال پیامک وجود دارد؟",
    a: "بله. امکان ارسال پیامک خوش‌آمد، پیامک‌های هدفمند کمپین، یادآوری خرید مجدد، پیامک اعتبار و پیامک‌های مناسبتی وجود دارد و گزارش وضعیت ارسال و تحویل نیز قابل مشاهده است.",
  },
  {
    q: "اعتبار خرید یا کش‌بک چگونه کار می‌کند؟",
    a: "می‌توانید درصدی از مبلغ خرید را به‌عنوان اعتبار خرید بعدی مشتری در نظر بگیرید. درصد اعتبار می‌تواند به‌صورت پلکانی تنظیم شود و برای اعتبار نیز تاریخ انقضا تعیین کنید.",
  },
  {
    q: "آیا می‌توانیم بفهمیم کمپین چقدر فروش ایجاد کرده است؟",
    a: "بله. گزارش کمپین شامل اطلاعاتی مانند تعداد مشتری‌های برگشته، نرخ تبدیل، فروش ایجادشده، تعداد فاکتورها، میانگین مبلغ فاکتور، فاصله تا بازگشت و بازدهی اعتبار است.",
  },
  {
    q: "آیا همه مشتری‌ها باید یک پیام یکسان دریافت کنند؟",
    a: (
      <>
        خیر. اتفاقاً هدف باشگاه مشتریان هوشمند این است که{" "}
        <b className="text-white">پیام مناسب را به مشتری مناسب ارسال کنید.</b> می‌توانید بر اساس تعداد خرید،
        مبلغ خرید، آخرین خرید، گروه مشتری، خرید یک محصول خاص و زمان خرید مجدد، مشتری‌ها را فیلتر و هدف‌گذاری
        کنید.
      </>
    ),
  },
  {
    q: "آیا می‌توانیم کمپین را قبل از ارسال بررسی کنیم؟",
    a: "بله. قبل از ارسال، تعداد مشتری‌های هدف، میزان پیامک موردنیاز و اطلاعات مربوط به کمپین نمایش داده می‌شود تا قبل از اجرا تصمیم دقیق‌تری بگیرید.",
  },
];

function SectionHead({
  eyebrow,
  title,
  subtitle,
  align = "center",
  hideSubtitleOnMobile = false,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "start";
  hideSubtitleOnMobile?: boolean;
}) {
  const center = align === "center";
  return (
    <motion.div {...fadeUp()} className={center ? "text-center max-w-3xl mx-auto mb-8 md:mb-12" : "mb-6 md:mb-8"}>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200 text-xs font-semibold">
        <Sparkles size={12} />
        {eyebrow}
      </span>
      <h2 className="mt-4 text-2xl md:text-4xl font-black leading-tight text-white">{title}</h2>
      {subtitle ? (
        <p className={`mt-4 text-slate-400 leading-8 md:text-lg ${hideSubtitleOnMobile ? "hidden md:block" : ""}`}>
          {subtitle}
        </p>
      ) : null}
    </motion.div>
  );
}

function PrimaryButton({ onClick, children, className = "" }: { onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-l from-violet-600 via-fuchsia-600 to-pink-600 text-white font-bold shadow-xl shadow-fuchsia-900/40 hover:shadow-fuchsia-700/40 hover:brightness-110 transition ${className}`}
    >
      {children}
      <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
    </button>
  );
}

function HeroDashboard() {
  const kpis = [
    { label: "VIP", value: "۱۲۸", icon: Crown, tone: "text-amber-300", bg: "bg-amber-400/10" },
    { label: "آماده خرید مجدد", value: "۴۲", icon: Repeat, tone: "text-cyan-300", bg: "bg-cyan-400/10" },
    { label: "در معرض ریزش", value: "۲۳", icon: TriangleAlert, tone: "text-rose-300", bg: "bg-rose-400/10" },
    { label: "وفادار", value: "۳۱۲", icon: UserCheck, tone: "text-emerald-300", bg: "bg-emerald-400/10" },
  ];
  const actions = [
    { icon: TriangleAlert, tone: "text-rose-300", text: "۲۳ مشتری در معرض ریزش", cta: "کمپین بازگشت" },
    { icon: Crown, tone: "text-amber-300", text: "۱۵ مشتری نزدیک به VIP", cta: "اعتبار تشویقی" },
    { icon: Repeat, tone: "text-cyan-300", text: "۴۲ مشتری وقت خرید مجدد", cta: "پیامک یادآوری" },
  ];

  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-to-br from-violet-600/30 via-fuchsia-600/20 to-cyan-500/20 blur-3xl rounded-[3rem]" />
      <div className="relative rounded-3xl border border-white/10 bg-[#0f1424]/90 backdrop-blur-xl shadow-2xl shadow-violet-950/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <LayoutDashboard size={16} className="text-fuchsia-300" />
            داشبورد باشگاه
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            متصل به فروش
          </span>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center mb-2`}>
                  <k.icon size={16} className={k.tone} />
                </div>
                <div className="text-xl font-black text-white">{k.value}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{k.label}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
              <span>ترکیب مشتریان</span>
              <span>تحلیل RFM</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
              {SEGMENTS.map((s) => (
                <div key={s.label} className={s.bar} style={{ width: `${s.share}%` }} title={s.label} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2">
              <Zap size={12} className="text-amber-300" />
              پیشنهادهای امشب
            </div>
            <div className="space-y-2">
              {actions.map((a) => (
                <div
                  key={a.text}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-200 min-w-0">
                    <a.icon size={14} className={`${a.tone} shrink-0`} />
                    <span className="truncate">{a.text}</span>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white">
                    {a.cta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="hidden sm:flex absolute -top-5 -left-4 items-center gap-2 rounded-2xl border border-emerald-400/30 bg-[#0f1a1a]/95 backdrop-blur px-3.5 py-2.5 shadow-xl"
      >
        <TrendingUp size={16} className="text-emerald-300" />
        <div>
          <div className="text-[10px] text-emerald-300/80">کمپین بازگشت</div>
          <div className="text-xs font-bold text-white">۷۸ مشتری برگشتند</div>
        </div>
      </motion.div>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="hidden sm:flex absolute -bottom-5 -right-4 items-center gap-2 rounded-2xl border border-fuchsia-400/30 bg-[#1a0f1f]/95 backdrop-blur px-3.5 py-2.5 shadow-xl"
      >
        <MessageSquareText size={16} className="text-fuchsia-300" />
        <div className="text-xs font-bold text-white">پیامک بازگشت تحویل شد</div>
        <CheckCircle2 size={14} className="text-emerald-300" />
      </motion.div>
    </div>
  );
}

function SmsBubble({ text }: { text: string }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[#0c111d] p-4 shadow-inner">
      <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-3">
        <MessageSquareText size={13} />
        پیامک ارسالی
      </div>
      <div className="max-w-[90%] rounded-2xl rounded-tr-md bg-gradient-to-l from-violet-600/90 to-fuchsia-600/90 px-4 py-3 text-sm leading-7 text-white shadow-lg">
        {text}
      </div>
      <div className="mt-2 text-[10px] text-emerald-300/80 flex items-center gap-1">
        <CheckCircle2 size={11} />
        تحویل شد
      </div>
    </div>
  );
}

function ScenariosSection() {
  const [active, setActive] = useState(0);
  const s = SCENARIOS[active];

  return (
    <section id="scenarios" className="py-12 md:py-28 border-y border-white/5 bg-white/[0.015]">
      <div className="max-w-6xl mx-auto px-4">
        <SectionHead eyebrow="سناریوهای واقعی" title="ببینید باشگاه مشتریان چطور فروش می‌سازد" />

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
            {SCENARIOS.map((item, i) => {
              const selected = i === active;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`shrink-0 flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-right transition ${
                    selected
                      ? "border-fuchsia-400/40 bg-gradient-to-l from-violet-600/20 to-fuchsia-600/10 shadow-lg shadow-fuchsia-950/40"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <span className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${item.tone}`}>
                    <item.icon size={17} />
                  </span>
                  <span>
                    <span className="block text-[11px] text-slate-500">سناریو {(i + 1).toLocaleString("fa-IR")}</span>
                    <span className={`block text-sm font-bold whitespace-nowrap ${selected ? "text-white" : "text-slate-300"}`}>
                      {item.short}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-[#0f1424] p-5 md:p-8 overflow-hidden md:min-h-[420px]">
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-fuchsia-600/10 blur-3xl rounded-full" />
            <AnimatePresence mode="wait">
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="relative grid md:grid-cols-[1fr_300px] gap-8"
              >
                <div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${s.tone}`}>
                    <s.icon size={13} />
                    سناریو {(active + 1).toLocaleString("fa-IR")}
                  </span>
                  <h3 className="mt-4 text-xl md:text-2xl font-black text-white">{s.title}</h3>
                  <div className="mt-4 space-y-2.5 text-slate-300 leading-8">
                    {s.story.map((line, i) => (
                      <p key={i} className={i === 0 ? undefined : "hidden md:block"}>
                        {line}
                      </p>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-500/[0.07] p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-violet-200 mb-1.5">
                      <Zap size={13} />
                      {s.suggestionLabel}
                    </div>
                    <div className="font-bold text-white">{s.suggestion}</div>
                  </div>

                  {s.after ? <p className="mt-4 text-slate-400 leading-8 hidden md:block">{s.after}</p> : null}
                </div>

                <div className="flex flex-col gap-4">
                  {s.sms ? <SmsBubble text={s.sms} /> : null}
                  <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.07] p-5 mt-auto">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 mb-2">
                      <CheckCircle2 size={14} />
                      نتیجه
                    </div>
                    <div className="text-sm leading-7 text-emerald-50">{s.result}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-12 md:py-24">
      <div className="max-w-3xl mx-auto px-4">
        <SectionHead eyebrow="سؤالات متداول" title="هر چیزی که قبل از شروع باید بدانید" />
        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className={`rounded-2xl border transition ${
                  isOpen ? "border-fuchsia-400/30 bg-white/[0.04]" : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-right"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-white">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-fuchsia-300" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-sm leading-8 text-slate-400">{item.a}</div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function SmartClubLandingClient() {
  const scrollToForm = () => {
    document.getElementById("consult")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <LandingChrome onStartFree={scrollToForm} ctaLabel={CTA_LABEL} hideRegister loginLabel="ورود پنل">
      {/* HERO */}
      <section className="relative overflow-hidden pt-10 pb-12 md:pt-20 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(168,85,247,0.22),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(6,182,212,0.12),_transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />

        <div className="max-w-6xl mx-auto px-4 relative grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
          <motion.div {...fadeUp()} className="text-center lg:text-right">
            <Link
              href={SHOP_LANDING_URL}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-slate-200 hover:border-fuchsia-400/40 transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              مستقیماً متصل به نرم‌افزار فروش و حسابداری وبینو
              <ArrowLeft size={13} className="text-fuchsia-300" />
            </Link>

            <h1 className="mt-6 font-black leading-[1.25]">
              <span className="block text-2xl md:text-4xl text-slate-200">مشتری‌ها را فقط ثبت نکنید؛</span>
              <span className="block mt-2 text-3xl md:text-5xl bg-gradient-to-l from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
                برگردانیدشان و بیشتر بفروشید.
              </span>
            </h1>

            <p className="mt-6 text-slate-300 text-base md:text-lg leading-8">
              <b className="text-white">باشگاه مشتریان هوشمند، مستقیماً به نرم‌افزار فروش و حسابداری شما متصل است</b>{" "}
              و اطلاعات واقعی خرید مشتری‌ها را به فرصت‌های فروش تبدیل می‌کند.
            </p>
            <p className="mt-4 text-slate-400 leading-8 hidden md:block">
              بفهمید چه کسی آماده خرید است، چه کسی در حال از دست رفتن است، چه کسی به VIP شدن نزدیک است و به هرکدام{" "}
              <b className="text-fuchsia-200">چه زمانی و با چه پیشنهادی</b> پیام بدهید.
            </p>
            <p className="mt-5 text-lg font-bold text-white hidden md:block">از اطلاعات فروش خودتان، برای فروش بیشتر استفاده کنید.</p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <PrimaryButton onClick={scrollToForm}>{CTA_LABEL}</PrimaryButton>
              <a
                href="#scenarios"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl border border-white/15 bg-white/5 text-slate-100 font-semibold hover:bg-white/10 transition"
              >
                دیدن سناریوها
              </a>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 text-sm text-emerald-300/90">
              <CheckCircle2 size={16} />
              بدون نیاز به ثبت دستی اطلاعات خرید مشتری
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.15)} className="px-4 sm:px-6 lg:px-0">
            <HeroDashboard />
          </motion.div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-12 md:py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHead
            eyebrow="یک مشکل آشنا برای خیلی از کسب‌وکارها"
            title="مشتری خرید می‌کند... اما بعد چه؟"
            subtitle="مشتری امروز از شما خرید می‌کند. اما آیا می‌دانید:"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUESTIONS.map((q, i) => (
              <motion.div
                key={q.text}
                {...fadeUp(i * 0.05)}
                className={`group items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 hover:bg-white/[0.04] transition ${
                  i >= 3 ? "hidden md:flex" : "flex"
                }`}
              >
                <span className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-fuchsia-400/40 transition">
                  <q.icon size={20} className="text-fuchsia-300" />
                </span>
                <p className="text-slate-200 leading-7 font-medium pt-1.5">{q.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            {...fadeUp(0.1)}
            className="mt-8 rounded-3xl border border-amber-400/25 bg-gradient-to-l from-amber-500/10 to-orange-500/[0.04] p-6 md:p-8 flex flex-col md:flex-row gap-5 md:items-center"
          >
            <span className="w-14 h-14 rounded-2xl bg-amber-400/15 flex items-center justify-center shrink-0">
              <TriangleAlert size={26} className="text-amber-300" />
            </span>
            <div>
              <p className="text-lg md:text-xl font-black text-white">
                اگر جواب این سؤال‌ها را ندانید، بخشی از فرصت فروش شما از دست می‌رود.
              </p>
              <p className="mt-2 text-slate-300 leading-8 hidden md:block">
                باشگاه مشتریان هوشمند این اطلاعات را از{" "}
                <Link href={SHOP_LANDING_URL} className="font-bold text-amber-200 underline decoration-amber-400/40 underline-offset-4 hover:text-white">
                  فروش‌های ثبت‌شده در نرم‌افزار فروش و حسابداری شما
                </Link>{" "}
                می‌گیرد و به شما می‌گوید چه اقدامی انجام دهید.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CORE ADVANTAGE */}
      <section className="py-12 md:py-28 border-y border-white/5 bg-white/[0.015] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-violet-700/10 blur-[120px] rounded-full" />
        <div className="max-w-6xl mx-auto px-4 relative">
          <SectionHead eyebrow="مزیت اصلی" title="اطلاعات فروش شما، تبدیل به موتور بازاریابی شما می‌شود." />

          <div className="grid md:grid-cols-3 gap-4">
            {NO_NEED.map((item, i) => (
              <motion.div
                key={item.text}
                {...fadeUp(i * 0.06)}
                className="rounded-2xl border border-white/10 bg-[#0f1424] p-6"
              >
                <div className="relative w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <item.icon size={22} className="text-slate-400" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="block w-14 h-0.5 bg-rose-400/80 rotate-[-35deg] rounded-full" />
                  </span>
                </div>
                <p className="text-slate-200 leading-8 font-medium">{item.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.p {...fadeUp(0.1)} className="mt-10 text-center text-slate-300 leading-8 md:text-lg max-w-3xl mx-auto hidden md:block">
            باشگاه مشتریان هوشمند بر اساس <b className="text-white">رفتار واقعی خرید مشتری</b>، آن‌ها را تحلیل
            می‌کند و فرصت‌های فروش را به شما نشان می‌دهد.
          </motion.p>

          <motion.div {...fadeUp(0.15)} className="mt-10">
            <div className="text-center text-sm font-bold text-slate-400 mb-4">نتیجه؟</div>
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
              {[
                { icon: Users, label: "مشتری درست" },
                { icon: Target, label: "پیشنهاد درست" },
                { icon: Clock, label: "زمان درست" },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-3 md:gap-4">
                  {i > 0 ? <span className="text-2xl font-black text-fuchsia-400">+</span> : null}
                  <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white">
                    <item.icon size={18} className="text-fuchsia-300" />
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-center my-4">
              <ArrowDown className="text-fuchsia-400" />
            </div>
            <div className="mx-auto max-w-md rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 p-[1px] shadow-xl shadow-fuchsia-950/50">
              <div className="rounded-2xl bg-[#140f22] px-6 py-4 text-center text-lg md:text-xl font-black text-white">
                خرید بیشتر و مشتری وفادارتر.
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4 JOBS */}
      <section className="py-12 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHead eyebrow="چطور فروش را بالا می‌برد" title="۴ کاری که باشگاه برای افزایش فروش انجام می‌دهد" />

          <div className="grid md:grid-cols-2 gap-5">
            <motion.div {...fadeUp()} className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 flex flex-col">
              <JobHead n="۱" icon={Crown} title="مشتری‌های ارزشمند را پیدا می‌کند" />
              <p className="text-slate-400 leading-8 hidden md:block">
                با تحلیل تعداد خرید، مبلغ خرید و زمان آخرین خرید، مشتری‌ها به‌صورت خودکار دسته‌بندی می‌شوند.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {SEGMENTS.map((s) => (
                  <span key={s.label} className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${s.chip}`}>
                    {s.label}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-slate-400 leading-8 hidden md:block">دیگر لازم نیست صدها مشتری را یکی‌یکی بررسی کنید.</p>
              <p className="mt-auto pt-3 font-bold text-white">سیستم به شما می‌گوید روی چه کسی تمرکز کنید.</p>
            </motion.div>

            <motion.div {...fadeUp(0.06)} className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 flex flex-col">
              <JobHead n="۲" icon={BellRing} title="قبل از رفتن مشتری، به شما هشدار می‌دهد" />
              <p className="text-slate-400 leading-8 hidden md:block">
                مشتری‌ای که قبلاً مرتب خرید می‌کرده اما حالا مدت زیادی است خرید نکرده، یک فرصت از دست‌رفته نیست؛{" "}
                <b className="text-white">یک مشتری قابل بازگشت است.</b>
              </p>
              <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-4">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-bold text-white">رضا — خرید ماهانه</span>
                  <span className="inline-flex items-center gap-1 text-rose-300 font-bold">
                    <TriangleAlert size={12} />
                    در معرض ریزش
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-[82%] rounded-full bg-gradient-to-l from-rose-500 via-orange-400 to-yellow-300" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-2">
                  <span>آخرین خرید: ۵۰ روز پیش</span>
                  <span>میانگین فاصله: ۳۰ روز</span>
                </div>
              </div>
              <p className="mt-5 text-slate-400 leading-8 hidden md:block">
                باشگاه مشتریان، مشتری‌های در معرض ریزش را شناسایی می‌کند تا قبل از اینکه کاملاً از دست بروند، برایشان
                کمپین بازگشت اجرا کنید.
              </p>
            </motion.div>

            <motion.div {...fadeUp(0.04)} className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 flex flex-col">
              <JobHead n="۳" icon={CalendarClock} title="زمان مناسب خرید دوباره را پیدا می‌کند" />
              <p className="text-slate-400 leading-8">
                اگر یک مشتری معمولاً هر ۳۰ روز خرید می‌کند، چرا روز ۶۰ام به او پیام بدهید؟
              </p>
              <ul className="mt-5 space-y-2 md:hidden">
                <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300">خرید قبلی</li>
                <li className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-300">
                  روز ۳۰ — زمان پیام
                </li>
                <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-rose-300/80">روز ۶۰ — دیر است</li>
              </ul>
              <div className="mt-6 mb-2 px-2 hidden md:block">
                <div className="relative h-1.5 rounded-full bg-gradient-to-l from-emerald-400 via-emerald-400/60 to-white/10">
                  {[
                    { pos: "right-0", label: "خرید قبلی", dot: "bg-slate-300", text: "text-slate-400" },
                    { pos: "right-1/2", label: "روز ۳۰ — زمان پیام", dot: "bg-emerald-400 ring-4 ring-emerald-400/25", text: "text-emerald-300 font-bold" },
                    { pos: "left-0", label: "روز ۶۰ — دیر است", dot: "bg-rose-400/70", text: "text-rose-300/80" },
                  ].map((p) => (
                    <div key={p.label} className={`absolute top-1/2 ${p.pos} -translate-y-1/2 flex flex-col items-center`}>
                      <span className={`w-3.5 h-3.5 rounded-full ${p.dot}`} />
                      <span className={`absolute top-5 whitespace-nowrap text-[11px] ${p.text}`}>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-10 text-slate-400 leading-8 hidden md:block">
                باشگاه با بررسی الگوی خرید مشتری، <b className="text-white">زمان احتمالی خرید مجدد</b> را تشخیص می‌دهد
                و مشتری را درست زمانی هدف می‌گیرید که احتمال خرید دوباره‌اش بیشتر است.
              </p>
            </motion.div>

            <motion.div {...fadeUp(0.1)} className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 flex flex-col">
              <JobHead n="۴" icon={BarChart3} title="نتیجه کمپین را اندازه می‌گیرد" />
              <p className="text-slate-400 leading-8 hidden md:block">
                ارسال پیامک به‌تنهایی مهم نیست. <b className="text-white">فروش حاصل از پیامک مهم است.</b> بعد از کمپین
                ببینید:
              </p>
              <ul className="mt-4 grid sm:grid-cols-2 gap-2">
                {[
                  "چند نفر برگشتند؟",
                  "چند نفر خرید کردند؟",
                  "چقدر فروش ایجاد شد؟",
                  "میانگین فاکتور چقدر بود؟",
                  "هر ۱ تومان اعتبار، چقدر فروش ایجاد کرد؟",
                ].map((q) => (
                  <li
                    key={q}
                    className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-semibold text-slate-200 sm:last:col-span-2"
                  >
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    {q}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <motion.div
            {...fadeUp(0.1)}
            className="mt-6 hidden md:block rounded-3xl border border-emerald-400/20 bg-gradient-to-l from-emerald-500/10 to-cyan-500/[0.04] p-6 text-center text-lg md:text-xl font-bold text-white leading-9"
          >
            اینجاست که تبلیغات از «هزینه» به یک{" "}
            <span className="text-emerald-300">سرمایه‌گذاری قابل اندازه‌گیری</span> تبدیل می‌شود.
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-12 md:py-28 border-y border-white/5 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHead eyebrow="امکانات" title="هر چیزی که برای یک باشگاه مشتریان حرفه‌ای لازم دارید" />
          <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp((i % 3) * 0.06)}
                className="break-inside-avoid mb-5 rounded-3xl border border-white/10 bg-[#0f1424] p-6 hover:border-white/20 transition"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-lg mb-4`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-black text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-7 hidden md:block">{f.body}</p>
                {f.quotes ? (
                  <div className="mt-4 space-y-2">
                    {f.quotes.map((q, qi) => (
                      <div
                        key={q}
                        className={`rounded-xl border-r-2 border-fuchsia-400/60 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 ${
                          qi > 0 ? "hidden md:block" : ""
                        }`}
                      >
                        «{q}»
                      </div>
                    ))}
                  </div>
                ) : null}
                {f.chips ? (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {f.chips.map((c) => (
                      <span key={c} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-200">
                        {c}
                      </span>
                    ))}
                  </div>
                ) : null}
                {f.footer ? <div className="mt-4 text-sm leading-7 hidden md:block">{f.footer}</div> : null}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <ScenariosSection />

      {/* INTEGRATION FLOW */}
      <section className="py-12 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.08),_transparent_60%)]" />
        <div className="max-w-6xl mx-auto px-4 relative">
          <SectionHead
            eyebrow="یک مزیت مهم‌تر از همه"
            title="باشگاه مشتریان از اطلاعات فروش واقعی شما استفاده می‌کند"
            hideSubtitleOnMobile
            subtitle={
              <>
                باشگاه مشتریان هوشمند یک سیستم جدا و بی‌ارتباط با فروش شما نیست.{" "}
                <Link href={SHOP_LANDING_URL} className="font-bold text-white underline decoration-fuchsia-400/50 underline-offset-4 hover:text-fuchsia-200">
                  مستقیماً به نرم‌افزار فروش و حسابداری شما متصل است.
                </Link>{" "}
                یعنی اطلاعاتی که هنگام فروش و ثبت فاکتور ایجاد می‌شوند، برای شناخت مشتری و اجرای کمپین استفاده می‌شوند.
              </>
            }
          />

          <div className="relative">
            <div className="hidden lg:block absolute top-9 right-[7%] left-[7%] h-0.5 bg-gradient-to-l from-violet-500 via-fuchsia-500 to-emerald-400 opacity-60" />
            <div className="grid grid-cols-2 gap-3 lg:grid lg:grid-cols-7 lg:gap-3">
              {FLOW.map((step, i) => (
                <motion.div
                  key={step.text}
                  {...fadeUp(i * 0.06)}
                  className={`flex flex-col items-center ${i === FLOW.length - 1 ? "col-span-2 lg:col-span-1" : ""}`}
                >
                  <div className="relative z-10 w-12 h-12 lg:w-[72px] lg:h-[72px] rounded-2xl bg-[#0f1424] border border-white/10 flex items-center justify-center shadow-lg">
                    <step.icon size={22} className={i === FLOW.length - 1 ? "text-emerald-300" : "text-fuchsia-300"} />
                    <span className="absolute -top-2 -right-2 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-[10px] lg:text-[11px] font-black flex items-center justify-center">
                      {(i + 1).toLocaleString("fa-IR")}
                    </span>
                  </div>
                  <div className="mt-2 lg:mt-3 text-center text-xs lg:text-sm font-bold text-slate-200 leading-5 lg:leading-6 px-1">
                    {step.text}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.p {...fadeUp(0.1)} className="mt-8 lg:mt-14 text-center text-xl md:text-3xl font-black text-white">
            از ثبت فاکتور تا بازگشت مشتری؛{" "}
            <span className="bg-gradient-to-l from-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">همه در یک چرخه.</span>
          </motion.p>
        </div>
      </section>

      {/* CREDIT */}
      <section className="py-12 md:py-28 border-y border-white/5 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <SectionHead
              align="start"
              eyebrow="اعتبار خرید؛ مشتری را برای خرید بعدی برگردانید"
              title="هر خرید، می‌تواند دلیل خرید بعدی باشد."
              subtitle="با کش‌بک، درصدی از خرید مشتری را به اعتبار تبدیل کنید و برای اعتبار، تاریخ انقضا تعیین کنید."
              hideSubtitleOnMobile
            />
            <motion.div {...fadeUp(0.05)} className="rounded-3xl border border-white/10 bg-[#0f1424] p-6">
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm font-bold text-white">پله‌های اعتبار</span>
                <span className="rounded-lg bg-violet-500/15 border border-violet-400/20 px-2.5 py-1 text-[11px] font-bold text-violet-200">
                  تا ۵ پله قابل تنظیم
                </span>
              </div>
              <div className="flex items-end justify-around gap-4 h-40">
                {CREDIT_TIERS.map((t, i) => (
                  <div key={t.pct} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-lg font-black text-white">{t.pct}</span>
                    <motion.div
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.15 * i }}
                      style={{ transformOrigin: "bottom" }}
                      className={`w-full max-w-[72px] ${t.h} rounded-t-xl bg-gradient-to-t from-violet-600 to-fuchsia-500`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-around gap-4 mt-2">
                {CREDIT_TIERS.map((t) => (
                  <span key={t.range} className="flex-1 text-center text-[11px] text-slate-500">
                    خرید {t.range}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/[0.07] px-4 py-3">
                <BellRing size={18} className="text-amber-300 shrink-0" />
                <span className="text-sm text-amber-50">۷ روز قبل از انقضا، پیامک یادآوری برای مشتری ارسال می‌شود.</span>
              </div>
            </motion.div>
          </div>

          <motion.div {...fadeUp(0.1)} className="flex flex-col items-center">
            <div className="sm:hidden w-full space-y-2">
              {CREDIT_CYCLE.map((c, i) => (
                <div key={c.text} className="flex flex-col items-center">
                  <div className="w-full rounded-2xl border border-white/10 bg-[#0f1424] px-4 py-3 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-fuchsia-500/15 flex items-center justify-center shrink-0">
                      <c.icon size={17} className="text-fuchsia-300" />
                    </span>
                    <span className="text-sm font-bold text-white">{c.text}</span>
                  </div>
                  <ArrowDown size={16} className={`mt-2 ${i === CREDIT_CYCLE.length - 1 ? "text-fuchsia-300 rotate-180" : "text-fuchsia-400/70"}`} />
                </div>
              ))}
            </div>
            <div className="hidden sm:block relative w-72 h-72 my-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-fuchsia-500/30"
              />
              <div className="absolute inset-10 rounded-full bg-gradient-to-br from-violet-600/25 to-fuchsia-600/10 border border-white/10 flex flex-col items-center justify-center text-center px-6">
                <RefreshCcw size={26} className="text-fuchsia-300 mb-2" />
                <span className="text-sm font-black text-white leading-6">چرخه خرید تکراری</span>
              </div>
              {CREDIT_CYCLE.map((c) => (
                <div key={c.text} className={`absolute ${c.pos} w-36 sm:w-40`}>
                  <div className="rounded-2xl border border-white/10 bg-[#0f1424] px-3 py-2.5 shadow-xl flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-fuchsia-500/15 flex items-center justify-center shrink-0">
                      <c.icon size={15} className="text-fuchsia-300" />
                    </span>
                    <span className="text-xs font-bold text-white leading-5">{c.text}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-lg font-black text-white">یک چرخه ساده برای افزایش خرید تکراری.</p>
          </motion.div>
        </div>
      </section>

      {/* MEASURABLE */}
      <section className="py-12 md:py-28">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <SectionHead align="start" eyebrow="تبلیغاتتان را قابل اندازه‌گیری کنید" title="دیگر فقط نگویید «پیامک فرستادیم»." />
            <motion.p {...fadeUp(0.05)} className="text-slate-300 leading-8 md:text-lg hidden md:block">
              بگویید از ۵۰۰ مشتری هدف، چند نفر برگشتند، چقدر فروش ساختید و هر تومان اعتبار چند برابر برگشت. باشگاه
              مشتریان کمک می‌کند بدانید <b className="text-white">کدام اقدام واقعاً برای کسب‌وکار شما نتیجه می‌دهد.</b>
            </motion.p>
            <motion.ul {...fadeUp(0.1)} className="mt-6 space-y-3 hidden md:block">
              {["فروش حاصل از کمپین", "میانگین فاکتور", "نرخ تبدیل", "بازدهی اعتبار"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-200 font-semibold">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <CheckCircle2 size={15} className="text-emerald-300" />
                  </span>
                  {item}
                </li>
              ))}
            </motion.ul>
          </div>

          <motion.div {...fadeUp(0.1)} className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 blur-3xl rounded-[3rem]" />
            <div className="relative rounded-3xl border border-white/10 bg-[#0f1424] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 font-bold text-white">
                  <BarChart3 size={18} className="text-emerald-300" />
                  گزارش کمپین «بازگشت مشتری»
                </div>
                <span className="text-[10px] text-slate-500">نمونه</span>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.07] p-5">
                <div className="text-sm text-emerald-200">از ۵۰۰ مشتری هدف</div>
                <div className="mt-1 text-3xl font-black text-white">
                  ۷۸ نفر <span className="text-lg font-bold text-emerald-300">برگشتند</span>
                </div>
                <div className="mt-4 h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "15.6%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-cyan-400"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: "فروش حاصل از کمپین", value: "۱۸۷ میلیون", unit: "تومان", icon: Coins },
                  { label: "میانگین فاکتور", value: "۲٫۴ میلیون", unit: "تومان", icon: Receipt },
                  { label: "نرخ تبدیل", value: "۱۵٫۶٪", unit: "", icon: Filter },
                  { label: "بازدهی اعتبار", value: "۴٫۸ برابر", unit: "", icon: Rocket },
                ].map((k) => (
                  <div key={k.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <k.icon size={16} className="text-cyan-300 mb-2" />
                    <div className="text-lg font-black text-white">
                      {k.value} {k.unit ? <span className="text-xs font-medium text-slate-500">{k.unit}</span> : null}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{k.label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-slate-500 text-center">اعداد این گزارش نمونه هستند.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DIFFERENT */}
      <section className="py-12 md:py-28 border-y border-white/5 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHead eyebrow="تفاوت" title="چه چیزی این باشگاه را متفاوت می‌کند؟" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {NOT_JUST.map((t, i) => (
              <motion.div
                key={t}
                {...fadeUp(i * 0.05)}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4"
              >
                <CircleX size={20} className="text-rose-400 shrink-0" />
                <span className="text-slate-300 font-semibold">{t}</span>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp(0.1)} className="mt-12 flex flex-col items-center">
            <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3">
              {HUB_NODES.map((n, i) => (
                <div key={n.label} className="flex items-center gap-2 md:gap-3">
                  {i > 0 ? <span className="text-xl font-black text-fuchsia-400">+</span> : null}
                  <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0f1424] px-4 py-3 font-bold text-white">
                    <n.icon size={17} className="text-fuchsia-300" />
                    {n.label}
                  </span>
                </div>
              ))}
            </div>
            <ArrowDown className="my-4 text-fuchsia-400" />
            <div className="max-w-3xl text-center rounded-3xl bg-gradient-to-l from-violet-600 via-fuchsia-600 to-pink-600 p-[1px] shadow-2xl shadow-fuchsia-950/50">
              <div className="rounded-3xl bg-[#130f20] px-6 py-6 md:px-10">
                <h3 className="text-lg md:text-2xl font-black text-white leading-9">
                  باشگاه مشتریان هوشمند، فروش + حسابداری + رفتار مشتری + بازاریابی را به هم وصل می‌کند.
                </h3>
                <p className="mt-3 text-slate-300 leading-8 hidden md:block">
                  تا اطلاعاتی که هر روز در کسب‌وکار شما تولید می‌شود، تبدیل به{" "}
                  <b className="text-white">اقدام واقعی برای افزایش فروش</b> شود.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-12 md:py-28">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            {...fadeUp()}
            className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-700 via-fuchsia-700 to-pink-700 p-8 md:p-14 shadow-2xl shadow-fuchsia-950/50"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_55%)]" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="relative grid md:grid-cols-[1.3fr_1fr] gap-10 items-center">
              <div>
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">
                  مشتری‌های فعلی شما، بزرگ‌ترین فرصت فروش شما هستند.
                </h2>
                <p className="mt-4 text-violet-100/90 leading-8 hidden md:block">
                  برای پیدا کردن مشتری جدید هزینه می‌کنید. اما قبل از آن، ببینید از مشتری‌هایی که همین حالا دارید چقدر
                  می‌توانید بیشتر بفروشید.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={scrollToForm}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-violet-800 font-black shadow-lg hover:bg-violet-50 transition"
                  >
                    {CTA_LABEL}
                    <ArrowLeft size={18} />
                  </button>
                  <Link
                    href={SHOP_LANDING_URL}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl border border-white/30 text-white font-semibold hover:bg-white/10 transition"
                  >
                    نرم‌افزار فروش و حسابداری
                  </Link>
                </div>
                <p className="mt-4 text-sm text-violet-100/80">مستقیماً متصل به نرم‌افزار فروش و حسابداری شما</p>
              </div>
              <ul className="space-y-3">
                {[
                  { icon: Users, text: "مشتری‌ها را بشناسید." },
                  { icon: Clock, text: "به‌موقع با آن‌ها ارتباط بگیرید." },
                  { icon: RefreshCcw, text: "دوباره به فروشگاه برگردانیدشان." },
                  { icon: BarChart3, text: "و نتیجه را اندازه بگیرید." },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur border border-white/15 px-4 py-3 text-white font-bold">
                    <item.icon size={18} className="shrink-0" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      <ConsultationRequestForm
        source="smart_club"
        title="فعال‌سازی باشگاه مشتریان هوشمند"
        subtitle="فرم را پر کنید تا همکاران وبینو برای راه‌اندازی باشگاه مشتریان روی فروشگاه شما تماس بگیرند."
        businessPlaceholder="نام فروشگاه یا کسب‌وکار"
        submitGradientClass="from-violet-600 to-fuchsia-600"
      />

      <FaqSection />

      {/* CLOSING */}
      <section className="hidden md:block pb-24 pt-4">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div {...fadeUp()}>
            <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">
              آماده‌اید از مشتری‌های فعلی، فروش بیشتری بسازید؟
            </h2>
            <p className="mt-4 text-lg text-slate-300">اطلاعات فروش شما همین حالا ارزشمند است.</p>
            <p className="mt-1 text-slate-400">وقت آن است از این اطلاعات استفاده کنید.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <PrimaryButton onClick={scrollToForm}>باشگاه مشتریان هوشمند را فعال کنید</PrimaryButton>
              <Link
                href={LOGIN_URL}
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-2xl border border-white/15 bg-white/5 text-slate-100 font-semibold hover:bg-white/10 transition"
              >
                ورود به پنل
              </Link>
            </div>
            <p className="mt-10 text-base md:text-lg font-bold bg-gradient-to-l from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              هوشمندتر بفروشید. بیشتر مشتری برگردانید. دقیق‌تر رشد کنید.
            </p>
          </motion.div>
        </div>
      </section>
    </LandingChrome>
  );
}

function JobHead({ n, icon: Icon, title }: { n: string; icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-fuchsia-950/50 shrink-0">
        <Icon size={24} className="text-white" />
        <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white text-violet-700 text-xs font-black flex items-center justify-center">
          {n}
        </span>
      </div>
      <h3 className="text-lg md:text-xl font-black text-white leading-8">{title}</h3>
    </div>
  );
}
