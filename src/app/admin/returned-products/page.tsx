"use client";
import List from "@/app/coponent/grid/Grid";
import React, { useState, Suspense, useEffect, useRef, useCallback } from "react";
import { Box, Typography, IconButton, Button } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import FlashlightOnIcon from '@mui/icons-material/FlashlightOn';
import FlashlightOffIcon from '@mui/icons-material/FlashlightOff';
import { useRouter } from "next/navigation";
import { apiRequestError } from "@/app/lib/apiRequestError";
import tokenCode from "@/app/coponent/tokenCode";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import TextInput from "@/app/coponent/TextInput/TextInput";
import ReturnedProductCard from "./returnedProductCard";
import BottomSheet from "@/app/coponent/BottomSheet";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

export default function ReturnedProductsPage() {
  const router = useRouter();
  const [dataFilter, setDataFilter] = useState([]);
  const [barcode, setBarcode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openBottomSheet, setOpenBottomSheet] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [listKey, setListKey] = useState(0); // برای force refresh لیست

  let searchBoxList: any = [
    { fieldName: "barcode", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
  ];

  const FilterComponent = () => <h1>ggggggggg</h1>;

  // Handle barcode scan
  const handleScan = useCallback((result: string) => {
    if (result && result.trim()) {
      setBarcode(result.trim());
      setShowScanner(false);
      // Focus on input after scan
      setTimeout(() => {
        const inputElement = document.querySelector('input[name="barcode"]') as HTMLInputElement;
        if (inputElement) {
          inputElement.focus();
        }
      }, 100);
    }
  }, []);

  const handleError = useCallback((error: any) => {
    console.error("Scanner error:", error);
  }, []);

  // Focus on barcode input when BottomSheet opens
  useEffect(() => {
    if (openBottomSheet) {
      setTimeout(() => {
        const inputElement = document.querySelector('input[name="barcode"]') as HTMLInputElement;
        if (inputElement) {
          inputElement.focus();
        }
      }, 300);
    }
  }, [openBottomSheet]);

  const handleSubmitReturn = async () => {
    if (!barcode.trim()) {
      toast.error("لطفاً بارکد را وارد کنید");
      return;
    }

    setIsSubmitting(true);
    const token = tokenCode();
    
    try {
      const res = await apiRequestError(
        "Post",
        {},
        { barcode: barcode.trim() },
        "/api/returned-products",
        true,
        true,
        token
      );

      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        const readableMessage = parsedResponse.message;
        toast.error(readableMessage || "خطا در ثبت برگشت کالا");
        setIsSubmitting(false);
        return;
      }

      toast.success("کالا با موفقیت برگشت خورد");
      setBarcode("");
      setOpenBottomSheet(false);
      setShowScanner(false);
      
      // Force refresh list
      setListKey(prev => prev + 1);
      
      setIsSubmitting(false);
    } catch (error) {
      toast.error("خطا در ثبت برگشت کالا");
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      handleSubmitReturn();
    }
  };

  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <Box sx={{ width: "100%", direction: "rtl", padding: "16px", minHeight: "100vh", paddingBottom: "100px", background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              onClick={() => router.push("/admin")}
              sx={{
                cursor: "pointer",
                marginLeft: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.1)",
                }
              }}
            >
              <ArrowBackIcon sx={{ color: "#fff" }} />
            </Box>
            <Typography sx={{ fontSize: "24px", color: "#fff", fontWeight: "700" }}>
              برگشت خرید
            </Typography>
          </Box>
          
          {/* Submit Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenBottomSheet(true)}
            sx={{
              backgroundColor: "#78b568",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#5a9a4a"
              },
              borderRadius: "12px",
              padding: "8px 16px"
            }}
          >
            ثبت
          </Button>
        </Box>

        {/* List Section */}
        <div style={{ width: "100%", direction: "rtl" }} className="flex-col items-center justify-center">
          <List
            key={listKey}
            disableFilter={true}
            searchBoxList={searchBoxList}
            filterBoxList={dataFilter}
            CartComponent={(props: any) => <ReturnedProductCard props={props} />}
            url="/api/returned-products"
            filterComponent={<FilterComponent />}
            showTotal={true}
          />
        </div>

        {/* BottomSheet for Barcode Input */}
        <BottomSheet
          open={openBottomSheet}
          onClose={() => {
            setOpenBottomSheet(false);
            setShowScanner(false);
            setBarcode("");
            setTorchOn(false);
          }}
          title="ثبت برگشت کالا"
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: "20px", padding: "16px", direction: "rtl" }}>
            {/* Scanner Toggle Button */}
            <Box sx={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <Button
                variant={showScanner ? "contained" : "outlined"}
                startIcon={<QrCodeScannerIcon />}
                onClick={() => setShowScanner(!showScanner)}
                sx={{
                  backgroundColor: showScanner ? "#78b568" : "transparent",
                  color: showScanner ? "#fff" : "#78b568",
                  borderColor: "#78b568",
                  "&:hover": {
                    backgroundColor: showScanner ? "#5a9a4a" : "rgba(120, 181, 104, 0.1)"
                  }
                }}
              >
                {showScanner ? "بستن اسکنر" : "باز کردن اسکنر"}
              </Button>
            </Box>

            {/* Barcode Scanner */}
            {showScanner && (
              <Box sx={{ position: "relative", width: "100%", height: "300px", marginBottom: "16px" }}>
                <BarcodeScannerComponent
                  width="100%"
                  height={300}
                  onUpdate={(err, result) => {
                    if (result) {
                      handleScan(result.getText());
                    } else if (err) {
                      handleError(err);
                    }
                  }}
                  torch={torchOn}
                />
                <Box sx={{ position: "absolute", top: "10px", right: "10px" }}>
                  <IconButton
                    onClick={() => setTorchOn(!torchOn)}
                    sx={{
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      color: "#fff",
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.7)"
                      }
                    }}
                  >
                    {torchOn ? <FlashlightOffIcon /> : <FlashlightOnIcon />}
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* Barcode Input */}
            <TextInput
              value={barcode}
              label="بارکد کالا"
              onChange={(e) => setBarcode(e)}
              name="barcode"
              type="text"
              onKeyPress={handleKeyPress}
            />

            {/* Submit Button */}
            <Button
              variant="contained"
              onClick={handleSubmitReturn}
              disabled={isSubmitting || !barcode.trim()}
              fullWidth
              sx={{
                backgroundColor: "#78b568",
                color: "#fff",
                padding: "12px",
                fontSize: "16px",
                fontWeight: "600",
                "&:hover": {
                  backgroundColor: "#5a9a4a"
                },
                "&:disabled": {
                  backgroundColor: "#666",
                  color: "#999"
                },
                marginTop: "8px"
              }}
            >
              {isSubmitting ? "در حال ثبت..." : "ثبت برگشت"}
            </Button>
          </Box>
        </BottomSheet>

        <ToastContainer autoClose={3000} style={{ marginBottom: '76px', borderRadius: "15px" }} position={"bottom-right"} />
      </Box>
    </Suspense>
  );
}

