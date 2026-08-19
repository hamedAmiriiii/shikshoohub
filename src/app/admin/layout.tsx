"use client";
import SimpleBottomNavigationAtelier from './SimpleBottomNavigationAtelier';
import Header from '../componentsShop/Header';
import ShopAccessWatcher from '../componentsShop/ShopAccessWatcher';
import AdminThemeProvider from './theme/AdminThemeProvider';
import AdminOnboardingProvider from './onboarding/AdminOnboardingProvider';
import './theme/admin-theme.css';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { ADMIN_SIDEBAR_WIDTH } from './AdminHamburgerSidebar';
import { ADMIN_MENU_CART_WIDTH_VAR } from './adminMenuCartLayout';

// Map pathname to page title
const getPageTitle = (pathname: string | null): string | undefined => {
  if (!pathname) return undefined;
  
  const titleMap: { [key: string]: string } = {
    '/admin/expenses': 'هزینه‌ها',
    '/admin/inventory': 'موجودی انبار',
    '/admin/reports': 'گزارشات',
    '/admin/customers': 'خریداران',
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
    '/admin/shop-tables': 'میزهای فروشگاه',
    '/admin/best-selling': 'محصولات پرفروش',
    '/admin/invoices': 'فاکتورها',
    '/admin/manufacturers': 'تولیدکنندگان',
    '/admin/manufacturers/report': 'گزارش فروش تولیدکنندگان',
    '/admin/shop-sms-logs': 'پیامک‌های فروشگاه',
    '/admin/shop-sms-quota': 'مدیریت فروشگاه‌ها',
    '/admin/referral': 'پنل معرفی',
    '/admin/sms-packages': 'خرید بسته پیامک',
    '/admin/sms-package-orders': 'درخواست‌های بسته پیامک',
    '/admin/installments': 'اقساط',
    '/admin/installment-credits': 'اعتبار اقساطی',
    '/admin/profit-loss': 'سود و ضرر',
    '/admin/daily-reconciliation': 'تطبیق روزانه',
    '/admin/purchase-debts': 'بدهکاران (نسیه)',
    '/admin/payroll': 'حقوق',
    '/admin/payroll/employees': 'کارمندها',
    '/admin/payroll/settings': 'تنظیمات حقوق',
  };
  
  return titleMap[pathname];
};

// Check if page should show back button
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
    pathname?.includes('/admin/register-shop');
  const [isChecking, setIsChecking] = useState(true);

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
    } else {
      setIsChecking(false);
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
  const showShell = !isChecking || isPublicAdminPage;

  return (
    <AdminThemeProvider>
      <AdminOnboardingProvider>
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
              <Header
                title={pageTitle}
                showBack={showBack}
                backUrl="/admin"
              />
            )}
            <Box
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
            {!isPrintPage && !isPublicAdminPage && <SimpleBottomNavigationAtelier />}
          </>
        )}
        </Box>
      </AdminOnboardingProvider>
    </AdminThemeProvider>
  );
}

