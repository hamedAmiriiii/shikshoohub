"use client"
// import React from 'react'
import { AppBar, Toolbar, Typography, Box, Avatar, IconButton, Grid } from '@mui/material';
import RedeemIcon from '@mui/icons-material/Redeem';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { styled } from '@mui/system';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import Person2Icon from '@mui/icons-material/Person2';
import SelectLang from './SelectLang';
import BottomSheet from './BottomSheet';
import Image from "next/image";
import { useEffect, useState } from 'react';
import { translate } from './Translate/translate';
import Counter from './Counter';
import AnimatedNumber from './Counter';
import tokenCode from './tokenCode';
import { apiRequestError } from '../lib/apiRequestError';
import { useRouter } from 'next/navigation';
import CustomizedProgressBars from './Progres';
import Image2 from './../../../public/pic/77750.png';
import Image3 from './../../../public/pic/20090.png';
const CryptoBalance = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  backgroundColor: '#303030',
  padding: '10px 20px',
  borderRadius: '15px',
}));

const PowerBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  backgroundColor: '#2d2d2d',
  padding: '10px 20px',
  borderRadius: '10px',
  marginTop: '10px',
}));

export default function Header(props) {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [level, setLevel] = useState(0);
  const [value, setValue] = useState(0);
  const [balance, setBalance] = useState("");
  const [toggleModalNeedToConfirm, setToggleModalNeedToConfirm] = useState(false);

useEffect(() => {
  props.chengeBalance>0 && setBalance(balance - props.chengeBalance) 
}, [props])


  useEffect(() => {
    let user =JSON.parse(localStorage.getItem('user'))
    setUser(user)
  
  }, [])
  
  
  return (
    <AppBar position="static" sx={{ backgroundColor: '#6d6d6d', padding: '10px', }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
     

        
<Box 
  sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
  
          <Avatar sx={{ backgroundColor: '#6d6d6d', width: 48, height: 48, border: '2px solid #ff9100' }}>
          <Person2Icon style={{ fontSize: 45,   }} />
            
  </Avatar>
  
  <Box 
    sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      position: 'absolute', 
      bottom: '-5px'
    }}
  >
   
    <Box 
      sx={{ 
        background: '#ff9100', 
        width: 48, 
        height: 17, 
        borderRadius: " 25px 0 0 25px", 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center'
      }}
    >
      <Typography fontSize={'11px'} pt={'2px'}>{level} {translate("Lvl")}</Typography>
    </Box>

   
    <Box 
      sx={{ borderRight:"0",
                width: 270, 
      }}
    >
      <CustomizedProgressBars value={value} sx={{ height: '100%', borderRadius: '0 20px 20px 0',color:"#fff" }} />
    </Box>
  </Box>
  
  <Box ml={2} mb={2}>
    {/* <Typography color='#fff' fontWeight={600} variant="h6">{user?.username}</Typography> */}
  </Box>
</Box>


      
       
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
        
          <IconButton sx={{marginRight:-2}} onClick={()=>props.setToggleModalInfo(true)} >
                  <QuestionMarkIcon style={{ fontSize: 25, color:"#ff9100"  }} />
            {/* <RedeemIcon sx={{ color: 'orange' }} /> */}
          </IconButton>
                  <IconButton sx={{marginRight:-2}} onClick={()=>setToggleModalNeedToConfirm(true)} >
                  <SettingsIcon style={{ fontSize: 25, color:"#ff9100"  }} />
            {/* <RedeemIcon sx={{ color: 'orange' }} /> */}
          </IconButton>
                  
        </Box>
      </Toolbar>

      
      <PowerBox>
        <Box>
         {user && <Typography variant="body2" color="">
          {user.name } { user.last_name}
          {/* {translate("Balance")} */}
          </Typography>}
          <Typography variant="h6" color="#ff9100" style={{fontWeight:"bold" , display:"flex"}}>
         {/* {balance}  */}
            {/* <AnimatedNumber number={balance} /> */}
         {/* <Image style={{width:"25px" , height:"25px" , marginLeft:"7px" , marginTop:"4px"}} src={Image2} alt="Image" /> */}
          </Typography>
        </Box>
        <Box>
          {user && <Typography variant="body2" color="">
            {user.roles[0]?.name} - {user.roles[1]?.name} - {user.roles[2]?.name}
          </Typography>}
          <Typography style={{display:"flex"}} variant="h6" color="#ff9100">
          
         <Image style={{width:"25px" , height:"25px" , marginRight:"7px" , marginTop:"4px"}} src={Image3} alt="Image" />
         {user?.profit} 
          </Typography>
        </Box>
          </PowerBox>
          <BottomSheet
       open={toggleModalNeedToConfirm}
        title={
          <Grid item sx={{ display: "flex", alignItems: "center" }}>
            <Typography color="#ffffff" fontSize={"1rem"} ml={3} mt={1}>
            {translate("Select language")}
            </Typography>
          </Grid>
        }
        onClose={() => setToggleModalNeedToConfirm(false)}
      >
        <Grid>
          <Box className="flex justify-center items-center w-full  mb-4">
            <SelectLang close={() => setToggleModalNeedToConfirm(false)}  />
          </Box>
          <Box className="flex justify-center items-center w-full  mb-4">
           
          </Box>
        </Grid>
      </BottomSheet>


    </AppBar>
  );
}



