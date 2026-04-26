"use client"

import {
  Avatar,
  Box,
  Button,
  Card,
  Grid,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import DatePicker, { Calendar } from "react-multi-date-picker"
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import { useMyContext } from "../../../layout";
import AddIcon from '@mui/icons-material/Add';
import DateObject from "react-date-object";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import tokenCode from "@/app/coponent/tokenCode";
import { apiRequestError } from "@/app/lib/apiRequestError";



export default function CardUser(props) {
  const router = useRouter();
  const { myProp } = useMyContext();

  const [openSnackbar, setOpenSnackbar] = useState("");
  const [load, setLoad] = useState(true);
  const [status, setStatus] = useState();
  const [accesptModal, setAccesptModal] = useState(false);
  const [user, setUser] = useState("");
  const [value, setValue] = useState(new DateObject())
  const [range, setRange] = useState<any>([]);
  const today = new DateObject({ calendar: persian });


  useEffect(() => {
    let user = JSON.parse(localStorage.getItem('user'))
    setUser(user)

  }, [])




  const handleConfirm = () => {
    if (range.length === 2) {
      const date_from = {
        year: range[0].year,
        month: range[0].month.number,
        day: range[0].day,
      };
      const date_to = {
        year: range[1].year,
        month: range[1].month.number,
        day: range[1].day,
      };

      const dataObj = {
        date_from,
        date_to,
      };

      let token = tokenCode()
      apiRequestError("Post", {}, dataObj, "/api/cameraman/leave", true, true, token).then((res) => {
        console.log("ccccccccccccc" , res);
        
        if (res.hasError) {
          let readableMessage = "خطای ناشناخته از سمت سرور";
          try {
            const parsedResponse = JSON.parse(res.errorText);
            readableMessage = parsedResponse.message || readableMessage;
          } catch {
            readableMessage = res.errorText || readableMessage;
          }
        
          console.log("ddddddddd" , res);
          
          return;
        }
  
        toast.success("مرخصی با موفقیت ثبت شد")
      setTimeout(() => {
        router.push("/main/karmandan/home")
      }, 1200);  
       
      })


      console.log("✅ داده نهایی:", dataObj);
    } else {
      toast.error("لطفاً بازه کامل (از و تا) را انتخاب کنید")
      console.log("لطفاً بازه کامل (از و تا) را انتخاب کنید");
    }
  };



  return load ? ( <>
  <Box  >
          <Typography sx={{ margin: "10px", textAlign: "center" }} fontSize="large">لطفا زمان مرخصی خود را از تاریخ شروع تا تاریخ پایان مشخص کنید </Typography>
          </Box>
    <Box sx={{ width: "100%", direction: "rtl" }} className="flex items-center justify-center">
      {/* <Header /> */}

      
     
      <Box  >
          <DatePicker
        range
        value={range}
        onChange={setRange}
        calendar={persian}
        locale={persian_fa}
        calendarPosition="bottom-center"
        style={{
          height: "45px",
          borderRadius: "10px",
          textAlign: "center",
          width: "250px",
        }}
        minDate={today} 
        open
      />
        </Box>


     

    </Box>
    <Box display="flex" justifyContent="center" mt={2}>
                        <Button onClick={handleConfirm} sx={{ marginTop: "250px", borderRadius: "25px", bgcolor: range ? "#1976d2" : "#8e9191", color: "#fff", width: "80%", height: "60px", fontWeight: "600" }}
                            variant={range ? "contained" : "filled"} >
                            ثبت
                        </Button>
                    </Box>

                    <ToastContainer autoClose={3000} style={{ marginBottom: '56px', borderRadius: "15px" }} position={"bottom-right"} />


   </>
  ) : (<></>)
}

