"use client";
import { Box } from '@mui/material';
import { usePathname } from 'next/navigation';
import ShopHeader from './components/ShopHeader';
import { ShopProvider, useShopContext } from './context/ShopContext';

function ShopLayoutContent({ children }: { children: React.ReactNode }) {
  const { searchQuery, setSearchQuery } = useShopContext();
  const pathname = usePathname();
  
  // برای صفحات admin از layout خودشان استفاده می‌شود
  const isAdminPage = pathname?.includes('/admin');
  
  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', direction: 'rtl' }}>
      <ShopHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <Box component="main">
        {children}
      </Box>
    </Box>
  );
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShopProvider>
      <ShopLayoutContent>{children}</ShopLayoutContent>
    </ShopProvider>
  );
}

