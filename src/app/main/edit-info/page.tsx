"use client"
import { Box, Button, Checkbox, FormControlLabel, Radio, RadioGroup, TextField, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';
import { apiRequestError } from '@/app/lib/apiRequestError';
import TextInput from '@/app/coponent/TextInput/TextInput';
import SelectInput1 from "@/app/coponent/Select/SelectInput1";
import tokenCode from '@/app/coponent/tokenCode';
import { StyledTextField } from '@/app/coponent/TextInput/style';

export default function EditInfo() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [nationalCode, setNationalCode] = useState("");
    const [phon, setPhon] = useState("");
    const [gender, setGender] = useState("");
    const [listCity, setlistCity] = useState([]);
    const [city, setCity] = useState("");
    const [listState, setlistState] = useState([]);
    const [state1, setState1] = useState("");
    const [userType, setUserType] = useState([]);
    const [atelierName, setAtelierName] = useState("");
    const [atelierId, setAtelierId] = useState("");
    const [cameraMan, setCameraMan] = useState(false);
    const [akas, setAkas] = useState(false);
    const [cameraManHeli, setCameraManHeli] = useState(false);
    const [cameraManPrivate, setCameraManPrivate] = useState(false);
    const [atelie, setAtelie] = useState("");
    const [listAt, setListAt] = useState([]);
    const [userData, setUserData] = useState(null);

    // Load user data on mount
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user?.id) {
            router.push('/');
            return;
        }

        setUserData(user);
        setName(user.name || "");
        setLastName(user.last_name || "");
        setNationalCode(user.national_code || "");
        setPhon(user.phone || "");
        setGender(user.gender || "");
        setCity(user.city_id || "");
        setState1(user.state_id || "");
        setAtelierName(user.atelier_name || "");
        setAtelierId(user.atelier_code || "");

        // Determine user type
        const types = [];
        if (user.roles) {
            user.roles.forEach((role) => {
                if (role.name === "واحد صنفی") types.push("atelier");
                if (role.name === "فیلم بردار") types.push("cameraman");
                if (role.name === "عکاس") types.push("photographer");
                if (role.name === "فیلم بردار هوایی") types.push("helishot");
            });
        }
        setUserType(types);

        // Set checkboxes based on user type
        setCameraMan(types.includes("cameraman"));
        setAkas(types.includes("photographer"));
        setCameraManHeli(types.includes("helishot"));

        // Load states
        apiRequestError("Get", {}, {}, "/api/geo/states", false, false, "").then((res) => {
            if (res.hasError) {
                toast.error("خطا در بارگذاری استان‌ها");
                return;
            }
            let NewCombo = [];
            res.map((i) => {
                NewCombo.push({ "value": parseInt(i.id), "label": i.name });
            });
            setlistState(NewCombo);
        });

        setLoading(false);
    }, []);

    // Load cities when state changes
    useEffect(() => {
        if (!state1) return;
        apiRequestError("Get", {}, {}, `/api/geo/cities?state_id=${Number(state1) - 1}`, false, false, "").then((res) => {
            if (res.hasError) {
                toast.error("خطا در بارگذاری شهرها");
                return;
            }
            let NewCombo = [];
            res.map((i) => {
                NewCombo.push({ "value": parseInt(i.id), "label": i.name });
            });
            setlistCity(NewCombo);
        });
    }, [state1]);

    // Load ateliers when cameraman private is checked
    useEffect(() => {
        if (cameraManPrivate) {
            apiRequestError("Get", {}, {}, "/api/auth/atelier", false, false, "").then((res) => {
                if (res.hasError) {
                    toast.error("خطا در بارگذاری آتلیه‌ها");
                    return;
                }
                let NewComboAtelie = [];
                res.map((i) => {
                    NewComboAtelie.push({ "value": parseInt(i.id), "label": i.name });
                });
                setListAt(NewComboAtelie);
            });
        }
    }, [cameraManPrivate]);

    const handleUpdate = () => {
        // Validation
        if (!city) {
            toast.error("شهر انتخاب شود");
            return;
        }

        if (!name.trim()) {
            toast.error("نام به صورت صحیح وارد شود");
            return;
        }

        if (!lastName.trim()) {
            toast.error("نام خانوادگی به صورت صحیح وارد شود");
            return;
        }

        if (!gender) {
            toast.error("جنسیت انتخاب شود");
            return;
        }

        // For atelier users
        if (userType.includes("atelier")) {
            if (!atelierName.trim()) {
                toast.error("نام واحد صنفی وارد شود");
                return;
            }
            if (!atelierId.trim()) {
                toast.error("کد واحد صنفی وارد شود");
                return;
            }
        }

        // Prepare update data
        const updateData: any = {
            name: name,
            last_name: lastName,
            gender: gender,
            city_id: city,
            state_id: state1,
        };

        // Add atelier-specific fields if applicable
        if (userType.includes("atelier")) {
            updateData.atelier_name = atelierName;
            updateData.atelier_code = atelierId;
        }

        // Add cameraman-specific fields if applicable
        if (userType.includes("cameraman") || userType.includes("photographer") || userType.includes("helishot")) {
            if (cameraManPrivate) {
                updateData.atelier_id = atelie;
            }
        }

        let token = tokenCode();
        apiRequestError("Put", {}, updateData, "/api/auth/register", true, true, token).then((res) => {
            if (res.hasError) {
                let readableMessage = "خطای ناشناخته از سمت سرور";
                try {
                    const parsedResponse = JSON.parse(res.errorText);
                    readableMessage = parsedResponse.message || readableMessage;
                } catch {
                    readableMessage = res.errorText || readableMessage;
                }
                toast.error(readableMessage);
                return;
            }

            // Update localStorage
            const updatedUser = { ...userData, ...updateData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            toast.success("اطلاعات با موفقیت بروزرسانی شد");
            setTimeout(() => {
                router.push("/main/home");
            }, 1500);
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
                <Typography>در حال بارگذاری...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ direction: "rtl", color: "#fff", padding: 2 }}>
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
                    ویرایش اطلاعات
                </Typography>

                <Box component="form" noValidate autoComplete="off">
                    {/* State Selection */}
                    <Box component="form" noValidate autoComplete="off">
                        <SelectInput1
                            name="state"
                            value={state1}
                            onChange={(value) => setState1(value)}
                            label="استان"
                            options={listState}
                        />
                    </Box>

                    {/* City Selection */}
                    <Box component="form" noValidate autoComplete="off">
                        <SelectInput1
                            name="city"
                            value={city}
                            onChange={(value) => setCity(value)}
                            label="شهر"
                            options={listCity}
                        />
                    </Box>

                    {/* Name */}
                    <TextInput
                        value={name}
                        label="نام"
                        onChange={(e) => setName(e)}
                        name="name"
                        type="text"
                    />

                    {/* Last Name */}
                    <TextInput
                        value={lastName}
                        label="نام خانوادگی"
                        onChange={(e) => setLastName(e)}
                        name="last_name"
                        type="text"
                    />

                    {/* National Code - Disabled */}
                    <Box sx={{ marginTop: "10px" }}>
                        <Typography textAlign="right">کد ملی (قابل تغییر نیست) :</Typography>
                        <Box sx={{ display: "flex" }}>
                            <Box sx={{ width: "90%" }}>
                                <StyledTextField
                                    variant="outlined"
                                    value={nationalCode}
                                    disabled={true}
                                    fullWidth
                                    InputProps={{
                                        inputProps: {
                                            style: {
                                                direction: 'ltr',
                                                textAlign: 'left',
                                                paddingLeft: "15px",
                                                color: "#999"
                                            }
                                        },
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>

                    {/* Phone - Disabled */}
                    <Box sx={{ marginTop: "10px" }}>
                        <Typography textAlign="right">شماره تلفن (قابل تغییر نیست) :</Typography>
                        <Box sx={{ display: "flex" }}>
                            <Box sx={{ width: "90%" }}>
                                <StyledTextField
                                    variant="outlined"
                                    value={phon}
                                    disabled={true}
                                    fullWidth
                                    InputProps={{
                                        inputProps: {
                                            style: {
                                                direction: 'ltr',
                                                textAlign: 'left',
                                                paddingLeft: "15px",
                                                color: "#999"
                                            }
                                        },
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>

                    {/* Gender */}
                    <Box mb={2}>
                        <Typography sx={{ color: "#fff" }}>جنسیت:</Typography>
                        <RadioGroup
                            name="gender"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                        >
                            <FormControlLabel
                                value="1"
                                control={<Radio />}
                                label="مرد"
                                sx={{ color: "#fff" }}
                            />
                            <FormControlLabel
                                value="2"
                                control={<Radio />}
                                label="زن"
                                sx={{ color: "#fff" }}
                            />
                        </RadioGroup>
                    </Box>

                    {/* Atelier-specific fields */}
                    {userType.includes("atelier") && (
                        <>
                            <TextInput
                                value={atelierName}
                                label="نام واحد صنفی"
                                onChange={(e) => setAtelierName(e)}
                                name="atelier_name"
                                type="text"
                            />

                            <TextInput
                                value={atelierId}
                                label="کد واحد صنفی"
                                onChange={(e) => setAtelierId(e)}
                                name="atelier_id"
                                type="text"
                            />
                        </>
                    )}

                    {/* Cameraman/Photographer/Helishot - Display only */}
                    {(userType.includes("cameraman") || userType.includes("photographer") || userType.includes("helishot")) && (
                        <>
                            <Box mb={2}>
                                <Typography sx={{ color: "#fff", fontWeight: "600", marginBottom: 1 }}>
                                    نوع فعالیت (قابل تغییر نیست):
                                </Typography>
                                <Box sx={{ paddingLeft: 2 }}>
                                    {userType.includes("cameraman") && (
                                        <Typography sx={{ color: "#fff" }}>✓ کارت فیلمبرداری</Typography>
                                    )}
                                    {userType.includes("photographer") && (
                                        <Typography sx={{ color: "#fff" }}>✓ کارت عکاسی</Typography>
                                    )}
                                    {userType.includes("helishot") && (
                                        <Typography sx={{ color: "#fff" }}>✓ کارت فیلمبرداری هوایی</Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* Atelier selection for cameraman */}
                            <Box component="form" noValidate autoComplete="off">
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={cameraManPrivate}
                                            onChange={(e) => setCameraManPrivate(e.target.checked)}
                                            name="privateAtelier"
                                            color="primary"
                                        />
                                    }
                                    label="فیلم بردار اختصاصی آتلیه هستم"
                                />
                            </Box>

                            {cameraManPrivate && (
                                <SelectInput1
                                    name="atelier"
                                    value={atelie}
                                    onChange={(value) => setAtelie(value)}
                                    label="نام آتلیه"
                                    options={listAt}
                                />
                            )}
                        </>
                    )}

                    {/* Update Button */}
                    <Box mb={2} sx={{ marginTop: 3 }}>
                        <Button
                            onClick={handleUpdate}
                            sx={{
                                marginTop: "30px",
                                borderRadius: "15px",
                                bgcolor: "#1976d2",
                                color: "#fff",
                                width: "100%",
                                height: "60px",
                                fontWeight: "600",
                                "&:hover": {
                                    bgcolor: "#1565c0"
                                }
                            }}
                            variant="contained"
                        >
                            بروزرسانی اطلاعات
                        </Button>
                    </Box>

                    {/* Cancel Button */}
                    <Box mb={2}>
                        <Button
                            onClick={() => router.back()}
                            sx={{
                                borderRadius: "15px",
                                bgcolor: "#666",
                                color: "#fff",
                                width: "100%",
                                height: "60px",
                                fontWeight: "600",
                                "&:hover": {
                                    bgcolor: "#555"
                                }
                            }}
                            variant="contained"
                        >
                            بازگشت
                        </Button>
                    </Box>
                </Box>

                <ToastContainer autoClose={3000} style={{ marginBottom: '56px', borderRadius: "15px" }} position={"bottom-right"} />
            </Box>
        </Box>
    );
}
