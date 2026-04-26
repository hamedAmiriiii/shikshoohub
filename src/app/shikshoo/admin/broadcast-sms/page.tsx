"use client";
import React, { useState, useEffect } from "react";
import { Box, Grid, Typography, Button, Checkbox, CircularProgress, Card, CardContent, TextField, IconButton, Chip } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { apiRequestError } from "@/app/lib/apiRequestError";
import tokenCode from "@/app/coponent/tokenCode";

const formatNumber = (num: number | string) => {
  const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(numValue)) return '0';
  return new Intl.NumberFormat('fa-IR').format(numValue);
};

interface Customer {
  phone: string;
  total_purchases: number;
}

export default function BroadcastSMSPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [manualPhones, setManualPhones] = useState<string[]>([]); // شماره‌های دستی
  const [manualPhoneInput, setManualPhoneInput] = useState(""); // ورودی شماره دستی
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allSelected, setAllSelected] = useState(false);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const token = tokenCode();
        const res = await apiRequestError("Get", {}, {}, `/api/customer-broadcast/list`, true, true, token);
        if (res.hasError) {
          toast.error("خطا در دریافت لیست مشتریان");
          return;
        }
        
        // API returns { customers: [...] }
        if (res && res.customers && Array.isArray(res.customers)) {
          setCustomers(res.customers);
        } else {
          setCustomers([]);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("خطا در دریافت لیست مشتریان");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Handle add manual phone
  const handleAddManualPhone = () => {
    const phone = manualPhoneInput.trim();
    
    if (!phone) {
      toast.error("لطفاً شماره تلفن را وارد کنید");
      return;
    }

    // اعتبارسنجی شماره تلفن (شروع با 09 و 11 رقم)
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone)) {
      toast.error("شماره تلفن باید با 09 شروع شود و 11 رقم باشد");
      return;
    }

    // بررسی تکراری نبودن
    if (selectedPhones.includes(phone) || manualPhones.includes(phone)) {
      toast.error("این شماره قبلاً اضافه شده است");
      return;
    }

    // بررسی اینکه در لیست مشتریان نیست
    if (customers.some(c => c.phone === phone)) {
      toast.error("این شماره در لیست مشتریان موجود است");
      return;
    }

    setManualPhones(prev => [...prev, phone]);
    setSelectedPhones(prev => [...prev, phone]);
    setManualPhoneInput("");
    toast.success("شماره با موفقیت اضافه شد");
  };

  // Handle remove manual phone
  const handleRemoveManualPhone = (phone: string) => {
    setManualPhones(prev => prev.filter(p => p !== phone));
    setSelectedPhones(prev => prev.filter(p => p !== phone));
  };

  // Handle select all (only customers from API)
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const customerPhones = customers.map(c => c.phone);
      setSelectedPhones([...customerPhones, ...manualPhones]);
      setAllSelected(true);
    } else {
      // فقط شماره‌های مشتریان را حذف کن، شماره‌های دستی را نگه دار
      setSelectedPhones(manualPhones);
      setAllSelected(false);
    }
  };

  // Handle individual customer selection
  const handleCustomerSelect = (phone: string) => {
    setSelectedPhones(prev => {
      if (prev.includes(phone)) {
        const newSelection = prev.filter(p => p !== phone);
        setAllSelected(newSelection.length === customers.length);
        return newSelection;
      } else {
        const newSelection = [...prev, phone];
        setAllSelected(newSelection.length === customers.length);
        return newSelection;
      }
    });
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (selectedPhones.length === 0) {
      toast.error("لطفاً حداقل یک شماره را انتخاب کنید");
      return;
    }

    if (!message || !message.trim()) {
      toast.error("لطفاً متن پیام را وارد کنید");
      return;
    }

    setIsSubmitting(true);
    const token = tokenCode();

    try {
      // ارسال پیام با حفظ خطوط جدید (TextField multiline به صورت خودکار \n را نگه می‌دارد)
      // ارسال به همه شماره‌های انتخاب شده (مشتریان + دستی)
      const data = {
        message: message,
        phones: selectedPhones
      };

      const res = await apiRequestError("Post", {}, data, `/api/customer-broadcast/message`, true, true, token);
      
      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        const readableMessage = parsedResponse.message || "خطا در ارسال پیام";
        toast.error(readableMessage);
        return;
      }

      toast.success(`پیام با موفقیت برای ${selectedPhones.length} شماره ارسال شد`);
      
      // Reset form (شماره‌های دستی را نگه دار)
      setSelectedPhones(manualPhones);
      setMessage("");
      setAllSelected(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("خطا در ارسال پیام");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", padding: "16px", paddingBottom: "100px", direction: "rtl", background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)" }}>
      {/* Manual Phone Input and Message Input - Side by side on desktop */}
      <Grid container spacing={2} sx={{ marginBottom: "20px" }}>
        {/* Manual Phone Input */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: "#1a1d2e", height: "100%", border: "1px solid #505669" }}>
            <CardContent>
              <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
                افزودن شماره دستی:
              </Typography>
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: "8px", marginBottom: "12px" }}>
                <TextField
                  fullWidth
                  value={manualPhoneInput}
                  onChange={(e) => setManualPhoneInput(e.target.value)}
                  placeholder="09123456789"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddManualPhone();
                    }
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#2b3143",
                      color: "#fff",
                      direction: "ltr",
                      "& fieldset": {
                        borderColor: "#505669",
                      },
                      "&:hover fieldset": {
                        borderColor: "#2196f3",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#2196f3",
                      },
                    },
                    "& .MuiInputBase-input": {
                      textAlign: "left",
                      direction: "ltr",
                      color: "#fff",
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color: "#999",
                      opacity: 1,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddManualPhone}
                  sx={{
                    backgroundColor: "#2196f3",
                    color: "#fff",
                    minWidth: { xs: "100%", sm: "120px" },
                    "&:hover": {
                      backgroundColor: "#1976d2"
                    }
                  }}
                  startIcon={<AddIcon />}
                >
                  افزودن
                </Button>
              </Box>
              {manualPhones.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                  {manualPhones.map((phone) => (
                    <Chip
                      key={phone}
                      label={phone}
                      onDelete={() => handleRemoveManualPhone(phone)}
                      deleteIcon={<DeleteIcon />}
                      sx={{
                        backgroundColor: "#2196f3",
                        color: "#fff",
                        "& .MuiChip-deleteIcon": {
                          color: "#fff",
                          "&:hover": {
                            color: "#ff4444"
                          }
                        }
                      }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Message Input */}
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: "#1a1d2e", height: "100%", border: "1px solid #505669" }}>
            <CardContent>
              <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
                متن پیام:
              </Typography>
              <TextField
                multiline
                rows={6}
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="متن پیام خود را وارد کنید..."
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#2b3143",
                    color: "#fff",
                    direction: "rtl",
                    "& fieldset": {
                      borderColor: "#505669",
                    },
                    "&:hover fieldset": {
                      borderColor: "#78b568",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#78b568",
                    },
                  },
                  "& .MuiInputBase-input": {
                    textAlign: "right",
                    direction: "rtl",
                    color: "#fff",
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "#999",
                    opacity: 1,
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleSendMessage}
                disabled={isSubmitting || selectedPhones.length === 0 || !message.trim()}
                fullWidth
                sx={{
                  backgroundColor: "#78b568",
                  color: "#fff",
                  padding: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  marginTop: "16px",
                  "&:hover": {
                    backgroundColor: "#5a9a4a"
                  },
                  "&:disabled": {
                    backgroundColor: "#505669",
                    color: "#999"
                  }
                }}
              >
                {isSubmitting ? "در حال ارسال..." : `ارسال پیام به ${selectedPhones.length} شماره`}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Customers List */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <CircularProgress sx={{ color: "#ff9100" }} />
        </Box>
      ) : customers.length === 0 ? (
        <Box sx={{ textAlign: "center", padding: "40px" }}>
          <Typography sx={{ color: "#999", fontSize: "18px" }}>
            مشتریی یافت نشد
          </Typography>
        </Box>
      ) : (
        <>
          {/* Select All */}
          <Card sx={{ backgroundColor: "#1a1d2e", marginBottom: "12px", border: "1px solid #505669" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Checkbox
                  checked={allSelected}
                  onChange={handleSelectAll}
                  sx={{
                    color: "#2196f3",
                    "&.Mui-checked": {
                      color: "#2196f3"
                    }
                  }}
                />
                <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: "600" }}>
                  انتخاب همه ({customers.length} مشتری)
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Customers and Manual Phones */}
          <Grid container spacing={2}>
            {/* Manual Phones in List */}
            {manualPhones.map((phone) => (
              <Grid item xs={12} key={`manual-${phone}`}>
                <Card
                  sx={{
                    backgroundColor: "#1a1d2e",
                    border: selectedPhones.includes(phone) ? "2px solid #ff9100" : "1px solid #505669",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      borderColor: "#ff9100",
                      transform: "translateY(-2px)"
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Checkbox
                        checked={selectedPhones.includes(phone)}
                        onChange={() => handleCustomerSelect(phone)}
                        sx={{
                          color: "#ff9100",
                          "&.Mui-checked": {
                            color: "#ff9100"
                          }
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: "600" }}>
                            {phone}
                          </Typography>
                          <Chip
                            label="دستی"
                            size="small"
                            sx={{
                              backgroundColor: "#ff9100",
                              color: "#fff",
                              fontSize: "11px",
                              height: "20px"
                            }}
                          />
                        </Box>
                      </Box>
                      <IconButton
                        onClick={() => handleRemoveManualPhone(phone)}
                        sx={{
                          color: "#ff4444",
                          "&:hover": {
                            backgroundColor: "rgba(255, 68, 68, 0.1)"
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {customers.map((customer, index) => (
              <Grid item xs={12} key={customer.phone || index}>
                <Card
                  sx={{
                    backgroundColor: "#1a1d2e",
                    border: selectedPhones.includes(customer.phone) ? "2px solid #2196f3" : "1px solid #505669",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      borderColor: "#2196f3",
                      transform: "translateY(-2px)"
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Checkbox
                        checked={selectedPhones.includes(customer.phone)}
                        onChange={() => handleCustomerSelect(customer.phone)}
                        sx={{
                          color: "#2196f3",
                          "&.Mui-checked": {
                            color: "#2196f3"
                          }
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: "600" }}>
                            {customer.phone || "بدون شماره"}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                          <Typography sx={{ color: "#999", fontSize: "14px" }}>
                            تعداد خرید: {formatNumber(customer.total_purchases || 0)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <ToastContainer autoClose={3000} style={{ marginBottom: '76px', borderRadius: "15px" }} position={"bottom-right"} />
    </Box>
  );
}
