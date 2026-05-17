"use client";
import List from "@/app/coponent/grid/Grid";
import React, { useState, Suspense, useEffect, useMemo, useCallback } from "react";
import { Box, Typography, IconButton, Paper, RadioGroup, FormControlLabel, Radio, Button, TextField } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useRouter } from "next/navigation";
import ExpenseCard from "./expenseCard";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import BottomSheet from "@/app/coponent/BottomSheet";
import BottomSheetModal from "@/app/coponent/BottomSheetModal";
import { apiRequestError } from "@/app/lib/apiRequestError";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/app/coponent/Header';

export default function ListExpenses() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dataFilter, setDataFilter] = useState([]);
  const [dateRange, setDateRange] = useState<any>([]);
  const [filterMode, setFilterMode] = useState<'today' | 'week' | 'month' | 'year' | 'range' | null>(null);
  const [expenseTypeFilter, setExpenseTypeFilter] = useState<'all' | 'جاری' | 'سرمایه'>('all');
  const [openBottomSheet, setOpenBottomSheet] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [editBottomSheet, setEditBottomSheet] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  
  // Form states
  const [type, setType] = useState<"سرمایه" | "جاری">("جاری");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [userName, setUserName] = useState("");

  // Load userName from localStorage on mount
  useEffect(() => {
    let user = JSON.parse(localStorage.getItem('user'))
    
    if (user) {
      setUserName(user.name || '');
    }
  }, []);

  const searchBoxList: any = useMemo(() => [
    { fieldName: "type", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    { fieldName: "title", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    { fieldName: "user_name", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
  ], []);


  const buildUrl = () => {
    let url = "/api/expenses";
    const params: string[] = [];

    // Add expense type filter
    if (expenseTypeFilter !== 'all') {
      params.push(`type=${encodeURIComponent(expenseTypeFilter)}`);
    }

    // Add time filter
    if (filterMode === 'range' && dateRange.length === 2) {
      const from_date = {
        year: dateRange[0].year,
        month: dateRange[0].month.number,
        day: dateRange[0].day,
      };
      const to_date = {
        year: dateRange[1].year,
        month: dateRange[1].month.number,
        day: dateRange[1].day,
      };
      const fromDateStr = encodeURIComponent(JSON.stringify(from_date));
      const toDateStr = encodeURIComponent(JSON.stringify(to_date));
      params.push(`filter=range&from_date=${fromDateStr}&to_date=${toDateStr}`);
    } else if (filterMode === 'today') {
      params.push("filter=today");
    } else if (filterMode === 'week') {
      params.push("filter=week");
    } else if (filterMode === 'month') {
      params.push("filter=month");
    } else if (filterMode === 'year') {
      params.push("filter=year");
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return url;
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
    if (dates.length === 2) {
      setFilterMode('range');
    }
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as 'today' | 'week' | 'month' | 'year' | 'all';
    setFilterMode(value === 'all' ? null : value);
    setDateRange([]);
  };

  const handleExpenseTypeFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExpenseTypeFilter(event.target.value as 'all' | 'جاری' | 'سرمایه');
  };

  const handleClearFilters = () => {
    setDateRange([]);
    setFilterMode(null);
    setExpenseTypeFilter('all');
    setFilterSheetOpen(false);
  };

  const hasFilters = useMemo(() => {
    return expenseTypeFilter !== 'all' || filterMode !== null || dateRange.length > 0;
  }, [expenseTypeFilter, filterMode, dateRange]);

  const FilterComponent = () => (
    <Box sx={{ padding: "16px" }}>
      {/* Expense Type Filter */}
      <Box sx={{ marginBottom: "16px" }}>
        <Typography sx={{ color: "#000", marginBottom: "8px", fontSize: "14px" }}>
          نوع هزینه:
        </Typography>
        <RadioGroup
          row
          value={expenseTypeFilter}
          onChange={handleExpenseTypeFilterChange}
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
            value="جاری"
            control={<Radio sx={{ color: '#1f9ad1', '&.Mui-checked': { color: '#1f9ad1' } }} />}
            label="جاری"
            sx={{ color: "#000" }}
          />
          <FormControlLabel
            value="سرمایه"
            control={<Radio sx={{ color: '#1f9ad1', '&.Mui-checked': { color: '#1f9ad1' } }} />}
            label="سرمایه"
            sx={{ color: "#000" }}
          />
        </RadioGroup>
      </Box>

      {/* Date Range Picker */}
      <Box sx={{ marginBottom: "16px" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <Typography sx={{ color: "#000", fontSize: "14px" }}>
            فیلتر بر اساس تاریخ (از - تا):
          </Typography>
        </Box>
        <DatePicker
          range
          value={dateRange}
          onChange={handleDateRangeChange}
          calendar={persian}
          locale={persian_fa}
          calendarPosition="bottom-center"
          style={{
            height: "50px",
            borderRadius: "15px",
            backgroundColor: "#fff",
            width: "100%"
          }}
          className="rmdp-mobile"
          placeholder="انتخاب بازه تاریخ"
        />
      </Box>

      {/* Time Filter Radio Buttons */}
      <Box sx={{ marginTop: "16px" }}>
        <Typography sx={{ color: "#000", marginBottom: "8px", fontSize: "14px" }}>
          فیلتر زمانی:
        </Typography>
        <RadioGroup
          row
          value={filterMode === 'range' ? 'all' : (filterMode || 'all')}
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
            disabled={dateRange.length === 2}
          />
          <FormControlLabel
            value="today"
            control={<Radio sx={{ color: '#1f9ad1', '&.Mui-checked': { color: '#1f9ad1' } }} />}
            label="روزانه"
            sx={{ color: "#000" }}
            disabled={dateRange.length === 2}
          />
          <FormControlLabel
            value="week"
            control={<Radio sx={{ color: '#1f9ad1', '&.Mui-checked': { color: '#1f9ad1' } }} />}
            label="هفتگی"
            sx={{ color: "#000" }}
            disabled={dateRange.length === 2}
          />
          <FormControlLabel
            value="month"
            control={<Radio sx={{ color: '#1f9ad1', '&.Mui-checked': { color: '#1f9ad1' } }} />}
            label="ماهانه"
            sx={{ color: "#000" }}
            disabled={dateRange.length === 2}
          />
          <FormControlLabel
            value="year"
            control={<Radio sx={{ color: '#1f9ad1', '&.Mui-checked': { color: '#1f9ad1' } }} />}
            label="سالانه"
            sx={{ color: "#000" }}
            disabled={dateRange.length === 2}
          />
        </RadioGroup>
      </Box>

      {/* Clear Filters Button */}
      {hasFilters && (
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

  const filterComponent = useMemo(() => <FilterComponent />, [expenseTypeFilter, dateRange, filterMode]);

  const customActions = useMemo(() => (
    <Box sx={{ display: "flex", gap: "8px", alignItems: "center" }}>
      {hasFilters && (
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
          color: hasFilters ? "#78b568" : "#000",
          backgroundColor: hasFilters ? "rgba(120, 181, 104, 0.2)" : "rgba(255, 255, 255, 0.1)",
          border: "1px solid #C9C9C9",
          "&:hover": {
            backgroundColor: hasFilters ? "rgba(120, 181, 104, 0.3)" : "rgba(255, 255, 255, 0.2)"
          }
        }}
      >
        <FilterListIcon />
      </IconButton>
    </Box>
  ), [hasFilters, handleClearFilters]);

  const handleEditExpense = useCallback((expense: any) => {
    setEditingExpense(expense);
    setType(expense.type || "جاری");
    setTitle(expense.title || "");
    setAmount(formatNumber(expense.amount || 0));
    setUserName(expense.user_name || "");
    setEditBottomSheet(true);
  }, []);

  const CartComponent = useMemo(() => (props: any) => <ExpenseCard props={{ ...props, onEdit: handleEditExpense }} />, [handleEditExpense]);

  const handleOpenBottomSheet = () => {
    setOpenBottomSheet(true);
  };

  const handleCloseBottomSheet = () => {
    setOpenBottomSheet(false);
    // Reset form
    setType("جاری");
    setTitle("");
    setAmount("");
    // Keep userName as it's saved in localStorage
  };

  const handleCloseEditBottomSheet = () => {
    setEditBottomSheet(false);
    setEditingExpense(null);
    // Reset form
    setType("جاری");
    setTitle("");
    setAmount("");
  };

  // Helper function to convert Persian numbers to English and remove all separators
  const cleanAmount = (value: string): string => {
    if (!value) return '';
    // Convert Persian digits to English
    const persianToEnglish: { [key: string]: string } = {
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
      '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
    };
    let cleaned = value.toString();
    // Replace Persian digits
    Object.keys(persianToEnglish).forEach(persian => {
      cleaned = cleaned.replace(new RegExp(persian, 'g'), persianToEnglish[persian]);
    });
    // Remove all separators (English comma, Persian comma, space)
    cleaned = cleaned.replace(/,/g, '').replace(/٬/g, '').replace(/\s/g, '');
    return cleaned;
  };

  const handleSubmitExpense = async () => {
    console.log("userName" , userName);
    
    if (!title.trim() || !amount.trim() || !userName.trim() || !type) {
      toast.error("لطفاً تمام فیلدها را پر کنید");
      return;
    }

    // Clean amount: remove all separators and convert Persian to English
    const cleanedAmount = cleanAmount(amount);
    const amountNum = parseFloat(cleanedAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("مبلغ معتبر نیست");
      return;
    }

    // Save userName to localStorage
    localStorage.setItem('expense_user_name', userName);

    const loadData = {
      user_name: userName.trim(),
      amount: amountNum,
      title: title.trim(),
      type: type
    };

    try {
      const token = localStorage.getItem('token') || '';
      const res = await apiRequestError("Post", {}, loadData, `/api/expenses`, true, true, token);
      if (res.hasError) {
        const errorData = JSON.parse(res.errorText);
        toast.error(errorData.message?.[0]?.title || "خطا در ثبت هزینه");
        return;
      }
      toast.success("هزینه با موفقیت ثبت شد");
      handleCloseBottomSheet();
      // Refresh the list - the key change will trigger a refetch
    } catch (error) {
      toast.error("خطا در ثبت هزینه");
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;
    
    if (!title.trim() || !amount.trim() || !userName.trim() || !type) {
      toast.error("لطفاً تمام فیلدها را پر کنید");
      return;
    }

    // Clean amount: remove all separators and convert Persian to English
    const cleanedAmount = cleanAmount(amount);
    const amountNum = parseFloat(cleanedAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("مبلغ معتبر نیست");
      return;
    }

    // Save userName to localStorage
    localStorage.setItem('expense_user_name', userName);

    const loadData = {
      user_name: userName.trim(),
      amount: amountNum,
      title: title.trim(),
      type: type
    };

    try {
      const token = localStorage.getItem('token') || '';
      const res = await apiRequestError("Put", {}, loadData, `/api/expenses/${editingExpense.id}`, true, true, token);
      if (res.hasError) {
        const errorData = JSON.parse(res.errorText);
        toast.error(errorData.message?.[0]?.title || "خطا در ویرایش هزینه");
        return;
      }
      
      // Update the expense in React Query cache
      const updatedExpense = {
        ...editingExpense,
        ...loadData,
        amount: amountNum.toString(), // Keep as string to match API response format
      };

      // Update infinite query cache (for mobile) - update all matching queries
      queryClient.setQueriesData(
        { 
          predicate: (query) => {
            return query.queryKey[0] === "datas-infinite";
          }
        },
        (oldData: any) => {
          if (!oldData || !oldData.pages) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.map((item: any) =>
                item.id === editingExpense.id ? updatedExpense : item
              ),
            })),
          };
        }
      );

      // Update regular query cache (for desktop) - update all matching queries
      queryClient.setQueriesData(
        { 
          predicate: (query) => {
            return query.queryKey[0] === "datas-desktop";
          }
        },
        (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.map((item: any) =>
              item.id === editingExpense.id ? updatedExpense : item
            ),
          };
        }
      );

      toast.success("هزینه با موفقیت ویرایش شد");
      handleCloseEditBottomSheet();
    } catch (error) {
      toast.error("خطا در ویرایش هزینه");
    }
  };

  const formatNumber = (num: number | string) => {
    const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('fa-IR').format(numValue);
  };

  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <Box sx={{ width: "100%", direction: "rtl", padding: "16px", minHeight: "100vh", paddingBottom: "100px", background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)" }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenBottomSheet}
            sx={{
              backgroundColor: "#78b568",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#5a9a4a"
              },
              borderRadius: "12px",
              padding: "8px 8px"
            }}
          >
            ایجاد هزینه
          </Button>
        </Box>


        {/* List Section */}
        <div style={{ width: "100%", direction: "rtl" }} className="flex-col items-center justify-center">
          <List
            key={`${filterMode}-${expenseTypeFilter}-${dateRange.length > 0 ? dateRange.map((d: any) => `${d.year}-${d.month.number}-${d.day}`).join('-') : ''}`}
            disableFilter={true}
            searchBoxList={searchBoxList}
            filterBoxList={dataFilter}
            CartComponent={CartComponent}
            url={buildUrl()}
            filterComponent={filterComponent}
            showTotal={true}
            customActions={customActions}
          />
        </div>

        {/* Filter Bottom Sheet */}
        <BottomSheetModal 
          open={filterSheetOpen} 
          onClose={() => setFilterSheetOpen(false)}
        >
          <FilterComponent />
        </BottomSheetModal>

        {/* BottomSheet for editing expense */}
        <BottomSheet
          open={editBottomSheet}
          onClose={handleCloseEditBottomSheet}
          title="ویرایش هزینه"
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: "20px", padding: "16px", direction: "rtl" }}>
            {/* Type Radio Buttons - First Field */}
            <Box>
              <Typography sx={{ color: "#fff", marginBottom: "8px", fontSize: "14px" }}>
                نوع هزینه:
              </Typography>
              <RadioGroup
                row
                value={type}
                onChange={(e) => setType(e.target.value as "سرمایه" | "جاری")}
                sx={{
                  justifyContent: 'flex-start',
                  gap: "16px",
                  '& .MuiFormControlLabel-root': {
                    margin: 0,
                  }
                }}
              >
                <FormControlLabel
                  value="سرمایه"
                  control={<Radio sx={{ color: '#78b568', '&.Mui-checked': { color: '#78b568' } }} />}
                  label="سرمایه"
                  sx={{ color: "#fff" }}
                />
                <FormControlLabel
                  value="جاری"
                  control={<Radio sx={{ color: '#78b568', '&.Mui-checked': { color: '#78b568' } }} />}
                  label="جاری"
                  sx={{ color: "#fff" }}
                />
              </RadioGroup>
            </Box>
            <TextField
              label="عنوان هزینه"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              sx={{
                direction: "rtl",
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#1a1d2e",
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
                },
                "& .MuiInputLabel-root": {
                  color: "#fff",
                  right: "14px",
                  left: "auto",
                  transformOrigin: "top right",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#78b568",
                  transform: "translate(-14px, -9px) scale(0.75)",
                },
                "& .MuiInputLabel-shrink": {
                  transform: "translate(-14px, -9px) scale(0.75)",
                },
              }}
            />
            <TextField
              label="مبلغ (تومان)"
              value={amount}
              onChange={(e) => {
                // Accept both English and Persian digits, and remove separators
                let value = e.target.value.replace(/,/g, '').replace(/٬/g, '').replace(/\s/g, '');
                // Convert Persian digits to English for validation
                const persianToEnglish: { [key: string]: string } = {
                  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
                  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
                };
                let cleanedForValidation = value;
                Object.keys(persianToEnglish).forEach(persian => {
                  cleanedForValidation = cleanedForValidation.replace(new RegExp(persian, 'g'), persianToEnglish[persian]);
                });
                // Allow only digits (English or Persian) or empty
                if (/^[\d۰-۹]*$/.test(value) || value === '') {
                  setAmount(value);
                }
              }}
              onBlur={(e) => {
                // Remove all formatting (both English and Persian commas)
                const cleanValue = cleanAmount(e.target.value);
                const numValue = parseFloat(cleanValue);
                if (!isNaN(numValue) && numValue > 0) {
                  setAmount(formatNumber(numValue));
                }
              }}
              onFocus={(e) => {
                // Show raw number when focused for editing
                const cleanValue = cleanAmount(e.target.value);
                const numValue = parseFloat(cleanValue);
                if (!isNaN(numValue) && numValue > 0) {
                  setAmount(cleanValue);
                }
              }}
              fullWidth
              type="text"
              sx={{
                direction: "rtl",
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#1a1d2e",
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
                },
                "& .MuiInputLabel-root": {
                  color: "#fff",
                  right: "14px",
                  left: "auto",
                  transformOrigin: "top right",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#78b568",
                  transform: "translate(-14px, -9px) scale(0.75)",
                },
                "& .MuiInputLabel-shrink": {
                  transform: "translate(-14px, -9px) scale(0.75)",
                },
              }}
            />
            <TextField
              label="نام ثبت کننده"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              fullWidth
              sx={{
                direction: "rtl",
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#1a1d2e",
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
                },
                "& .MuiInputLabel-root": {
                  color: "#fff",
                  right: "14px",
                  left: "auto",
                  transformOrigin: "top right",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#78b568",
                  transform: "translate(-14px, -9px) scale(0.75)",
                },
                "& .MuiInputLabel-shrink": {
                  transform: "translate(-14px, -9px) scale(0.75)",
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleUpdateExpense}
              fullWidth
              sx={{
                backgroundColor: "#78b568",
                color: "#fff",
                padding: "12px",
                fontSize: "16px",
                fontWeight: "600",
                direction: "rtl",
                "&:hover": {
                  backgroundColor: "#5a9a4a"
                },
                marginTop: "8px"
              }}
            >
              ویرایش هزینه
            </Button>
          </Box>
        </BottomSheet>

        {/* BottomSheet for creating expense */}
        <BottomSheet
          open={openBottomSheet}
          onClose={handleCloseBottomSheet}
          title="ایجاد هزینه جدید"
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: "20px", padding: "16px", direction: "rtl" }}>
            {/* Type Radio Buttons - First Field */}
            <Box>
              <Typography sx={{ color: "#fff", marginBottom: "8px", fontSize: "14px" }}>
                نوع هزینه:
              </Typography>
              <RadioGroup
                row
                value={type}
                onChange={(e) => setType(e.target.value as "سرمایه" | "جاری")}
                sx={{
                  justifyContent: 'flex-start',
                  gap: "16px",
                  '& .MuiFormControlLabel-root': {
                    margin: 0,
                  }
                }}
              >
                <FormControlLabel
                  value="سرمایه"
                  control={<Radio sx={{ color: '#78b568', '&.Mui-checked': { color: '#78b568' } }} />}
                  label="سرمایه"
                  sx={{ color: "#fff" }}
                />
                <FormControlLabel
                  value="جاری"
                  control={<Radio sx={{ color: '#78b568', '&.Mui-checked': { color: '#78b568' } }} />}
                  label="جاری"
                  sx={{ color: "#fff" }}
                />
              </RadioGroup>
            </Box>
            <TextField
              label="عنوان هزینه"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              sx={{
                direction: "rtl",
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#1a1d2e",
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
                },
                "& .MuiInputLabel-root": {
                  color: "#fff",
                  right: "14px",
                  left: "auto",
                  transformOrigin: "top right",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#78b568",
                  transform: "translate(-14px, -9px) scale(0.75)",
                },
                "& .MuiInputLabel-shrink": {
                  transform: "translate(-14px, -9px) scale(0.75)",
                },
              }}
            />
            <TextField
              label="مبلغ (تومان)"
              value={amount}
              onChange={(e) => {
                // Accept both English and Persian digits, and remove separators
                let value = e.target.value.replace(/,/g, '').replace(/٬/g, '').replace(/\s/g, '');
                // Convert Persian digits to English for validation
                const persianToEnglish: { [key: string]: string } = {
                  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
                  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
                };
                let cleanedForValidation = value;
                Object.keys(persianToEnglish).forEach(persian => {
                  cleanedForValidation = cleanedForValidation.replace(new RegExp(persian, 'g'), persianToEnglish[persian]);
                });
                // Allow only digits (English or Persian) or empty
                if (/^[\d۰-۹]*$/.test(value) || value === '') {
                  setAmount(value);
                }
              }}
              onBlur={(e) => {
                // Remove all formatting (both English and Persian commas)
                const cleanValue = cleanAmount(e.target.value);
                const numValue = parseFloat(cleanValue);
                if (!isNaN(numValue) && numValue > 0) {
                  setAmount(formatNumber(numValue));
                }
              }}
              onFocus={(e) => {
                // Show raw number when focused for editing
                const cleanValue = cleanAmount(e.target.value);
                const numValue = parseFloat(cleanValue);
                if (!isNaN(numValue) && numValue > 0) {
                  setAmount(cleanValue);
                }
              }}
              fullWidth
              type="text"
              sx={{
                direction: "rtl",
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#1a1d2e",
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
                },
                "& .MuiInputLabel-root": {
                  color: "#fff",
                  right: "14px",
                  left: "auto",
                  transformOrigin: "top right",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#78b568",
                  transform: "translate(-14px, -9px) scale(0.75)",
                },
                "& .MuiInputLabel-shrink": {
                  transform: "translate(-14px, -9px) scale(0.75)",
                },
              }}
            />
            {/* <TextField
              label="نام ثبت کننده"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              fullWidth
              sx={{
                direction: "rtl",
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#1a1d2e",
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
                },
                "& .MuiInputLabel-root": {
                  color: "#fff",
                  right: "14px",
                  left: "auto",
                  transformOrigin: "top right",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#78b568",
                  transform: "translate(-14px, -9px) scale(0.75)",
                },
                "& .MuiInputLabel-shrink": {
                  transform: "translate(-14px, -9px) scale(0.75)",
                },
              }}
            /> */}
            <Button
              variant="contained"
              onClick={handleSubmitExpense}
              fullWidth
              sx={{
                backgroundColor: "#78b568",
                color: "#fff",
                padding: "12px",
                fontSize: "16px",
                fontWeight: "600",
                direction: "rtl",
                "&:hover": {
                  backgroundColor: "#5a9a4a"
                },
                marginTop: "8px"
              }}
            >
              ثبت هزینه
            </Button>
          </Box>
        </BottomSheet>

        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={true}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Box>
    </Suspense>
  );
}

