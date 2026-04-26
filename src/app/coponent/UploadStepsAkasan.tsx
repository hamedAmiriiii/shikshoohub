import { Button } from "@mui/material";
import React, { useState } from "react";
import DeleteIcon from '@mui/icons-material/Delete';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const UploadStepsAkasan = ({ onFinish }) => {
    const [step, setStep] = useState(1);
    const [images, setImages] = useState({
        imgAT: null,
        imgShenasAt: null,
        imgPersenAt: null,
        imgJavazAt: null,
    });

    const steps = [
        { id: "img",       label: " تصویر کارت ملی" },
        { id: "imgShenas", label: " تصویر صفحه اول شناسنامه" },
        { id: "imgPersen", label: "تصویر عکس پرسنلی" },
        { id: "imgCertificate",  label: "گواهی فعالیت" },
    ];

   
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        
        // فرمت‌های معتبر برای عکس
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'];
    
        // بررسی فرمت فایل
        if (file && validImageTypes.includes(file.type)) {
            const reader = new FileReader();
            reader.onload = () => {
                setImages((prev) => ({
                    ...prev,
                    [steps[step - 1].id]: reader.result,
                }));
            };
            reader.readAsDataURL(file);
        } else {
            toast.error("لطفاً یک فایل عکس با فرمت jpg, jpeg, png, gif, bmp آپلود کنید.")
        }
    };

    


    const handleRemoveImage = (id) => {
        setImages((prev) => ({
            ...prev,
            [id]: null,
        }));
    };

    const goToNextStep = () => {
        if (step < steps.length) {
            setStep(step + 1);
        } else {
            onFinish(images); // ارسال داده‌ها به کامپوننت والد
        }
    };

    const goToPreviousStep = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const currentStep = steps[step - 1];
    const progress = (step / steps.length) * 100;

    return (
        <div style={{ textAlign: "center", padding: "20px", background: "#313131", color: "#fff", height: "100%" }}>
            {/* Progress Bar */}
            <div style={{ position: "relative", marginBottom: "20px" }}>
                <button
                    onClick={goToPreviousStep}
                    style={{
                        marginTop: "10px",
                        position: "absolute",
                        left: 0,
                        background: "none",
                        border: "none",
                        color: "#fff",
                        fontSize: "30px",
                        cursor: "pointer",
                    }}
                    disabled={step === 1}
                >
                    ←
                </button>
                <div style={{ marginBottom: '10px' }}>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: '10px',
                            borderRadius: '5px',
                            backgroundColor: '#f0f0f0',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: '#28a745',
                            },
                        }}
                    />
                    <Typography variant="body2" color="#fff">
                        {Math.round(progress)}%
                    </Typography>
                </div>
            </div>

            <h5>{currentStep.label}</h5>

            <div
                style={{
                    position: "relative",
                    border: `2px solid ${images[currentStep.id] ? "#28a745" : "#dc3545"}`,
                    borderRadius: "10px",
                    padding: "20px",
                    margin: "20px auto",
                    width: "80%",
                    maxWidth: "400px",
                    background: "#222",
                    minHeight: "200px",
                    maxHeight: "300px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {images[currentStep.id] ? (
                    <>
                        <img
                            src={images[currentStep.id]}
                            alt="Uploaded"
                            style={{ width: "100%", borderRadius: "10px" ,
                                maxHeight: "300px"}}
                        />
                        <button
                            onClick={() => handleRemoveImage(currentStep.id)}
                            style={{
                                position: "absolute",
                                top: "10px",
                                right: "10px",
                                color: "#fff",
                                border: "none",
                                borderRadius: "50%",
                                width: "30px",
                                height: "30px",
                                cursor: "pointer",
                                
                    maxHeight: "300px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                        </button>
                    </>
                ) : (
                    <label htmlFor="file-upload" style={{ cursor: "pointer", color: "#aaa", padding: "40px 60px" }}>
                        انتخاب فایل
                        <input
                            id="file-upload"
                            type="file"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                    </label>
                )}
            </div>

            <Button
                onClick={goToNextStep}
                sx={{
                    fontSize: "18px",
                    marginTop: "30px",
                    borderRadius: "15px",
                    bgcolor: "#1976d2",
                    color: "#fff",
                    width: "90%",
                    height: "60px",
                    fontWeight: "600",
                }}
                disabled={!images[currentStep.id]}
            >
                {step === steps.length ? "تایید عکس ها و ادامه روند ثبت نام" : "ادامه"}
            </Button>
            <ToastContainer autoClose={8000}  style={{ marginBottom: '56px', borderRadius: "15px" }} position={"bottom-right"} />
        </div>
    );
};

export default UploadStepsAkasan;
