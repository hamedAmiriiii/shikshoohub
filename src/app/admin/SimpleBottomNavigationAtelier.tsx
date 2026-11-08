"use client"
import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Grid, Typography } from '@mui/material';
import BottomSheet from '@/app/coponent/BottomSheet';
import ListData from './List';
import ListPurches from './ListPurches';
import { useRouter, usePathname } from 'next/navigation';
import { useShopPermissionGate } from "@/app/lib/shopPermissions";

const BOTTOM_NAV_ITEMS = [
  { href: "/admin/product/create", label: "ثبت کالا", permission: "products" as const, tour: "nav-register-product" },
  { href: "/admin/purchas", label: "فروش", permission: "pos" as const, tour: "nav-sales" },
  { href: "/admin/product", label: "کالاها", permission: "products" as const, tour: "nav-products" },
  { href: "/admin", label: "خانه", permission: ["pos", "dashboard"] as const, tour: "nav-home" },
];

export default function SimpleBottomNavigationAtelier() {
  const router = useRouter();
  const pathname = usePathname();
  const { can } = useShopPermissionGate();
  const items = BOTTOM_NAV_ITEMS.filter((item) => can(item.permission));

  function getNavigationValue(path: string) {
    const exactHome = items.findIndex((item) => item.href === "/admin");
    const match = items.findIndex((item) =>
      item.href === "/admin"
        ? path === "/admin"
        : path === item.href || path.startsWith(`${item.href}/`),
    );
    if (match >= 0) return match;
    return exactHome >= 0 ? exactHome : 0;
  }

  const [value, setValue] = React.useState(() => getNavigationValue(pathname));
  const [productsSheetOpen, setProductsSheetOpen] = React.useState(false);
  const [purchasesSheetOpen, setPurchasesSheetOpen] = React.useState(false);

  React.useEffect(() => {
    setValue(getNavigationValue(pathname));
  }, [pathname, items.length]);

  const handleNavChange = (_event: unknown, newValue: number) => {
    setValue(newValue);
    const target = items[newValue];
    if (target) router.push(target.href);
  };

  if (items.length === 0) return null;

  return (
    <Box sx={{ display: { xs: "block", md: "none" }, width: 500, height: "65" }}>
      <Paper data-admin-tour="bottom-nav" sx={{width:"94%", position: 'fixed', bottom: 12, left: '3%', right: 0 ,borderRadius:'30px', height:"65", backgroundColor: 'var(--admin-bottom-nav-bg)', border: '1px solid var(--admin-border)'}} elevation={2}>
        <BottomNavigation
          sx={{borderRadius:'25px'}}
          showLabels
          value={value}
          onChange={handleNavChange}
        >
          {items.map((item) => (
          <BottomNavigationAction
            key={item.href}
            data-admin-tour={item.tour}
            label={item.label}
            icon={item.href === "/admin" ? <HomeIcon /> : <AssignmentIcon />}
          />
          ))}
        </BottomNavigation>
      </Paper>

      {/* Products Bottom Sheet */}
      <BottomSheet
        open={productsSheetOpen}
        title={
          <Grid item sx={{ display: "flex", alignItems: "center" }}>
            <Typography color="var(--admin-text)" fontSize={"1rem"} ml={3} mt={1}>
              کالاها
            </Typography>
          </Grid>
        }
        onClose={() => setProductsSheetOpen(false)}
      >
        <Grid>
          <Box className="flex justify-center items-center w-full mb-4">
            {/* Products content goes here */}
            <Typography>لیست کالاها</Typography>
          </Box>

          <ListData />
        </Grid>
      </BottomSheet>

      {/* Purchases Bottom Sheet */}
      <BottomSheet
        open={purchasesSheetOpen}
        title={
          <Grid item sx={{ display: "flex", alignItems: "center" }}>
            <Typography color="var(--admin-text)" fontSize={"1rem"} ml={3} mt={1}>
              خرید ها
            </Typography>
          </Grid>
        }
        onClose={() => setPurchasesSheetOpen(false)}
      >
        <Grid>
          <Box className="flex justify-center items-center w-full mb-4">
            {/* Purchases content goes here */}
            <Typography>لیست خرید ها</Typography>
          </Box>
          <ListPurches />
        </Grid>
      </BottomSheet>
    </Box>
  );
}
