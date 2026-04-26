

"use client";
import tokenCode from "@/app/coponent/tokenCode";
import { apiRequestError } from "@/app/lib/apiRequestError";
import React, { useState, Suspense, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";

import "react-multi-date-picker/styles/layouts/mobile.css"
import { Box, Button, Typography } from "@mui/material";
import PhoneNumberInput from "@/app/coponent/PhoneNumberInput/PhoneNumberInput";
import TextInput from "@/app/coponent/TextInput/TextInput";
import { useRouter } from "next/navigation";
import 'react-toastify/dist/ReactToastify.css';


export default function Page() {
  const router = useRouter();
  const [phon, setPhon] = useState("");
  const [loading, setloading] = useState(false);
  const [full_name, setfull_name] = useState("");


  const onChangePhone = (e) => {
    setPhon(!e.startsWith("0") ? "0" + e : e)
  }

  const confirm = () => {

    if (!loading){
      setloading(true)
    if (phon && full_name) {

      
     let data =  {name: full_name, phone: phon}
    let token = tokenCode()
    apiRequestError("Post", {}, data, "/api/admin/talar", true, true, token).then((res) => {
      setloading(false)
      if (res.hasError) {
        
        const parsedResponse = JSON.parse(res.errorText);
        const readableMessage = parsedResponse.message;
        toast.error(readableMessage)
        return
      }

      toast.success("تالار با موفقیت ثبت شد")
    setTimeout(() => {
      router.push("/main/talar")
    }, 1200);  
     
    })
      

    } else {
      toast.error("تمامی موارد را تکمیل کنید")
    }
  }

  }



  return (
    // <Suspense  fallback={<div>در حال بارگذاری...</div>}>
    <Box sx={{ width: "100%", direction: "rtl" }} className="flex items-center justify-center">

      


      {
        
        <Box sx={{ textAlign: "center", }}>
        
          <Box mt={1} sx={{ width: "100%", color: "#fff", marginTop: "20px", marginRight: "20px" }}>
            <Typography textAlign="right">تلفن مالک تالار :</Typography>
            <PhoneNumberInput defaultValue={phon} onChange={onChangePhone}
              name="phoneNumber" />
            <TextInput value={full_name} label="نام تالار" onChange={(e) => setfull_name(e)} name="fulname" />




          </Box>
          <Box sx={{ marginTop: "20px", height: "20vh" }}>

            <Button onClick={() => confirm()} sx={{ marginLeft: "5px", marginTop: "15px", borderRadius: "25px", bgcolor: "#78b568", color: "#fff", width: "60%", height: "60px", fontWeight: "600" }}
              variant="filled" >
              ثبت
            </Button>
            <Button onClick={() => router.push("/main/talar")} sx={{ marginTop: "15px", borderRadius: "25px", bgcolor: "#ff9100", color: "#fff", width: "30%", height: "60px", fontWeight: "600" }}
              variant="filled" >
              انصراف
            </Button>
          </Box>
        </Box>

      }



     
      <ToastContainer autoClose={3000} style={{ marginBottom: '56px', borderRadius: "15px" }} position={"bottom-right"} />
    </Box>
  );
}

