import type { Metadata } from "next";
import LandingChrome from "@/app/landing/LandingChrome";
import { SUPPORT_PHONE, SUPPORT_TEL } from "@/app/landing/catalog";

export const metadata: Metadata = {
  title: "حریم خصوصی | وبینو",
  description: "سیاست حفظ حریم خصوصی وبینو و نحوهٔ استفاده از داده‌های کاربران، از جمله اتصال به گوگل شیت.",
  alternates: { canonical: "/privacy-policy" },
};

const LAST_UPDATED_FA = "۱۱ مهر ۱۴۰۵";
const LAST_UPDATED_EN = "October 3, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-100">{title}</h2>
      <div className="space-y-2 text-sm leading-7 text-slate-300">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <LandingChrome stickyCta={false}>
      <main className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-l from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
            سیاست حفظ حریم خصوصی وبینو
          </h1>
          <p className="text-xs text-slate-500">آخرین به‌روزرسانی: {LAST_UPDATED_FA}</p>
        </header>

        <Section title="۱. دربارهٔ این سند">
          <p>
            وبینو (webinoo-plus.ir) نرم‌افزار آنلاین مدیریت فروشگاه، صندوق فروش، حسابداری و باشگاه مشتریان است. این سند
            توضیح می‌دهد چه اطلاعاتی جمع‌آوری می‌کنیم، چگونه از آن استفاده می‌کنیم و چه اختیاری روی آن دارید.
          </p>
        </Section>

        <Section title="۲. اطلاعاتی که جمع‌آوری می‌کنیم">
          <ul className="list-disc pr-5 space-y-1">
            <li>اطلاعات حساب فروشگاه و کاربران آن: نام، شمارهٔ موبایل و اطلاعات ورود.</li>
            <li>داده‌هایی که فروشگاه در نرم‌افزار ثبت می‌کند: کالاها، فاکتورها، مشتریان، اعتبارات، چک‌ها، نسیه و اسناد مالی.</li>
            <li>اطلاعات فنی لازم برای کارکرد سرویس، مانند آمار بازدید و گزارش خطا.</li>
          </ul>
          <p>داده‌های هر فروشگاه متعلق به همان فروشگاه است و فقط برای ارائهٔ خدمات به همان فروشگاه استفاده می‌شود.</p>
        </Section>

        <Section title="۳. اتصال به حساب گوگل (گوگل شیت)">
          <p>
            فروشگاه می‌تواند به اختیار خود، حساب گوگلش را برای ارسال نسخه‌ای از داده‌های فروشگاه به گوگل شیت متصل کند. در
            این صورت:
          </p>
          <ul className="list-disc pr-5 space-y-1">
            <li>
              فقط این دسترسی‌ها درخواست می‌شود: آدرس ایمیل حساب گوگل (برای نمایش حساب متصل) و دسترسی{" "}
              <span dir="ltr">drive.file</span> که تنها به فایل‌هایی اجازه می‌دهد که خود وبینو می‌سازد. وبینو به سایر
              فایل‌های گوگل‌درایو شما دسترسی ندارد.
            </li>
            <li>
              از این دسترسی فقط برای ساخت یک شیت در گوگل‌درایو خود شما و نوشتن جداولی که خودتان انتخاب کرده‌اید استفاده
              می‌شود.
            </li>
            <li>توکن دسترسی گوگل به‌صورت رمزشده روی سرور نگهداری می‌شود و در اختیار هیچ شخص ثالثی قرار نمی‌گیرد.</li>
            <li>داده‌های دریافتی از گوگل برای تبلیغات، فروش به دیگران یا آموزش مدل‌های هوش مصنوعی استفاده نمی‌شود.</li>
            <li>
              با زدن «خروج از حساب گوگل» در تنظیمات، توکن از سرور حذف می‌شود. همچنین می‌توانید دسترسی را از{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                تنظیمات حساب گوگل
              </a>{" "}
              لغو کنید. شیت ساخته‌شده در درایو شما می‌ماند و مالک آن خودتان هستید.
            </li>
          </ul>
          <p>
            استفاده و انتقال اطلاعات دریافتی از APIهای گوگل توسط وبینو، تابع{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              Google API Services User Data Policy
            </a>{" "}
            از جمله الزامات Limited Use است.
          </p>
        </Section>

        <Section title="۴. نحوهٔ استفاده از اطلاعات">
          <ul className="list-disc pr-5 space-y-1">
            <li>ارائه و نگهداری خدمات نرم‌افزار و پشتیبانی از کاربران.</li>
            <li>ارسال پیامک‌هایی که خود فروشگاه برای مشتریانش تعریف می‌کند.</li>
            <li>بهبود کیفیت و امنیت سرویس.</li>
          </ul>
        </Section>

        <Section title="۵. اشتراک‌گذاری اطلاعات">
          <p>
            اطلاعات کاربران فروخته یا اجاره داده نمی‌شود. فقط در موارد لازم برای ارائهٔ خدمات (مانند سرویس ارسال پیامک یا
            درگاه پرداخت) و به حداقل میزان لازم، یا در صورت الزام قانونی، اطلاعات در اختیار طرف‌های مربوط قرار می‌گیرد.
          </p>
        </Section>

        <Section title="۶. امنیت و نگهداری">
          <p>
            اطلاعات روی سرورهای امن و با ارتباط رمزشده (HTTPS) نگهداری می‌شود. فروشگاه هر زمان می‌تواند از داده‌های خود
            پشتیبان بگیرد. با درخواست حذف حساب، داده‌های فروشگاه مطابق قوانین حذف می‌شود.
          </p>
        </Section>

        <Section title="۷. حقوق شما">
          <p>
            می‌توانید درخواست مشاهده، اصلاح یا حذف اطلاعات خود را از طریق پشتیبانی ثبت کنید. اتصال گوگل را هم هر زمان
            می‌توانید از تنظیمات قطع کنید.
          </p>
        </Section>

        <Section title="۸. تماس با ما">
          <p>
            پشتیبانی وبینو:{" "}
            <a href={SUPPORT_TEL} className="text-cyan-400 hover:underline" dir="ltr">
              {SUPPORT_PHONE}
            </a>
          </p>
        </Section>

        <hr className="border-white/10" />

        <div dir="ltr" className="space-y-6 text-left">
          <header className="space-y-1">
            <h2 className="text-xl font-bold text-slate-100">Privacy Policy (English summary)</h2>
            <p className="text-xs text-slate-500">Last updated: {LAST_UPDATED_EN}</p>
          </header>
          <div className="space-y-3 text-sm leading-7 text-slate-300">
            <p>
              Webino (webinoo-plus.ir) is an online point-of-sale, accounting and customer-club software for shops. Shop
              data belongs to the shop and is used only to provide the service to that shop.
            </p>
            <p className="font-semibold text-slate-100">Google user data</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                When a shop chooses to connect its Google account, Webino requests only the user&apos;s email address
                and the <code>drive.file</code> scope, which grants access solely to files created by Webino.
              </li>
              <li>
                This access is used only to create a spreadsheet in the user&apos;s own Google Drive and write the shop
                tables the user selects. Webino cannot see any other files in the user&apos;s Drive.
              </li>
              <li>
                The Google OAuth token is stored encrypted on our servers and is never shared with third parties. Google
                user data is not used for advertising, sold, or used to train AI/ML models.
              </li>
              <li>
                Users can disconnect at any time from the app settings (the stored token is deleted) or revoke access at{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  myaccount.google.com/permissions
                </a>
                . The created spreadsheet remains owned by the user.
              </li>
            </ul>
            <p>
              Webino&apos;s use and transfer to any other app of information received from Google APIs will adhere to
              the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <p>
              Contact: <a href={SUPPORT_TEL} className="text-cyan-400 hover:underline">{SUPPORT_PHONE}</a>
            </p>
          </div>
        </div>
      </main>
    </LandingChrome>
  );
}
