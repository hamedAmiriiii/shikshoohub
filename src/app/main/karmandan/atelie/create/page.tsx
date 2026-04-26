

"use client";
import List from "@/app/coponent/grid/Grid";
import tokenCode from "@/app/coponent/tokenCode";
import { log } from "console";
import React, { useState, Suspense, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import DatePicker, { Calendar } from "react-multi-date-picker"
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import DateObject from "react-date-object";
import "react-multi-date-picker/styles/layouts/mobile.css"
import { Box, Button, Typography } from "@mui/material";
import Buttons from "react-multi-date-picker/components/button";
import PhoneNumberInput from "@/app/coponent/PhoneNumberInput/PhoneNumberInput";
import TextInput from "@/app/coponent/TextInput/TextInput";
import SelectInput1 from "@/app/coponent/Select/SelectInput1";
import { useRouter } from "next/navigation";
import 'react-toastify/dist/ReactToastify.css';
import { apiRequestError } from "@/app/lib/apiRequestError";


export default function Page() {
  const router = useRouter();

  const [talar, setTalar] = useState([]);
  const [garden, setGarden] = useState([]);
  const [cameraman, setCameraman] = useState([]);
  const [value1, setValue1] = useState(new DateObject())
  const [step, setStep] = useState(1)
  const [phon, setPhon] = useState("");
  const [full_name, setfull_name] = useState("");
  const [nationalCode, setnationalCode] = useState("");
  const [selectedValue, setSelectedValue] = useState('');
  const [cameramanMen, setCameramanMen] = useState([]);
  const [cameramanWomen, setcameramanWomen] = useState([]);
  const [photographerMen, setphotographerMen] = useState([]);
  const [photographerWomen, setphotographerWomen] = useState([]);
  const [hellyshotMen, sethellyshotMen] = useState([]);
  const [hellyshotWomen, sethellyshotWomen] = useState([]);
  const [selectedValuecameramanMen, setselectedValuecameramanMen] = useState('');
  const [selectedValuecameramanWomen, setselectedValuecameramanWomen] = useState('');
  const [selectedValuephotographerMen, setselectedValuephotographerMen] = useState('');
  const [selectedValuephotographerWomen, setselectedValuephotographerWomen] = useState('');
  const [selectedValuehellyshotMen, setselectedValuehellyshotMen] = useState('');
  const [selectedValuehellyshotWomen, setselectedValuehellyshotWomen] = useState('');
  const [selectedTalar, setSelectedTalar] = useState('');
  const [selectedBagh, setSelectedBagh] = useState('');
  const today = new DateObject({ calendar: persian });


  useEffect(() => {
    let token = tokenCode()
    let talarList = []
    let gardenList = []

    apiRequestError("Get", {}, {}, "/api/atelier/talar", true, true, token).then((res) => {
      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        const readableMessage = parsedResponse.message;
        toast.error(readableMessage)
        return
      }
      res.map((i) => {
        talarList.push({ 'value': i.id, 'label': i.name })
      })
      setTalar(talarList)
    })

    apiRequestError("Get", {}, {}, "/api/atelier/garden", true, true, token).then((res) => {
      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        const readableMessage = parsedResponse.message;
        toast.error(readableMessage)
        return
      }
      res.map((i) => {
        gardenList.push({ 'value': i.id, 'label': i.name })
      })
      setGarden(gardenList)

    })
  }, [])

  useEffect(() => {
    confirmStep1()
  }, [value1])
  

  let searchBoxList: any = [
    { fieldName: "user.username", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    { fieldName: "user.fullName", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    { fieldName: "user.fullName", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
  ];


  const confirmStep1 = () => {

    let token = tokenCode()

    const baseUrl = "/api/atelier/cameraman";
    const param = {
      gender: 1,
      type: 3,
      date: { year: value1.year, month: value1.month.number, day: value1.day },
    };
    const dateString = JSON.stringify(param.date);
    const finalUrl = `${baseUrl}?gender=${param.gender}&type=${param.type}&date=${encodeURIComponent(dateString)}`;

    apiRequestError("Get", {}, {}, finalUrl, true, true, token).then((res) => {
      console.log("xxxxxxxxxxxxxxxxxx" , res);
      console.log("finalUrl" , finalUrl);
      
      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        const readableMessage = parsedResponse.message;
        toast.error(readableMessage)
        setStep(1)
        return
      }
      let cameramanMen1 = []
      let cameramanWomen1 = []
      let photographerMen1 = []
      let photographerWomen1 = []
      let hellyshotMen1 = []
      let hellyshotWomen1 = []
      res.map((i) => {
        if (i.gender == "مرد" && i.name == "فیلم بردار") cameramanMen1.push({ 'value': i.id, 'label': i.full_name })
        if (i.gender == "زن" && i.name == 'فیلم بردار') cameramanWomen1.push({ 'value': i.id, 'label': i.full_name })
        if (i.gender == "مرد" && i.name == "عکاس") photographerMen1.push({ 'value': i.id, 'label': i.full_name })
        if (i.gender == "زن" && i.name == "عکاس") photographerWomen1.push({ 'value': i.id, 'label': i.full_name })
        if (i.gender == "مرد" && i.name == "فیلم بردار هوایی") hellyshotMen1.push({ 'value': i.id, 'label': i.full_name })
        if (i.gender == "زن" && i.name == "فیلم بردار هوایی") hellyshotWomen1.push({ 'value': i.id, 'label': i.full_name })
      },)

      setCameramanMen(cameramanMen1)
      setcameramanWomen(cameramanWomen1)
      setphotographerMen(photographerMen1)
      setphotographerWomen(photographerWomen1)
      sethellyshotMen(hellyshotMen1)
      sethellyshotWomen(hellyshotWomen1)
      setCameraman(res)
      setStep(2)

    })


  }

  const onChangePhone = (e) => {
    setPhon(!e.startsWith("0") ? "0" + e : e)
  }

  const confirm1 = () => {
    // بررسی شماره تلفن
    if (!phon) {
      toast.error("لطفاً شماره تلفن داماد را وارد کنید");
      return;
    }
    if (phon.length == 10 || phon.length == 11 ){} else {
      toast.error("لطفاً شماره تلفن را صحیح وارد کنید");
      return;
    }
  
    // بررسی نام کامل
    if (!full_name.trim()) {
      toast.error("لطفاً نام و نام خانوادگی داماد را وارد کنید");
      return;
    }
  
    // بررسی کد ملی
    if (!nationalCode) {
      toast.error("لطفاً کد ملی داماد را وارد کنید");
      return;
    }
    if (nationalCode.length !== 10) {
      toast.error("کد ملی باید ۱۰ رقم باشد");
      return;
    }
  
    // بررسی تالار یا باغ
    if (!selectedBagh && !selectedTalar) {
      toast.error("لطفاً باغ یا تالار را انتخاب کنید");
      return;
    }
  
    // در صورت کامل بودن همه موارد
    setStep(3);
  };
  

  const confirm = () => {

    if (selectedValuecameramanMen ||  selectedValuecameramanWomen ||
       selectedValuephotographerMen || selectedValuephotographerWomen
       
       ) {
      
      let dataObj = {
        "talar_id": selectedTalar,
        "garden_id": selectedBagh,
        "manCameraman": selectedValuecameramanMen ? [
            selectedValuecameramanMen
        ] : [],
        "womanCameraman": selectedValuecameramanWomen ? [
            selectedValuecameramanWomen
        ] : [],
        "manPhotographer": selectedValuephotographerMen ? [
            selectedValuephotographerMen
        ] : [],
        "womanPhotographer": selectedValuephotographerWomen ? [
            selectedValuephotographerWomen
        ] : [],
        "manAirCameraman": selectedValuehellyshotMen ? [
            selectedValuehellyshotMen
        ] : [],
        "womanAirCameraman": selectedValuehellyshotWomen ? [
            selectedValuehellyshotWomen
        ] : [],
        "groom_full_name": full_name,
        "groom_phone": phon,
        "groom_national_code": nationalCode,
        "date":  { year: value1.year, month: value1.month.number, day: value1.day },
      }
      

    let token = tokenCode()
    apiRequestError("Post", {}, dataObj, "/api/atelier/ceremony", true, true, token).then((res) => {
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

      toast.success("مراسم با موفقیت ثبت شد")
    setTimeout(() => {
      router.push("/main/karmandan/home")
    }, 1200);  
     
    })
      
      

    } else {
      toast.error("لطفا یک فیلم بردار یا عکاس برای مراسم انتخاب کنید")
    }
  }



  return (
    // <Suspense  fallback={<div>در حال بارگذاری...</div>}>
    <Box sx={{ width: "100%", direction: "rtl" }} className="flex items-center justify-center">

      {step == 1 &&
        <Box  >
          <Typography sx={{ margin: "10px", textAlign: "center" }} fontSize="large">انتخاب تاریج مراسم</Typography>
          <Calendar
          value1
            value={value1}
            onChange={setValue1}
            calendar={persian}
            locale={persian_fa}
            minDate={today} 

          >

            <Buttons
              style={{ margin: "5px" }}
              onClick={() => confirmStep1()}
            >
              تایید
            </Buttons>
          </Calendar>

        </Box>

      }



      {
        step == 2 &&
        <Box sx={{ textAlign: "center", }}>
          <DatePicker
          value1
            value={value1}
            style={{ height: "50px", borderRadius: "15px", color: "#4e7cc5", textAlign: "center" }}
            onChange={setValue1}
            className="rmdp-mobile"
            calendar={persian}
            locale={persian_fa}
            calendarPosition="bottom-right"
          />
          <Box mt={1} sx={{ width: "100%", color: "#fff", marginTop: "20px", marginRight: "20px" }}>
            <Typography textAlign="right">تلفن داماد :</Typography>
            <PhoneNumberInput defaultValue={phon} onChange={onChangePhone}
              name="phoneNumber" />
            <TextInput value={full_name} label="نام و نام خانوادگی داماد" onChange={(e) => setfull_name(e)} name="fulname" />
            <TextInput value={nationalCode} label="کد ملی داماد" onChange={(e) => {console.log("ddddddddddddd" , e);
             setnationalCode(e)}} name="fulname" />


            <SelectInput1
              name="exampleSelect1"
              value={selectedTalar}
              onChange={(value) => setSelectedTalar(value)}
              label="تالار"
              options={talar}
            />
            <SelectInput1
              name="exampleSelect2"
              value={selectedBagh}
              onChange={(value) => setSelectedBagh(value)}
              label="باغ"
              options={garden}
            />




          </Box>
          <Box sx={{ marginTop: "20px", height: "20vh" }}>

            <Button onClick={() => confirm1()} sx={{ marginLeft: "5px", marginTop: "15px", borderRadius: "25px", bgcolor: "#78b568", color: "#fff", width: "60%", height: "60px", fontWeight: "600" }}
              variant="filled" >
              مرحله بعد
            </Button>
            <Button onClick={() => router.push("/main/karmandan/home")} sx={{ marginTop: "15px", borderRadius: "25px", bgcolor: "#ff9100", color: "#fff", width: "30%", height: "60px", fontWeight: "600" }}
              variant="filled" >
              بازگشت
            </Button>
          </Box>
        </Box>

      }



      {
        step == 3 &&
        <Box sx={{ textAlign: "center", width: "90%" }}>
          <Box mt={1} sx={{ width: "100wh", color: "#fff", marginTop: "20px", marginRight: "20px" }}>


            <SelectInput1
              name="exampleSelect1"
              value={selectedValuecameramanMen}
              onChange={(value) => setselectedValuecameramanMen(value)}
              label="فیلمبردار مرد"
              options={cameramanMen}
            />
            <SelectInput1
              name="exampleSelect2"
              value={selectedValuecameramanWomen}
              onChange={(value) => setselectedValuecameramanWomen(value)}
              label="فیلمبردار زن"
              options={cameramanWomen}
            />
            <SelectInput1
              name="exampleSelect3"
              value={selectedValuephotographerMen}
              onChange={(value) => setselectedValuephotographerMen(value)}
              label="عکاس مرد"
              options={photographerMen}
            />
            <SelectInput1
              name="exampleSelect4"
              value={selectedValuephotographerWomen}
              onChange={(value) => setselectedValuephotographerWomen(value)}
              label="عکاس زن"
              options={photographerWomen}
            />
            <SelectInput1
              name="exampleSelect5"
              value={selectedValuehellyshotMen}
              onChange={(value) => setselectedValuehellyshotMen(value)}
              label="فیلمبردار هوایی مرد"
              options={hellyshotMen}
            />
            <SelectInput1
              name="exampleSelect6"
              value={selectedValuehellyshotWomen}
              onChange={(value) => setselectedValuehellyshotWomen(value)}
              label="فیلمبردار هوایی زن"
              options={hellyshotWomen}
            />
          </Box>
          <Box sx={{ marginTop: "20px", height: "20vh" }}>
            <Button onClick={() => confirm()} sx={{ marginLeft: "5px", marginTop: "15px", borderRadius: "25px", bgcolor: "#78b568", color: "#fff", width: "60%", height: "60px", fontWeight: "600" }}
              variant="filled" >
              ثبت
            </Button>
            <Button onClick={() => setStep(2)} sx={{ marginTop: "15px", borderRadius: "25px", bgcolor: "#ff9100", color: "#fff", width: "28%", height: "60px", fontWeight: "600" }}
              variant="filled" >
              بازگشت
            </Button>

          </Box>
        </Box>
      }
      <ToastContainer autoClose={3000} style={{ marginBottom: '56px', borderRadius: "15px" }} position={"bottom-right"} />
    </Box>
  );
}

