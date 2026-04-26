"use client";
import SimpleBottomNavigationAtelier from './SimpleBottomNavigationAtelier';
import Header from '../components/Header';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Map pathname to page title
const getPageTitle = (pathname: string | null): string | undefined => {
  if (!pathname) return undefined;
  
  const titleMap: { [key: string]: string } = {
    '/shikshoo/admin/expenses': 'هزینه‌ها',
    '/shikshoo/admin/inventory': 'موجودی انبار',
    '/shikshoo/admin/reports': 'گزارشات',
    '/shikshoo/admin/customers': 'خریداران',
    '/shikshoo/admin/returned-products': 'برگشت خرید',
    '/shikshoo/admin/expenses-statistics': 'گزارش هزینه‌ها',
    '/shikshoo/admin/bulk-discount': 'تخفیف دسته جمعی',
    '/shikshoo/admin/settings': 'تنظیمات',
    '/shikshoo/admin/purchas': 'فروش ها',
    '/shikshoo/admin/product': 'لیست محصولات',
    '/shikshoo/admin/product/create': 'ثبت کالای جدید',
    '/shikshoo/admin/pending-purchases': 'خریدهای در انتظار',
    '/shikshoo/admin/broadcast-sms': 'ارسال پیامک',
    '/shikshoo/admin/orders': 'سفارشات',
    '/shikshoo/admin/best-selling': 'محصولات پرفروش',
    '/shikshoo/admin/invoices': 'فاکتورها',
    '/shikshoo/admin/manufacturers': 'تولیدکنندگان',
    '/shikshoo/admin/manufacturers/report': 'گزارش فروش تولیدکنندگان',
    '/shikshoo/admin/shop-sms-logs': 'پیامک‌های فروشگاه',
    '/shikshoo/admin/installments': 'اقساط',
    '/shikshoo/admin/installment-credits': 'اعتبار اقساطی',
    '/shikshoo/admin/profit-loss': 'سود و ضرر',
  };
  
  return titleMap[pathname];
};

// Check if page should show back button
const shouldShowBack = (pathname: string | null): boolean => {
  if (!pathname) return false;
  // Show back button for all pages except main shikshoo admin page
  return pathname !== '/shikshoo/admin' && !pathname.includes('/login') && !pathname.includes('/print');
};

export default function ShikshooLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isPrintPage = pathname?.includes('/print');
  const isLoginPage = pathname?.includes('/login');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // بررسی توکن - اگر توکن نداشت و در صفحه لاگین نیست، به لاگین بفرست
    const token = localStorage.getItem('token');
    
    if (!token && !isLoginPage) {
      router.push('/shikshoo/admin/login');
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
  }, [pathname, router, isLoginPage]);

  // اگر در حال بررسی هستیم، چیزی نمایش نده
  if (isChecking && !isLoginPage) {
    return null;
  }

  const pageTitle = getPageTitle(pathname);
  const showBack = shouldShowBack(pathname);

  return (
    <>
      {!isPrintPage && !isLoginPage && (
        <Header 
          title={pageTitle} 
          showBack={showBack}
          backUrl="/shikshoo/admin"
        />
      )}
      {children}
      {!isPrintPage && !isLoginPage && <SimpleBottomNavigationAtelier />}
    </>
  );
}

