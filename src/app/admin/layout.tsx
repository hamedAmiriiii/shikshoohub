"use client";
import SimpleBottomNavigationAtelier from './SimpleBottomNavigationAtelier';
import Header from '../componentsShop/Header';
import ShopAccessWatcher from '../componentsShop/ShopAccessWatcher';
import AdminThemeProvider from './theme/AdminThemeProvider';
import AdminOnboardingProvider from './onboarding/AdminOnboardingProvider';
import TableOrdersPendingProvider from './table-orders/TableOrdersPendingProvider';
import ServiceRequestsPendingProvider from './shop-services/ServiceRequestsPendingProvider';
import TablePagersPendingProvider from './table-pagers/TablePagersPendingProvider';
import AdminTablePagerPopup from './table-pagers/AdminTablePagerPopup';
import './theme/admin-theme.css';
import './theme/admin-pos-fullscreen.css';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { ADMIN_SIDEBAR_WIDTH } from './AdminHamburgerSidebar';
import { ADMIN_MENU_CART_WIDTH_VAR } from './adminMenuCartLayout';
import {
  AUDITOR_SELECT_SHOP_PATH,
  auditorNeedsShopSelection,
  canAccessAdminPath,
  getFirstAllowedAdminPath,
  isPublicAdminPath,
} from '@/app/lib/shopPermissions';
import { persistShopFeaturesFromPayload } from '@/app/lib/shopFeatures';
import { persistSalePriceRoundingFromSettings } from '@/app/lib/salePriceRounding';
import tokenCode from '@/app/coponent/tokenCode';
import { FetchWithJwtClient } from '@/app/coponent/fetchWithJwtClient';
import WebinoChatbot from '@/app/coponent/WebinoChatbot';

// Map pathname to page title
const getPageTitle = (pathname: string | null): string | undefined => {
  if (!pathname) return undefined;
  
  const titleMap: { [key: string]: string } = {
    '/admin/expenses': 'هزینه‌ها',
    '/admin/beneficiaries': 'ذینفعان خرید',
    '/admin/manual-trades': 'ثبت سند',
    '/admin/cheques': 'چک',
    '/admin/inventory': 'موجودی انبار',
    '/admin/reports': 'گزارشات',
    '/admin/customers': 'خریداران',
    '/admin/customer-club': 'باشگاه مشتریان',
    '/admin/smart-club': 'داشبورد هوشمند',
    '/admin/smart-club/customers': 'لیست مشتریان',
    '/admin/smart-club/actions': 'پیشنهاد اقدام',
    '/admin/smart-club/campaigns': 'کمپین‌ها',
    '/admin/smart-club/thresholds': 'تنظیم گروه‌ها',
    '/admin/returned-products': 'برگشت خرید',
    '/admin/expenses-statistics': 'گزارش هزینه‌ها',
    '/admin/bulk-discount': 'تخفیف دسته جمعی',
    '/admin/settings': 'تنظیمات',
    '/admin/purchas': 'فروش ها',
    '/admin/product': 'لیست محصولات',
    '/admin/product/create': 'ثبت کالای جدید',
    '/admin/product/import': 'ایمپورت اکسل',
    '/admin/pending-purchases': 'عملیات معلق',
    '/admin/broadcast-sms': 'ارسال پیامک',
    '/admin/orders': 'سفارشات اینترنتی',
    '/admin/table-orders': 'سفارش حضوری',
    '/admin/table-pagers': 'پیجر میز',
    '/admin/shop-tables': 'میز و اتاق',
    '/admin/shop-services': 'خدمات اتاق',
    '/admin/best-selling': 'محصولات پرفروش',
    '/admin/invoices': 'فاکتورها',
    '/admin/manufacturers': 'تولیدکنندگان',
    '/admin/manufacturers/report': 'گزارش فروش تولیدکنندگان',
    '/admin/shop-sms-logs': 'پیامک‌های فروشگاه',
    '/admin/shop-sms-quota': 'مدیریت فروشگاه‌ها',
    '/admin/shop-service-access': 'دسترسی فروشگاه',
    '/admin/referral': 'پنل معرفی',
    '/admin/sms-packages': 'خرید بسته پیامک',
    '/admin/shop-plans': 'تمدید اشتراک',
    '/admin/shop-plans/manage': 'پلن‌های اکانت',
    '/admin/menu-packages': 'پکیج منوی دیجیتال',
    '/admin/product-plans/orders': 'خریداران یادینو',
    '/admin/product-plans': 'پلن‌های یادینو',
    '/admin/sms-package-orders': 'درخواست‌های بسته پیامک',
    '/admin/two-factor-codes': 'کدهای دوعاملی',
    '/admin/agency-requests': 'نمایندگی‌ها',
    '/admin/marketers': 'بازاریاب‌ها',
    '/admin/desktop-licenses': 'لایسنس دسکتاپ',
    '/admin/desktop-licenses/logs': 'لاگ اتصال دسکتاپ',
    '/admin/site-stats': 'آمار سایت',
    '/admin/installments': 'اقساط',
    '/admin/installment-credits': 'اعتبار اقساطی',
    '/admin/profit-loss': 'سود و ضرر',
    '/admin/smart-review': 'بررسی هوشمند',
    '/admin/accounting': 'حسابداری',
    '/admin/accounting/accounts': 'درخت حساب',
    '/admin/accounting/vouchers': 'اسناد حسابداری',
    '/admin/accounting/vouchers/new': 'سند دستی',
    '/admin/accounting/trial-balance': 'تراز آزمایشی',
    '/admin/accounting/ledger': 'دفتر حساب',
    '/admin/accounting/profit-loss': 'سود و زیان دفتر',
    '/admin/accounting/balance-sheet': 'ترازنامه',
    '/admin/accounting/period-close': 'بستن سال / دوره',
    '/admin/accounting/audit-log': 'لاگ حسابرس',
    '/admin/accounting/moadian': 'سامانه مؤدیان',
    '/admin/daily-reconciliation': 'تطبیق روزانه',
    '/admin/shop-accounts': 'حساب‌های فروشگاه',
    '/admin/partners': 'شرکا',
    '/admin/petty-cash': 'تنخواه',
    '/admin/purchase-debts': 'بدهکاران (نسیه)',
    '/admin/payroll': 'حقوق',
    '/admin/payroll/employees': 'کارمندها',
    '/admin/auditors': 'حسابرس‌ها',
    '/admin/payroll/settings': 'تنظیمات حقوق',
    '/admin/production': 'قیمت تمام‌شده تولید',
  };
  
  if (pathname.startsWith("/admin/beneficiaries")) return "ذینفعان خرید";
  if (pathname.startsWith("/admin/purchas/customer/")) return "سابقه مشتری";
  if (pathname.startsWith("/admin/accounting/vouchers/new")) return "سند دستی / اصلاحی";
  if (pathname.startsWith("/admin/accounting/vouchers/")) return "جزئیات سند";
  return titleMap[pathname];
};

