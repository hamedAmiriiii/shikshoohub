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

export default function SimpleBottomNavigationAtelier() {
  const router = useRouter();
  const pathname = usePathname();
  
  function getNavigationValue(path: string) {
    if (path.includes('/admin/product/create')) return 0; // ثبت کالا
    if (path.includes('/admin/purchas')) return 1; // خریدها
    if (path.includes('/admin/product')) return 2; // کالاها
    if (path === '/admin' || path.includes('/admin/') && !path.includes('/admin/product') && !path.includes('/admin/purchas')) return 3; // خانه
    return 3; // Default to 'home'
  }

  const [value, setValue] = React.useState(() => getNavigationValue(pathname));
  const [productsSheetOpen, setProductsSheetOpen] = React.useState(false);
  const [purchasesSheetOpen, setPurchasesSheetOpen] = React.useState(false);

  // Update value when pathname changes
  React.useEffect(() => {
    setValue(getNavigationValue(pathname));
  }, [pathname]);

  const handleNavChange = (event: any, newValue: number) => {
    setValue(newValue);
    
    // Open the appropriate bottom sheet based on the selected navigation item
    if (newValue === 0) {
      router.push("/admin/product/create")

     
    } else if (newValue === 1) {
      // setPurchasesSheetOpen(true);
      // setProductsSheetOpen(false);
      router.push("/admin/purchas")

      }else if (newValue === 2) {
        // setProductsSheetOpen(true);
        // setPurchasesSheetOpen(false);
        router.push("/admin/product")
    }else if (newValue === 3) {
      router.push("/admin")
    }
  };

  return (
    <Box sx={{ width: 500, height:"65" }}>
      <Paper sx={{width:"94%", position: 'fixed', bottom: 12, left: '3%', right: 0 ,borderRadius:'30px', height:"65"}} elevation={2}>
        <BottomNavigation
          sx={{borderRadius:'25px'}}
          showLabels
          value={value}
          onChange={handleNavChange}
        >
          <BottomNavigationAction label={"ثبت کالا"} icon={<AssignmentIcon />} />
          <BottomNavigationAction label={"فروش"} icon={<AssignmentIcon />} />
          <BottomNavigationAction label={"کالاها"} icon={<AssignmentIcon />} />
          <BottomNavigationAction label={"خانه"} icon={<HomeIcon />} />
        </BottomNavigation>
      </Paper>

      {/* Products Bottom Sheet */}
      <BottomSheet
        open={productsSheetOpen}
        title={
          <Grid item sx={{ display: "flex", alignItems: "center" }}>
            <Typography color="#ffffff" fontSize={"1rem"} ml={3} mt={1}>
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
            <Typography color="#ffffff" fontSize={"1rem"} ml={3} mt={1}>
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
