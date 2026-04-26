"use client"
import { Box, Button, FormControlLabel, Radio, RadioGroup, TextField, Typography } from '@mui/material'
import React, { useState } from 'react'
import PhoneNumberInput from './PhoneNumberInput/PhoneNumberInput'
import { MuiOtpInput } from 'mui-one-time-password-input';
import styled from '@emotion/styled';
import { apiRequestError } from '../lib/apiRequestError';
import tokenCode from './tokenCode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FileResizer from 'react-image-file-resizer';
import UploadSteps from './UploadSteps';
import { useRouter } from 'next/navigation';

export default function LoginPagee() {
    const router = useRouter();
    const [phon, setPhon] = useState("");
    const [password, setPassword] = useState("");

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
                let data = {
                    username,
                    password,
                }
                apiRequestError("Post", {}, data, "/api/auth/login", false, false, "").then((res) => {
                    if (res.hasError) {
                        const parsedResponse = JSON.parse(res.errorText);
                        const readableMessage = parsedResponse.message;
                        toast.error(readableMessage)
                        return
                    }
                    if (res.user.name) {
        

                          localStorage.setItem('token', res.token);
                        localStorage.setItem('user', JSON.stringify(res.user));
                        
          let admin = res?.user.roles.some((e) => e.name === "ادمین");

          if (admin) {
            router.push('/main/home');
          } else {
            router.push('/main/karmandan/home');
          }

                    }
                  
                })
            }
        }
    }




            return (
                <Box>

                    <Box sx={{ direction: "rtl", marginTop: "40px", }}>
                        <Typography mt={12} variant="h6" gutterBottom sx={{ fontWeight: "600", color: "#fff", display: "flex", justifyContent: "center" }}>
                            سامانه یکپارچه ثبت مراسمات
                        </Typography>

                        <Box mt={16} sx={{ width: "100%", color: "fff", marginTop: "80px", marginRight: "20px" }}>

                            <PhoneNumberInput defaultValue={""} onChange={onChangePhone}
                                name="phoneNumber" />
                        </Box>

                        <Box mb={2} sx={{ width: "90%", color: "fff", marginTop: "80px", marginRight: "20px" }}>
                            <TextField
                                fullWidth
                                name="password"
                                label="کلمه عبور"
                                variant="outlined"
                                type="password"
                                onChange={handleChangetext}
                                inputProps={{ maxLength: 15, minLength: 6 }}
                                required
                                sx={{

                                    '& .MuiInputLabel-root': {
                                        color: '#ff9100', // Label text color
                                    },

                                    '& .MuiInput-underline:after': {
                                        borderBottomColor: '#B2BAC2',
                                        color: '#fff',
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        color: "#ff9100",
                                        '& fieldset': {
                                            borderRadius: "15px",
                                            borderColor: '#1976d2',
                                            color: '#ff9100',
                                        },

                                        '&.Mui-focused fieldset': {
                                            borderColor: '#1976d2',

                                        },
                                    },
                                }}
                            />
                        </Box>


                    </Box>

                    <Box display="flex" justifyContent="center" mt={2}>
                        <Button onClick={() => send()} sx={{ marginTop: "30px", borderRadius: "25px", bgcolor: phon ? "#1976d2" : "#8e9191", color: "#fff", width: "80%", height: "60px", fontWeight: "600" }}
                            variant={phon ? "contained" : "filled"} >
                            ورود
                        </Button>
                    </Box>

                    <ToastContainer autoClose={3000} style={{ marginBottom: '56px', borderRadius: "15px" }} position={"bottom-right"} />
                </Box>

            )


        }
