import Link from "next/link";
import { billiardHref } from "@/app/lib/billiardHosts";

export function SiteFooter() {
  const brand = process.env.NEXT_PUBLIC_BILLIARD_BRAND_NAME || "هیأت بیلیارد";
  return (
    <footer className="mt-16 border-t border-felt-900/10 bg-felt-950 text-felt-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="text-lg">{brand}</div>
          <p className="mt-2 text-sm text-felt-200/80">
            سامانه مدیریت مسابقات، جدول، رنکینگ و آرشیو هیأت.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link href={billiardHref("/about")} className="hover:underline">
            درباره هیأت
          </Link>
          <Link href={billiardHref("/contact")} className="hover:underline">
            تماس با ما
          </Link>
          <Link href={billiardHref("/news")} className="hover:underline">
            اخبار و اطلاعیه‌ها
          </Link>
        </div>
        <div className="text-sm text-felt-200/70">دامنه: billiard.webinoplus.ir</div>
      </div>
    </footer>
  );
}
