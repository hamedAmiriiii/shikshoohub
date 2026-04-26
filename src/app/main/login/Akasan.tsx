"use client"
import { Box, Button, Checkbox, FormControlLabel, Radio, RadioGroup, TextField, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { MuiOtpInput } from 'mui-one-time-password-input';
import styled from '@emotion/styled';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FileResizer from 'react-image-file-resizer'
import { useRouter } from 'next/navigation';
import { apiRequestError } from '@/app/lib/apiRequestError';
import PhoneNumberInput from '@/app/coponent/PhoneNumberInput/PhoneNumberInput';
import UploadSteps from '@/app/coponent/UploadSteps';
import TextInput from '@/app/coponent/TextInput/TextInput';
import UploadStepsAkasan from '@/app/coponent/UploadStepsAkasan';
import SelectInput1 from "@/app/coponent/Select/SelectInput1";

export default function Akasan() {
    const router = useRouter();

    const [phon, setPhon] = useState("");
    const [step, setStep] = useState(1);
    const [otp, setOtp] = useState('')
    const [otpComplete, setOtpComplete] = useState('')
    const [state, setState] = useState();
    const [fullData, setFullData] = useState({});
    const [cameraMan, setCameraMan] = useState("");
    const [akas, setAkas] = useState("");
    const [cameraManHeli, setCameraManHeli] = useState("");
    const [cameraManPrivate, setCameraManPrivate] = useState("");
    const [atelie, setAtelie] = useState("");
    const [listAt, setListAt] = useState([]);
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [nationalCode, setNationalCode] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [listCity, setlistCity] = useState([]);
    const [city, setCity] = useState("");
    const [listState, setlistState] = useState([]);
    const [state1, setState1] = useState("");

    const onChangePhone = (e) => {

        if (e) { setPhon(!e.startsWith("0") ? "0" + e : e) } else setPhon("")
    }
    const otpFanc = () => {
        if (!phon) {
            toast.error("شماره موبایل را وارد کنید")
            return
        }


        let loadData = {
            phone: phon
        }

        apiRequestError("Post", {}, loadData, "/api/confirmation-code/create", false, false, "").then((res) => {
            if (res.hasError) {
                toast.error("لحظاتی دیگر تلاش کنید")
                return
            }
            
            setStep(2)
        })
    }

    useEffect(() => {
   
        apiRequestError("Get", {}, {}, "/api/geo/states", false, false, "").then((res) => {
            console.log("cccccccccccccc", res);

            if (res.hasError) {
                toast.error("لحظاتی دیگر تلاش کنید")
                return
            }

            let NewCombo = []
            res.map((i) => {
                NewCombo.push({ "value": parseInt(i.id), "label": i.name })
            })

            setCity("")
            setlistState(NewCombo)
        })

    }, [])
    useEffect(() => {
   console.log("ssssssssss" , state1);
   if (!state1) return
        apiRequestError("Get", {}, {}, `/api/geo/cities?state_id=${state1 + -1}`, false, false, "").then((res) => {
            console.log("cccccccccccccc", res);

            if (res.hasError) {
                toast.error("لحظاتی دیگر تلاش کنید")
                return
            }

            let NewCombo = []
            res.map((i) => {
                NewCombo.push({ "value": parseInt(i.id), "label": i.name })
            })

            setlistCity(NewCombo)
        })

    }, [state1])
    

    const handleChange = (newValue) => {
        setOtp(newValue)

        newValue.length < 4 && setOtpComplete("")
    }


    const confirmAtelie = () => {
        console.log("eeeeeeeeeeeeeeeeeeeeeeeeeeeeee", state);

        let type = []
        if (cameraMan) {
          type.push(3)
        } if (akas) {
          type.push(4)
        } if (cameraManHeli) {
          type.push(5)
        }
        if (type.length < 1) {
            toast.error("نوع فعالیت خود را مشخص کنید")
            return
        }
 if (!city) {
            toast.error("شهر انتخاب شود ")
            return
        }
        if (!name) {

            toast.error("نام به صورت صحیح وارد شود  ")
            return
        }
       
        if (!lastName) {
            toast.error("نام خانوادگی به صورت صحیح وارد شود  ")
            return
        }
        if (nationalCode == "") {
            toast.error("کد ملی وارد شود  ")
            return
        }
        if (nationalCode?.length !== 10) {
            toast.error("کد ملی به صورت صحیح وارد شود  ")
            return
        }
        if (state.gender == null) {
            toast.error("جنسیت انتخاب شود  ")
            return
        }
       
        
        if (!password) {
            toast.error("کلمه عبور وارد شود  ")
            return
        }
        if (password?.length < 6) {
            toast.error("کلمه عبور حداقل 6 کاراکتر وارد شود  ")
            return
        }
        if (!password2) {
            toast.error("تکرار کلمه عبور وارد شود  ")
            return
        }
        if (password !== password2) {
            toast.error("تکرار کلمه عبور با کلمه عبور یکسان نیست  ")
            return
        }

       

        let atelie22 = {}
        atelie22.atelier_id = atelie ? atelie:  null
        atelie22.birth_certificate = state.imgShenas
        atelie22.gender = state.gender
        atelie22.atelier_address = "کرمان"
        atelie22.last_name = lastName
        atelie22.name = name
        atelie22.national_cart = state.img
        atelie22.national_code = nationalCode
        atelie22.password = password
        atelie22.password2 = password2
        atelie22.personality_image = state.imgPersen
        atelie22.phone = phon
        atelie22.tech_certificate = state.imgCertificate
        atelie22.tech_certificate = state.imgCertificate

      
    atelie22.type = type
        

        setTimeout(() => {

            apiRequestError("Post", {}, atelie22, "/api/auth/register", false, false, "").then((res) => {
                console.log("cccccccccccc" , res);
                
                if (res.hasError) {
                    toast.error("لحظاتی دیگر تلاش کنید")
                    return
                }
                toast.success("ثبت نام شما با موفقیت انجام شد  و تایید احراز هویت از طریق پیامک به شما اطلاع داده میشود")
                setTimeout(() => {
                    window.location.reload()
                }, 2000);
            })
        }, 50);


    }
    const handleChangetext = (e) => {

        console.log("gggggggggggggggggggg", e);
        let atelie1 = state
        let value = e.value
        let name = e.name
        atelie1[name] = value
        setState(atelie1)
    }
    const handleComplete = (newValue) => {
        setOtpComplete(newValue)
    }
    const checkOtp = () => {
        if (!otpComplete) {
            toast.error("کد ارسال شده را وارد کنید")
            return
        }
        let loadData = {
            "phone": phon,
            "code": otpComplete
        }
        apiRequestError("Post", {}, loadData, "/api/confirmation-code/check", false, false, "").then((res) => {
            if (res.hasError) {
                const parsedResponse = JSON.parse(res.errorText);
                const readableMessage = parsedResponse.message;
                toast.error(readableMessage)
                return
            }
            setStep(3)
        })

    }




    const handleFinishUploadedImages = (uploadedImages) => {
        setState(uploadedImages)
        setStep(4)

    };

    const handleCameraMan = (option: any) => {
        setCameraMan(option.target.checked)
    };
    const handleAkas = (option: any) => {
        setAkas(option.target.checked)
    };
    const handleCameraManHeli = (option: any) => {
        setCameraManHeli(option.target.checked)
    };
    const handleCameraManPrivate = (option: any) => {

        if (option.target.checked) {
            apiRequestError("Get", {}, {}, "/api/auth/atelier", false, false, "").then((res) => {
                if (res.hasError) {
                    toast.error("لحظاتی دیگر تلاش کنید")
                    return
                }
                console.log("cccccccccccccc", res);

                let NewComboAtelie = []
                res.map((i) => {
                    NewComboAtelie.push({ "value": parseInt(i.id), "label": i.name })
                })

                setListAt(NewComboAtelie)
                setCameraManPrivate(option.target.checked)
            })
        } else {
            setCameraManPrivate(option.target.checked)

        }




    };


    if (step == 1) return (
        <Box>

            <Box sx={{ margin: "10px", backgroundColor: "#4B4B4B", direction: "rtl", marginTop: "40px", padding: "8px", borderRadius: "15px" }}>

                <h6 style={{ fontWeight: "400" }}> *  ثبت نام تنها برای دارندگان کارت فیلم برداری و عکاسی مجاز می باشد.</h6>
                <h6 style={{ fontWeight: "400" }}> *مدارک لازم برای ثبت نام شامل : تصویر کارت ملی ، صفحه اول شناسنامه _ عکس پرسنلی می باشد</h6>
                <h6 style={{ fontWeight: "400" }}> *حداقل یک هفته پس از ثبت نام، مراحل تایید احراز هویت شما در اتحادیه انجام خواهد شد و پس از تایید اطلاعات وارده، به پنل کاربری خود دسترسی خواهید داشت</h6>


            </Box>

            <Box sx={{ direction: "rtl", marginTop: "40px" }}>
                <Box mt={8} sx={{ width: "100%", color: "fff", marginTop: "80px", marginRight: "20px" }}>

                    <PhoneNumberInput defaultValue={""} onChange={onChangePhone}
                        name="phoneNumber" />
                </Box>
            </Box>

            <Box display="flex" justifyContent="center" mt={2}>
                <Button onClick={() => otpFanc()} sx={{ marginTop: "30px", borderRadius: "15px", bgcolor: phon ? "#1976d2" : "#8e9191", color: "#fff", width: "80%", height: "60px", fontWeight: "600" }}
                    variant={phon ? "contained" : "filled"} >
                    دریافت کد دوعاملی
                </Button>
            </Box>
            {/* <Box display="flex" justifyContent="center" >
                <Button onClick={() => otpFanc()} sx={{ marginTop: "15px", borderRadius: "25px", bgcolor: "#ff9100", color: "#fff", width: "80%", height: "60px", fontWeight: "600" }}
                    variant="filled" >
                    انصراف
                </Button>
            </Box> */}
            <ToastContainer autoClose={3000} style={{ marginBottom: '56px', borderRadius: "15px" }} position={"bottom-right"} />
        </Box>

    )

    if (step == 2) return (
        <Box color={"#ff9100"} m={2} mt={15}>
            <Box sx={{ direction: "rtl", marginTop: "40px" }}>
                <Box mt={8} sx={{ width: "100%", color: "fff", marginTop: "80px", marginRight: "20px" }}>
                    <Typography style={{ fontWeight: "400" }}>  {`کد دو عاملی به شماه ${phon} ارسال شد`} </Typography>
                </Box>
            </Box>

            <MuiOtpInput className="my-class-name" mt={10} TextFieldsProps={{ className: "my-class-name", size: "medium" }} value={otp} onChange={handleChange} length={5} onComplete={handleComplete} autoFocus />

            <Box display="flex" justifyContent="center" mt={2}>
                <Button onClick={() => checkOtp()} sx={{ marginTop: "30px", borderRadius: "25px", bgcolor: otpComplete ? "#1976d2" : "#8e9191", color: "#fff", width: "90%", height: "60px", fontWeight: "600" }}
                    variant={otpComplete ? "contained" : "filled"} >
                    تایید
                </Button>
            </Box>
            {/* <Box display="flex" justifyContent="center" >
                <Button onClick={() => setStep(1)} sx={{ marginTop: "15px", borderRadius: "25px", bgcolor: "#ff9100", color: "#fff", width: "80%", height: "60px", fontWeight: "600" }}
                    variant="filled" >
                    بازگشت
                </Button>
            </Box> */}

            <ToastContainer autoClose={3000} style={{ marginBottom: '56px', borderRadius: "15px" }} position={"bottom-right"} />
        </Box>

    )

    if (step == 3) return (
        <Box color={"#ff9100"} >
            <UploadStepsAkasan onFinish={handleFinishUploadedImages} />
            <ToastContainer autoClose={3000} style={{ marginBottom: '56px', borderRadius: "15px" }} position={"bottom-right"} />
        </Box>

    )

    if (step == 4) return (
        <Box sx={{ direction: "rtl", color: "#fff" }}>
            <Box
                sx={{
                    maxWidth: 600,
                    margin: "auto",
                    padding: 3,
                    backgroundColor: "#313131",
                    borderRadius: 2,
                    boxShadow: 2,
                }}
            >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: "600", color: "#fff" }}>
                    ثبت اطلاعات فردی
                </Typography>

                <Box component="form" noValidate autoComplete="off">
                    <Box mb={2}>
                        <Box component="form" noValidate autoComplete="off">

                            <FormControlLabel 
                                control={
                                    <Checkbox
                                    style={{color:"#ff9100"}}
                                        onChange={handleCameraMan}
                                        name="needsApproval"
                                        color="primary"
                                    />
                                }
                                label="کارت فیلمبرداری دارم"
                            />
                        </Box>
                        <Box component="form" noValidate autoComplete="off">

                            <FormControlLabel 
                                control={
                                    <Checkbox 
                                    style={{color:"#ff9100"}}
                                        onChange={handleAkas}
                                        name="needsApproval"
                                        color="primary"
                                    />
                                }
                                label="کارت عکاسی دارم"
                            />
                        </Box>

                        <Box component="form" noValidate autoComplete="off">
                            <FormControlLabel
                                control={
                                    <Checkbox
                                    style={{color:"#ff9100"}}
                                        onChange={handleCameraManHeli}
                                        name="needsApproval"
                                        color="primary"
                                    />
                                }
                                label="کارت فیلمبرداری هوایی دارم"
                            />
                        </Box>
                        <Box component="form" noValidate autoComplete="off">
                        <SelectInput1
                                name="exampleSelect1"
                                value={state1}
                                onChange={(value) => setState1(value)}
                                label="استان"
                                options={listState}
                            />
                        </Box>
                        <Box component="form" noValidate autoComplete="off">
                        <SelectInput1
                                name="exampleSelect1"
                                value={city}
                                onChange={(value) => setCity(value)}
                                label="شهر"
                                options={listCity}
                            />
                        </Box>

                        <TextInput
  value={name}
  label="نام"
  onChange={(e) => setName(e)}
  name="name"
/>

<TextInput
  value={lastName}
  label="نام خانوادگی"
  onChange={(e) => setLastName(e)}
  name="last_name"
/>

<TextInput
  value={nationalCode}
  label="کد ملی"
  onChange={(e) => setNationalCode(e)}
  name="national_code"
/><Box mb={2}>
                            <Typography sx={{ color: "#fff" }}>جنسیت:</Typography>
                            <RadioGroup style={{ display: "flex", justifyContent: "space-between" }} name="gender" onChange={(e) => handleChangetext({ name: "gender", value: e.target.value })}>
                                <FormControlLabel value="1" control={<Radio />} label="مرد" sx={{ width: "50%", color: "#fff" }} />
                                <FormControlLabel value="2" control={<Radio />} label="زن" sx={{ width: "50%", color: "#fff" }} />
                            </RadioGroup>
                        </Box>


                        <Box component="form" noValidate autoComplete="off">
                            <FormControlLabel

                                control={
                                    <Checkbox
                                        onChange={handleCameraManPrivate}
                                        name="11"
                                        color="primary"
                                    />
                                }
                                label="فیلم بردار اختصاصی آتلیه هستم"
                            />
                        </Box>
                        {
                            cameraManPrivate &&
                            <SelectInput1
                                name="exampleSelect1"
                                value={atelie}
                                onChange={(value) => setAtelie(value)}
                                label="نام آتلیه"
                                options={listAt}
                            />
                        }

<TextInput
  value={password}
  label="کلمه عبور"
  onChange={(e) => setPassword(e)}
  name="password"
/>

<TextInput
  value={password2}
  label="تکرار کلمه عبور"
  onChange={(e) => setPassword2(e)}
  name="password2"
/>
                    </Box>

                    <Box mb={2}>

                        <Button onClick={() => confirmAtelie()} sx={{ marginTop: "30px", borderRadius: "15px", bgcolor: phon ? "#1976d2" : "#8e9191", color: "#fff", width: "100%", height: "60px", fontWeight: "600" }}
                            variant={phon ? "contained" : "filled"} >
                            ثبت اطلاعات
                        </Button>

                    </Box>





                </Box>
                <ToastContainer autoClose={3000} style={{ marginBottom: '56px', borderRadius: "15px" }} position={"bottom-right"} />
            </Box>


        </Box>


    )

}
