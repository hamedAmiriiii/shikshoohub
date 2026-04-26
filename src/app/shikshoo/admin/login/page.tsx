"use client"
import { Box, Button, TextField, Typography } from '@mui/material'
import React, { useState, useEffect } from 'react'
import PhoneNumberInput from '@/app/coponent/PhoneNumberInput/PhoneNumberInput'
import { apiRequestError } from '@/app/lib/apiRequestError';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';

export default function ShikshooLoginPage() {
    const router = useRouter();
    const [phon, setPhon] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // بررسی اینکه آیا کاربر قبلاً لاگین کرده است
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            router.push('/shikshoo/admin');
        }
    }, [router]);

    const onChangePhone = (e) => {
        setPhon(!e.startsWith("0") ? "0" + e : e)
    }
    
    const handleChangetext = (e) => {
        setPassword(e.target.value)
    }
    
    const send = () => {
        let username = phon
        if (username !== "" && password !== "") {
            if (username.length == 11 && username.substring(0, 2) === "09") {
                setIsLoading(true);
                let data = {
                    username,
                    password,
                }
                apiRequestError("Post", {}, data, "/api/auth/login", false, false, "").then((res) => {
                    setIsLoading(false);
                    if (res.hasError) {
                        const parsedResponse = JSON.parse(res.errorText);
                        const readableMessage = parsedResponse.message;
                        toast.error(readableMessage)
                        return
                    }
                    if (res.user && res.token) {
                        localStorage.setItem('token', res.token);
                        localStorage.setItem('user', JSON.stringify(res.user));
                        toast.success("ورود با موفقیت انجام شد");
                        // ریدایرکت به صفحه اصلی شیک‌شو
                        router.push('/shikshoo/admin');
                    }
                }).catch((error) => {
                    setIsLoading(false);
                    toast.error("خطا در اتصال به سرور");
                })
            } else {
                toast.error("شماره تلفن معتبر نیست");
            }
        } else {
            toast.error("لطفاً تمام فیلدها را پر کنید");
        }
    }

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            width: '100%',
            maxWidth: '100vw',
            overflowX: 'hidden',
            background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)",
            display: 'flex',
            flexDirection: 'column',
            justifyContent: { xs: 'flex-start', sm: 'center' },
            alignItems: 'center',
            padding: { xs: '12px', sm: '20px', md: '24px' },
            paddingTop: { xs: '40px', sm: '20px' },
            paddingLeft: { xs: '12px', sm: '20px', md: '24px' },
            paddingRight: { xs: '12px', sm: '20px', md: '24px' },
            boxSizing: 'border-box',
            direction: "rtl"
        }}>
            <Box sx={{ 
                width: '100%', 
                maxWidth: { xs: 'calc(100% - 0px)', sm: '420px', md: '450px' },
                backgroundColor: "#2b3143",
                borderRadius: { xs: "16px", md: "20px" },
                padding: { xs: "16px", sm: "28px", md: "32px" },
                border: "1px solid rgba(55, 84, 165, 0.3)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                marginTop: { xs: '20px', sm: '0' },
                boxSizing: 'border-box'
            }}>
                <Typography 
                    variant="h5" 
                    gutterBottom 
                    sx={{ 
                        fontWeight: "700", 
                        color: "#fff", 
                        display: "flex", 
                        justifyContent: "center",
                        marginBottom: { xs: "32px", md: "40px" },
                        fontSize: { xs: "18px", sm: "20px", md: "24px" },
                        textAlign: "center",
                        lineHeight: { xs: "1.4", md: "1.5" }
                    }}
                >
                    ورود به شیک‌شو
                </Typography>

                <Box sx={{ 
                    width: "100%", 
                    maxWidth: "100%",
                    marginBottom: { xs: "20px", md: "24px" },
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                }}>
                    <PhoneNumberInput 
                        defaultValue={""} 
                        onChange={onChangePhone}
                        name="phoneNumber" 
                    />
                </Box>

                <Box sx={{ 
                    width: "100%", 
                    maxWidth: "100%",
                    marginBottom: { xs: "28px", md: "32px" },
                    boxSizing: 'border-box'
                }}>
                    <TextField
                        fullWidth
                        name="password"
                        label="کلمه عبور"
                        variant="outlined"
                        type="password"
                        onChange={handleChangetext}
                        value={password}
                        inputProps={{ maxLength: 15, minLength: 6 }}
                        required
                        disabled={isLoading}
                        sx={{
                            '& .MuiInputLabel-root': {
                                color: '#ff9100',
                                fontSize: { xs: "14px", md: "16px" }
                            },
                            '& .MuiInput-underline:after': {
                                borderBottomColor: '#B2BAC2',
                                color: '#fff',
                            },
                            '& .MuiOutlinedInput-root': {
                                color: "#ff9100",
                                fontSize: { xs: "14px", md: "16px" },
                                '& fieldset': {
                                    borderRadius: { xs: "12px", md: "15px" },
                                    borderColor: '#1976d2',
                                    color: '#ff9100',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#1976d2',
                                },
                            },
                            '& input': {
                                padding: { xs: "12px 14px", md: "14px 16px" }
                            }
                        }}
                    />
                </Box>

                <Box display="flex" justifyContent="center">
                    <Button 
                        onClick={() => send()} 
                        disabled={isLoading || !phon || !password}
                        sx={{ 
                            borderRadius: { xs: "20px", md: "25px" }, 
                            bgcolor: (phon && password && !isLoading) ? "#1976d2" : "#8e9191", 
                            color: "#fff", 
                            width: "100%", 
                            height: { xs: "48px", md: "56px" }, 
                            fontWeight: "600",
                            fontSize: { xs: "14px", md: "16px" },
                            textTransform: "none",
                            "&:hover": {
                                bgcolor: (phon && password && !isLoading) ? "#1565c0" : "#8e9191",
                            },
                            "&:disabled": {
                                color: "rgba(255,255,255,0.5)",
                            }
                        }}
                        variant="contained"
                    >
                        {isLoading ? "در حال ورود..." : "ورود"}
                    </Button>
                </Box>
            </Box>

            <ToastContainer 
                autoClose={3000} 
                style={{ 
                    marginBottom: { xs: '80px', sm: '56px' }, 
                    borderRadius: "15px" 
                }} 
                position={"bottom-right"} 
            />
        </Box>
    )
}

