"use client"
import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { usePathname, useRouter } from '../../node_modules/next/navigation';
import { translate } from './coponent/Translate/translate';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import HouseboatIcon from '@mui/icons-material/Houseboat';
import DeckIcon from '@mui/icons-material/Deck';
export default function SimpleBottomNavigationAtelier() {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = React.useState(getNavigationValue(pathname));
  function getNavigationValue(path: string) {
    if (path.includes('/home')) return 1;
    if (path.includes('/atelie')) return 0;
    // if (path.includes('/cameraman')) return 2;
    // if (path.includes('/talar')) return 1;
    // if (path.includes('/rank')) return 3;
    // if (path.includes('/bagh')) return 0;
    return 0; // Default to 'home' if no matching path
  }
  return (
    <Box sx={{ width: 500, height:"65" }}>
      <Paper sx={{width:"94%", position: 'fixed', bottom: 12, left: '3%', right: 0 ,borderRadius:'30px', height:"65"}} elevation={2}>


        <BottomNavigation
          sx={{borderRadius:'25px'}}
          showLabels
          value={value}
          onChange={(event: any, newValue: number) => {
            let link = newValue == 1 ? "/main/karmandan/home" : newValue == 0 ? "/main/karmandan/atelie" : newValue == 2 ? "/main/cameraman" : newValue == 1 ? "/main/talar" : newValue == 0 ? "/main/bagh"
              : "/"
            router.push('/main/karmandan/home')

            setValue(newValue);
          }}
        >
          {/* <BottomNavigationAction label={translate("rank")} icon={<SwapVertIcon />} /> */}
          {/* <BottomNavigationAction label={translate("wallet")} icon={<DeckIcon />} />
          <BottomNavigationAction label={translate("game")} icon={<HouseboatIcon />} />
          <BottomNavigationAction label={translate("frens")} icon={<PhotoCameraIcon />} /> */}
          {/* <BottomNavigationAction label={"مراسمات"} icon={<AssignmentIcon />} /> */}
          <BottomNavigationAction label={translate("home")} icon={<HomeIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