// Check if page should show back button
const getAdminBackUrl = (pathname: string | null): string => {
  if (pathname && /^\/admin\/beneficiaries\/\d+$/.test(pathname)) {
    return "/admin/beneficiaries";
  }
  if (pathname && /^\/admin\/purchas\/customer\/[^/]+$/.test(pathname)) {
    return "/admin/purchas";
  }
  if (pathname?.startsWith("/admin/smart-club/")) {
    return "/admin/smart-club";
  }
  if (pathname?.startsWith("/admin/accounting/vouchers/")) {
    return "/admin/accounting/vouchers";
  }
  if (pathname?.startsWith("/admin/accounting/")) {
    return "/admin/accounting";
  }
  return getFirstAllowedAdminPath();
};

/** جزئیات سند از دفتر، لیست اسناد یا سند دیگر باز می‌شود؛ بک باید به همان صفحهٔ قبلی برگردد */
const prefersHistoryBack = (pathname: string | null): boolean =>
  Boolean(pathname?.startsWith("/admin/accounting/vouchers/"));

const shouldShowBack = (pathname: string | null): boolean => {
  if (!pathname) return false;
  // Show back button for all pages except main shikshoo admin page
  return (
    pathname !== '/admin' &&
    !pathname.includes('/login') &&
    !pathname.includes('/register-shop') &&
    !pathname.includes('/print')
  );
};

