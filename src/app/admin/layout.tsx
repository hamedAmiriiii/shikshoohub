"use client";
import SimpleBottomNavigationAtelier from './SimpleBottomNavigationAtelier';
import Header from '../componentsShop/Header';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    '/admin/pending-purchases': 'خریدهای در انتظار',
    '/admin/broadcast-sms': 'ارسال پیامک',
    '/admin/orders': 'سفارشات',
    '/admin/best-selling': 'محصولات پرفروش',
    '/admin/invoices': 'فاکتورها',
    '/admin/manufacturers': 'تولیدکنندگان',
    '/admin/manufacturers/report': 'گزارش فروش تولیدکنندگان',
    '/admin/shop-sms-logs': 'پیامک‌های فروشگاه',
    '/admin/installments': 'اقساط',
    '/admin/installment-credits': 'اعتبار اقساطی',
    '/admin/profit-loss': 'سود و ضرر',
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
    // بررسی توکن - اگر توکن نداشت و در صفحهٔ مهمان ادمین نیست، به لاگین بفرست
    const token = localStorage.getItem('token');
    
    if (!token && !isPublicAdminPage) {
      router.push('/admin/login');
    } else {
      setIsChecking(false);
    }

    // تنظیم manifest برای صفحه admin - redirect به root
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

  // اگر در حال بررسی هستیم، چیزی نمایش نده
  if (isChecking && !isPublicAdminPage) {
    return null;
  }

  const pageTitle = getPageTitle(pathname);
  const showBack = shouldShowBack(pathname);

  return (
    <>
      {!isPrintPage && !isPublicAdminPage && (
        <Header 
          title={pageTitle} 
          showBack={showBack}
          backUrl="/admin"
        />
      )}
      {children}
      {!isPrintPage && !isPublicAdminPage && <SimpleBottomNavigationAtelier />}
    </>
  );
}

