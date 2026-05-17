"use client";
import List from "@/app/coponent/grid/Grid";
import React, { useState, Suspense } from "react";
import { Box, Typography, IconButton, RadioGroup, FormControlLabel, Radio, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, CircularProgress } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import PaymentIcon from '@mui/icons-material/Payment';
import CloseIcon from '@mui/icons-material/Close';
import InstallmentCard from "./installmentCard";
import BottomSheetModal from "@/app/coponent/BottomSheetModal";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";

export default function InstallmentsPage() {
    const [filterMode, setFilterMode] = useState<'all' | 'unpaid' | 'paid'>('unpaid');
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);
    const [payInstallmentDialogOpen, setPayInstallmentDialogOpen] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
    const [installmentNotes, setInstallmentNotes] = useState("");
    const [payingInstallment, setPayingInstallment] = useState(false);
    
    let searchBoxList: any = [
      { fieldName: "phone", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    ];

    const buildUrl = () => {
        let url = "/api/installments/unpaid";
        
        // بر اساس مستندات API، می‌توانیم query parameter اضافه کنیم
        // فعلاً فقط unpaid را پشتیبانی می‌کنیم و بعداً API برای all و paid اضافه می‌شود
        if (filterMode === 'unpaid') {
            url = "/api/installments/unpaid";
        } else if (filterMode === 'paid') {
            // برای اقساط پرداخت شده، فعلاً از unpaid استفاده می‌کنیم
            // بعداً می‌توانیم API دیگری اضافه کنیم
            url = "/api/installments/unpaid?is_paid=1";
        } else if (filterMode === 'all') {
            // برای نمایش همه اقساط، فعلاً از unpaid استفاده می‌کنیم
            // بعداً می‌توانیم API دیگری اضافه کنیم
            url = "/api/installments/unpaid?all=1";
        }
        
        return url;
    };

    const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value as 'all' | 'unpaid' | 'paid';
        setFilterMode(value);
        setFilterSheetOpen(false); // بستن BottomSheet بعد از تغییر فیلتر
    };

    const handleClearFilters = () => {
        setFilterMode('unpaid');
        setFilterSheetOpen(false);
    };

    const hasActiveFilters = () => {
        return filterMode !== 'unpaid';
    };

    const formatNumber = (num: number | string) => {
        const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
        if (isNaN(numValue)) return '';
        return new Intl.NumberFormat('fa-IR').format(numValue);
    };

    const handleOpenPayInstallmentDialog = (installment: any) => {
        setSelectedInstallment(installment);
        setInstallmentNotes("");
        setPayInstallmentDialogOpen(true);
    };

    const handleClosePayInstallmentDialog = () => {
        setPayInstallmentDialogOpen(false);
        setSelectedInstallment(null);
        setInstallmentNotes("");
    };

    const handlePayInstallment = async () => {
        if (!selectedInstallment || !selectedInstallment.purchase_id) return;
        
        setPayingInstallment(true);
        try {
            const response = await FetchWithJwtClient(
                "POST",
                `/api/purchased-products/${selectedInstallment.purchase_id}/installments/${selectedInstallment.id}/pay`,
                {
                    notes: installmentNotes || null
                }
            );
            
            if (response !== null && response.installment) {
                handleClosePayInstallmentDialog();
                // Refresh the list - force reload by changing key
                window.location.reload();
            } else {
                alert("خطا در پرداخت قسط");
            }
        } catch (error) {
            console.error("Error paying installment:", error);
            alert("خطا در پرداخت قسط");
        } finally {
            setPayingInstallment(false);
        }
    };

    const FilterComponent = () => (
        <Box sx={{ padding: "16px" }}>
            <Box sx={{ marginTop: "16px" }}>
                <Typography sx={{ color: "#000", marginBottom: "8px", fontSize: "14px" }}>
                    فیلتر بر اساس وضعیت:
                </Typography>
                <RadioGroup
                    value={filterMode}
                    onChange={handleFilterChange}
                    sx={{ 
                        justifyContent: 'space-around',
                        '& .MuiFormControlLabel-root': {
                            margin: 0,
                        }
                    }}
                >
                    <FormControlLabel 
                        value="all" 
                        control={<Radio sx={{ color: '#1f9ad1', '&.Mui-checked': { color: '#1f9ad1' } }} />} 
                        label="همه" 
                        sx={{ color: "#000" }}
                    />
                    <FormControlLabel 
                        value="unpaid" 
                        control={<Radio sx={{ color: '#1f9ad1', '&.Mui-checked': { color: '#1f9ad1' } }} />} 
                        label="پرداخت نشده" 
                        sx={{ color: "#000" }}
                    />
                    <FormControlLabel 
                        value="paid" 
                        control={<Radio sx={{ color: '#1f9ad1', '&.Mui-checked': { color: '#1f9ad1' } }} />} 
                        label="پرداخت شده" 
                        sx={{ color: "#000" }}
                    />
                </RadioGroup>
            </Box>

            {hasActiveFilters() && (
                <Box sx={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
                    <Button
                        variant="outlined"
                        startIcon={<DeleteIcon />}
                        onClick={handleClearFilters}
                        sx={{
                            color: "#ff4444",
                            borderColor: "#ff4444",
                            "&:hover": {
                                borderColor: "#ff6666",
                                backgroundColor: "rgba(255, 68, 68, 0.1)"
                            }
                        }}
                    >
                        حذف فیلترها
                    </Button>
                </Box>
            )}
        </Box>
    );

    const desktopColumns = [
        {
            label: "شماره قسط",
            field: (item: any) => `قسط ${item.installment_number}`
        },
        {
            label: "وضعیت",
            field: (item: any) => item.is_paid ? "پرداخت شده" : "پرداخت نشده"
        },
        {
            label: "مبلغ",
            field: (item: any) => {
                const numValue = typeof item.amount === 'string' ? parseFloat(item.amount.replace(/,/g, '')) : item.amount;
                return new Intl.NumberFormat('fa-IR').format(numValue) + " تومان";
            }
        },
        {
            label: "تاریخ سررسید",
            field: (item: any) => item.due_date_jalali || "-"
        },
        {
            label: "تاریخ پرداخت",
            field: (item: any) => item.paid_at_jalali || "-"
        },
        {
            label: "شماره تلفن",
            field: (item: any) => item.purchase?.phone || "-"
        },
        {
            label: "شماره خرید",
            field: (item: any) => item.purchase?.id ? `#${item.purchase.id}` : "-"
        }
    ];

    return (
        <Suspense fallback={<div>در حال بارگذاری...</div>}>
            <Box sx={{ width: { xs:"100%", md:"130%" , }, direction: "rtl", padding: "16px", paddingBottom: "100px", minHeight: "100vh", background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)" }}>
                <List
                    key={`${filterMode}`}
                    disableFilter={true}
                    searchBoxList={searchBoxList}
                    filterBoxList={[]}
                    CartComponent={(props: any) => <InstallmentCard props={props} />}
                    url={buildUrl()}
                    filterComponent={<FilterComponent />}
                    showTotal={true}
                    enablePagination={true}
                    desktopColumns={desktopColumns}
                    onPayInstallmentItem={handleOpenPayInstallmentDialog}
                    customActions={
                        <Box sx={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            {hasActiveFilters() && (
                                <IconButton
                                    onClick={handleClearFilters}
                                    sx={{
                                        color: "#ff4444",
                                        backgroundColor: "rgba(255, 68, 68, 0.1)",
                                        "&:hover": {
                                            backgroundColor: "rgba(255, 68, 68, 0.2)"
                                        }
                                    }}
                                    size="small"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            )}
                            <IconButton
                                onClick={() => setFilterSheetOpen(true)}
                                sx={{
                                    color: hasActiveFilters() ? "#78b568" : "#000",
                                    backgroundColor: hasActiveFilters() ? "rgba(120, 181, 104, 0.2)" : "rgba(255, 255, 255, 0.1)",
                                    border: "1px solid #C9C9C9",
                                    padding: "7px",
                                    borderRadius: "15px",
                                    "&:hover": {
                                        backgroundColor: hasActiveFilters() ? "rgba(120, 181, 104, 0.3)" : "rgba(255, 255, 255, 0.2)"
                                    }
                                }}
                                size="small"
                            >
                                <FilterListIcon />
                            </IconButton>
                        </Box>
                    }
                />

                {/* Filter Bottom Sheet */}
                <BottomSheetModal 
                    open={filterSheetOpen} 
                    onClose={() => setFilterSheetOpen(false)}
                >
                    <FilterComponent />
                </BottomSheetModal>

                {/* Dialog تایید پرداخت قسط */}
                <Dialog
                    open={payInstallmentDialogOpen}
                    onClose={handleClosePayInstallmentDialog}
                    PaperProps={{
                        sx: {
                            backgroundColor: "#2b3143",
                            borderRadius: "16px",
                            direction: "rtl",
                            minWidth: "400px",
                        }
                    }}
                >
                    <DialogTitle sx={{ color: "#fff", textAlign: "center", fontSize: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ fontSize: "18px", fontWeight: "600" }}>تایید پرداخت قسط</Typography>
                        <IconButton
                            onClick={handleClosePayInstallmentDialog}
                            sx={{ color: "#fff" }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ color: "#ccc", textAlign: "center", marginBottom: "16px" }}>
                            آیا از پرداخت این قسط مطمئن هستید؟
                        </DialogContentText>
                        {selectedInstallment && (
                            <Box sx={{ 
                                marginBottom: "16px", 
                                padding: "12px", 
                                backgroundColor: "#1a1d2e", 
                                borderRadius: "8px",
                            }}>
                                <Typography sx={{ color: "#fff", fontSize: "14px", marginBottom: "8px" }}>
                                    قسط شماره: {selectedInstallment.installment_number}
                                </Typography>
                                <Typography sx={{ color: "#fff", fontSize: "14px", marginBottom: "8px" }}>
                                    مبلغ: {formatNumber(selectedInstallment.amount)} تومان
                                </Typography>
                                {selectedInstallment.due_date_jalali && (
                                    <Typography sx={{ color: "#999", fontSize: "13px" }}>
                                        تاریخ سررسید: {selectedInstallment.due_date_jalali}
                                    </Typography>
                                )}
                            </Box>
                        )}
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={installmentNotes}
                            onChange={(e) => setInstallmentNotes(e.target.value)}
                            placeholder="یادداشت پرداخت (اختیاری)"
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    backgroundColor: "#1a1d2e",
                                    color: "#fff",
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
                                    color: "#fff",
                                    fontSize: "14px",
                                },
                                "& .MuiInputBase-input::placeholder": {
                                    color: "rgba(255,255,255,0.4)",
                                    opacity: 1
                                },
                            }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: "center", padding: "16px", gap: "12px" }}>
                        <Button 
                            onClick={handleClosePayInstallmentDialog}
                            variant="outlined"
                            sx={{ 
                                color: "#fff", 
                                borderColor: "#666",
                                "&:hover": {
                                    borderColor: "#888",
                                    backgroundColor: "rgba(255,255,255,0.05)"
                                }
                            }}
                            disabled={payingInstallment}
                        >
                            انصراف
                        </Button>
                        <Button 
                            onClick={handlePayInstallment}
                            variant="contained"
                            sx={{ 
                                backgroundColor: "#78b568",
                                "&:hover": {
                                    backgroundColor: "#66a055"
                                }
                            }}
                            disabled={payingInstallment}
                            startIcon={payingInstallment ? <CircularProgress size={16} color="inherit" /> : <PaymentIcon />}
                        >
                            {payingInstallment ? "در حال پرداخت..." : "تایید پرداخت"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Suspense>
    );
}
