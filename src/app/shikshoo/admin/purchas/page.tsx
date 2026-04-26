"use client";
import List from "@/app/coponent/grid/Grid";
import React, { useState, Suspense, useEffect } from "react";

import { Box, Typography, IconButton, Paper, RadioGroup, FormControlLabel, Radio, Button } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from "next/navigation";
import Purchas from "./purchas";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import BottomSheetModal from "@/app/coponent/BottomSheetModal";




export default function ListPurches() {
    const router = useRouter();
    const [dataFilter, setDataFilter] = useState([]);
    const [dateRange, setDateRange] = useState<any>([]);
    const [filterMode, setFilterMode] = useState<'today' | 'week' | 'month' | 'range' | null>(null);
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);
    
    let searchBoxList: any = [
      { fieldName: "phone", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    ];


    const buildUrl = () => {
        let url = "/api/purchased-products";
        
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
            return `${url}?filter=range&from_date=${fromDateStr}&to_date=${toDateStr}`;
        } else if (filterMode === 'today') {
            return `${url}?filter=today`;
        } else if (filterMode === 'week') {
            return `${url}?filter=week`;
        } else if (filterMode === 'month') {
            return `${url}?filter=month`;
        }
        
        // No filter - return base URL
        return url;
    };

    const handleDateRangeChange = (dates: any) => {
        setDateRange(dates);
        if (dates.length === 2) {
            setFilterMode('range');
        }
    };

    const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value as 'today' | 'week' | 'month' | 'all';
        setFilterMode(value === 'all' ? null : value);
        setDateRange([]);
    };

    const handleClearFilters = () => {
        setDateRange([]);
        setFilterMode(null);
        setFilterSheetOpen(false);
    };

    const hasActiveFilters = () => {
        return filterMode !== null || dateRange.length > 0;
    };

    const FilterComponent = () => (
        <Box sx={{ padding: "16px" }}>
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

            {/* Filter Radio Buttons */}
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
                </RadioGroup>
            </Box>

            {/* Clear Filters Button */}
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
  
    return (
      <Suspense fallback={<div>در حال بارگذاری...</div>}>
        <Box sx={{ width: "100%", direction: "rtl", padding: "16px", paddingBottom: "100px", minHeight: "100vh", background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)" }}>
         
  
          {/* List Section */}
          <div style={{ width: "100%", direction: "rtl" }} className="flex-col items-center justify-center">
            <List
              key={`${filterMode}-${dateRange.length > 0 ? dateRange.map((d: any) => `${d.year}-${d.month.number}-${d.day}`).join('-') : ''}`}
              disableFilter={true}
              searchBoxList={searchBoxList}
              filterBoxList={dataFilter}
              CartComponent={(props: any) => <Purchas props={props} />}
              url={buildUrl()}
              filterComponent={<FilterComponent />}
              showTotal={true}
              enablePagination={true}
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
          </div>

          {/* Filter Bottom Sheet */}
          <BottomSheetModal 
            open={filterSheetOpen} 
            onClose={() => setFilterSheetOpen(false)}
            // title="فیلتر خریدها"
          >
            <FilterComponent />
          </BottomSheetModal>
        </Box>
      </Suspense>
    );
  }
