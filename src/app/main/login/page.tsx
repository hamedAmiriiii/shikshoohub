"use client";
import React, { useState, useEffect } from 'react';

import { useTelegram } from '@/app/lib/telegram/TelegramProvider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Image1 from './../../../../public/pic/oooo.gif';
import { Box, Button, Tab, Tabs, Typography } from '@mui/material';
import { apiRequestError } from '@/app/lib/apiRequestError';
import { translate } from '@/app/coponent/Translate/translate';
import png from '../../../../public/pic/iconCam.png';
import Test from '@/app/coponent/Test';
import VahedSenfi from '@/app/coponent/VahedSenfi';
import LoginPagee from '@/app/coponent/LoginPagee';
import Akasan from './Akasan';

// import tokenCode from '@/app/coponent/tokenCode';
export default function LoginPage() {
  const { user, webApp } = useTelegram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [value, setValue] = React.useState(0);

  const router = useRouter();
  useEffect(() => {

    if (webApp?.initData) {
      // confirmLogin();
    }
  }, [webApp]);
  // useEffect(() => {

  //     confirmLogin(); 

  // }, []);
  // const initData = "user=%7B%22id%22%3A122550247%2C%22first_name%22%3A%22Hamed%22%2C%22last_name%22%3A%22Amiri%22%2C%22username%22%3A%22Hamed_Amiri%22%2C%22language_code%22%3A%22fa%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-1827964579103493038&chat_type=private&start_param=zr2ygOPJqFqcV2uD9y8oZ&auth_date=1726659795&hash=be48426bf9e0dda3b14ace3cde00953a613143b9193ca5072a0927ff18dd9c42";
  const confirmLogin = async () => {

    try {
      // const rawResponse = await fetch('http://localhost:3005/auth/login', {
        const rawResponse = await fetch('https://chancex-io.liara.run/auth/login', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 'initData': webApp?.initData })
      });

      const content = await rawResponse.json();

      if (content?.token) {
        // apiRequestError("Get", {}, {}, "/user/get-info", true, false,tokenCode()).then((res) => {
        apiRequestError("Get", {}, {}, "/user/get-info", true, false, content?.token).then((res) => {
          document.cookie = `token=${content.token} path=/`
          localStorage.setItem('token', content.token);
          localStorage.setItem('user', JSON.stringify(res));
          setLoading(false);
          
          let admin = res?.roles.some((e) => e.name === "ادمین");

          if (admin) {
            router.push('/main/home');
          } else {
            router.push('/main/karmandan/home');
          }

          console.log("dddddddddddddddddd" , admin);
          
        })


      } else {
        setError('Failed to login. Please try again.');
      }
    } catch (err) {
      setError('Error connecting to server. Please try again.');
    }
  };



  const tab = () => {
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
      
      // setValue(22);
      if (newValue == 0) {
      setValue(0);
        
      // api(0)
      } else {
      setValue(1);

        // api(1)
      }
     
    };
    return (
      <Tabs
      sx={{  fontSize:"18px",
        '& .MuiTabs-indicator': { backgroundColor: '#ff9100' ,fontSize:"18px"}, // رنگ ایندیکاتور  
          '& .MuiTab-root': {  
            color: 'white',
          fontSize:"17px",fontWeight:"700",
          '&.Mui-selected': { color: '#ff9100',fontSize:"17px",fontWeight:"700" }, // رنگ تب انتخاب شده  
          '&:hover': { color: '#ff9100' } // رنگ تب هنگام هاور  
        }  
      }} 
        value={value}
        className="w-full"
        onChange={handleChange}
        aria-label="disabled tabs example"
      >
        <Tab
          label={'ثبت واحد صنفی'}
          style={{ marginRight: "30px", marginLeft: "auto" }}
        />
        <Tab
          label={'ثبت فیلم بردار و عکاس'}
          style={{ marginLeft: "30px", marginRight: "auto" }}
        />
      </Tabs>
    );
  };




  if (loading) {
    return (
      <Box sx={{marginX:"10px"}} >

      <div style={{  justifyContent:"center"}} className='flex justify-center' >
        
        <Image
               style={{marginTop:'10px'}}
              src={png}
              alt="Vercel logomark"
              width={100}
              height={100}
        />
        
        </div>
        {tab()}
        
      {
          value == 0 ? <>
            <VahedSenfi />
            <Box display="flex" justifyContent="center" >
              <Button onClick={() => setLoading(false)} sx={{
                marginTop: "15px", borderRadius: "15px", bgcolor: "#313131",
                color: "#ff9100", width: "80%", height: "60px", fontWeight: "600", border: "1px solid #ff9100"
              }}
                    variant="filled" >
                    انصراف 
                </Button>
            </Box>
        </> 
            : value == 1 ? <>
              <Akasan /> 
              <Box display="flex" justifyContent="center" >
              <Button onClick={() => setLoading(false)} sx={{
                marginTop: "15px", borderRadius: "15px", bgcolor: "#313131",
                color: "#ff9100", width: "80%", height: "60px", fontWeight: "600", border: "1px solid #ff9100"
              }}
                    variant="filled" >
                    انصراف 
                </Button>
            </Box>
          </> 
            : <></>
      }
      
    </Box>

      
    );
  }

  if (!loading) {
    return (
      <div>
        <LoginPagee />
        <Box display="flex" justifyContent="center" >
                <Button onClick={() => setLoading(true)} sx={{ marginTop: "15px", borderRadius: "25px", bgcolor: "#ff9100", color: "#fff", width: "80%", height: "60px", fontWeight: "600" }}
                    variant="filled" >
                    ثبت نام جدید
                </Button>
            </Box>
      </div>
    );
  }


}