export default function ShikshooLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isPrintPage = pathname?.includes('/print');
  /** صفحاتی که بدون توکن ادمین قابل دسترسی‌اند */
  const isPublicAdminPage =
    pathname?.includes('/admin/login') ||
    pathname?.includes('/admin/register-shop') ||
    pathname?.includes(AUDITOR_SELECT_SHOP_PATH);
  const [isChecking, setIsChecking] = useState(true);
  const shopFeaturesSyncedRef = useRef(false);
  const firstPathnameRef = useRef(pathname);
  const [hasInAppHistory, setHasInAppHistory] = useState(false);

  useEffect(() => {
    if (pathname !== firstPathnameRef.current) setHasInAppHistory(true);
  }, [pathname]);

  useEffect(() => {
    const stored = localStorage.getItem("admin_theme_mode");
    document.documentElement.setAttribute(
      "data-admin-theme",
      stored === "light" ? "light" : "dark"
    );
  }, []);

  useEffect(() => {
    // بررسی توکن - اگر توکن نداشت و در صفحهٔ مهمان ادمین نیست، به لاگین بفرست
    const token = localStorage.getItem('token');
    
    if (!token && !isPublicAdminPage) {
      router.push('/admin/login');
      return;
    }
    if (token && !isPublicAdminPage && auditorNeedsShopSelection()) {
      router.replace(AUDITOR_SELECT_SHOP_PATH);
      return;
    }
    if (token && !isPublicAdminPath(pathname) && !canAccessAdminPath(pathname)) {
      router.replace(getFirstAllowedAdminPath());
      return;
    }
    setIsChecking(false);

    if (token && !isPublicAdminPage && !shopFeaturesSyncedRef.current) {
      shopFeaturesSyncedRef.current = true;
      const auth = tokenCode() || token;
      void Promise.all([
        FetchWithJwtClient("GET", "/api/user", auth),
        FetchWithJwtClient("GET", "/api/settings", auth),
      ]).then(([userRes, settingsRes]) => {
        if (userRes && !userRes.hasError) {
          persistShopFeaturesFromPayload(userRes as Record<string, unknown>);
          if (userRes.shop_is_auditor && userRes.requires_shop_selection) {
            router.replace(AUDITOR_SELECT_SHOP_PATH);
          }
        }
        if (settingsRes && !settingsRes.hasError) {
          persistShopFeaturesFromPayload(settingsRes as Record<string, unknown>);
          persistSalePriceRoundingFromSettings(settingsRes);
        }
      });
    }

    // مانیفست PWA: ورود و scope فقط /admin
    if (typeof window !== 'undefined') {
      let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = '/manifest-admin.json';
    }
  }, [pathname, router, isPublicAdminPage]);

  const pageTitle = getPageTitle(pathname);
  const showBack = shouldShowBack(pathname);
  const showShell = !isChecking || isPublicAdminPage || Boolean(isPrintPage);

  return (
    <AdminThemeProvider>
      <AdminOnboardingProvider>
        <TableOrdersPendingProvider>
        <ServiceRequestsPendingProvider>
        <TablePagersPendingProvider>
        <Box
          className="admin-app"
          sx={{
            minHeight: "100vh",
            color: "var(--admin-text)",
            fontFamily: "var(--app-font-family)",
          }}
        >
        {showShell && (
          <>
            {!isPublicAdminPage && <ShopAccessWatcher />}
            {!isPrintPage && !isPublicAdminPage && (
              <Box className="admin-shell-header">
                <Header
                  title={pageTitle}
                  showBack={showBack}
                  backUrl={getAdminBackUrl(pathname)}
                  onBack={hasInAppHistory && prefersHistoryBack(pathname) ? () => router.back() : undefined}
                />
              </Box>
            )}
            <Box
              className="admin-shell-main"
              sx={{
                pl: !isPrintPage && !isPublicAdminPage
                  ? `var(${ADMIN_MENU_CART_WIDTH_VAR}, 0px)`
                  : 0,
                pr: !isPrintPage && !isPublicAdminPage ? { md: `${ADMIN_SIDEBAR_WIDTH}px` } : 0,
                pb: !isPrintPage && !isPublicAdminPage ? { xs: "80px", md: "24px" } : 0,
              }}
            >
              {children}
            </Box>
            {!isPrintPage && !isPublicAdminPage && (
              <Box className="admin-shell-bottom-nav">
                <SimpleBottomNavigationAtelier />
              </Box>
            )}
            {!isPrintPage && !isPublicAdminPage && (
              <Box className="admin-webino-chatbot">
                <WebinoChatbot audience="admin" hideLauncher />
              </Box>
            )}
            {!isPrintPage && !isPublicAdminPage && <AdminTablePagerPopup />}
          </>
        )}
        </Box>
        </TablePagersPendingProvider>
        </ServiceRequestsPendingProvider>
        </TableOrdersPendingProvider>
      </AdminOnboardingProvider>
    </AdminThemeProvider>
  );
}

