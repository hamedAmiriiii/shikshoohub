"use client";
import List from "@/app/coponent/grid/Grid";
import React, { useEffect, useMemo, useState, Suspense } from "react";

import {
  Box,
  Typography,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import Purchas from "./purchas";
import PurchaseSummaryCard from "./PurchaseSummaryCard";
import { PurchaseRowActions } from "./PurchaseRowActions";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import { paymentTypeLabel } from "@/app/lib/paymentTypes";
import {
  ADMIN_POS_SETTINGS_CHANGED_EVENT,
  readAdminPosSettings,
} from "@/app/lib/adminPosSettings";
import { dailyTicketFromRecord, formatDailyTicketNumber } from "@/app/lib/dailyTicketNumber";
import {
  buildPurchasesBulkPrintQuery,
  buildPurchasesListApiUrl,
  purchasesFilterLabel,
} from "@/app/lib/purchaseReceiptPrint";
import { readSaleReceiptPrintSettings } from "@/app/lib/saleReceiptPrint";
import {
  formatPurchaseItemsBreakdown,
  formatPurchaseItemsTotal,
} from "@/app/lib/purchaseListDisplay";

const formatNumber = (num: number | string) => {
    const numValue = typeof num === "string" ? parseFloat(num.replace(/,/g, "")) : num;
    if (isNaN(numValue)) return "—";
    return new Intl.NumberFormat("fa-IR").format(numValue);
};

const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "نامشخص";
    try {
        if (dateString.includes("T")) {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat("fa-IR", {
                year: "numeric",
                month: "2-digit",
                day: "numeric",
            }).format(date);
        }
        return dateString.split(" ")[0];
    } catch {
        return dateString || "نامشخص";
    }
};

export default function ListPurches() {
    const [dataFilter, setDataFilter] = useState([]);
    const [dateRange, setDateRange] = useState<any>([]);
    const [filterMode, setFilterMode] = useState<'today' | 'week' | 'month' | 'range' | null>(null);
    const [draftDateRange, setDraftDateRange] = useState<any>([]);
    const [draftFilterMode, setDraftFilterMode] = useState<'today' | 'week' | 'month' | 'range' | null>(null);
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);
    const [detailsItem, setDetailsItem] = useState<any>(null);
    const [showDailyTicket, setShowDailyTicket] = useState(false);
    const [refreshGrid, setRefreshGrid] = useState(false);

    useEffect(() => {
      const sync = () => setShowDailyTicket(Boolean(readAdminPosSettings().showDailyTicketNumber));
      sync();
      window.addEventListener(ADMIN_POS_SETTINGS_CHANGED_EVENT, sync);
      return () => window.removeEventListener(ADMIN_POS_SETTINGS_CHANGED_EVENT, sync);
    }, []);

    const openDetails = (item: any) => setDetailsItem(item);
    const closeDetails = () => setDetailsItem(null);
    const handleRefresh = () => setRefreshGrid((v) => !v);

    const formatRowNumber = (row?: { index: number; page: number; perPage: number }) => {
        if (!row) return "—";
        const n = (row.page - 1) * row.perPage + row.index + 1;
        return new Intl.NumberFormat("fa-IR").format(n);
    };

    const desktopColumns = useMemo(
        () => [
            {
                label: "ردیف",
                field: (_item: any, row?: { index: number; page: number; perPage: number }) =>
                    formatRowNumber(row),
                width: "44px",
            },
            ...(showDailyTicket
              ? [
                  {
                    label: "فیش",
                    field: (item: any) => {
                      const ticket = dailyTicketFromRecord(item);
                      return ticket != null ? formatDailyTicketNumber(ticket) : "—";
                    },
                    width: "64px",
                  },
                ]
              : []),
            {
                label: "شماره",
                field: (item: any) => (item?.id != null ? `#${item.id}` : "—"),
                width: "72px",
            },
            {
                label: "تاریخ",
                field: (item: any) => formatDate(item?.created_at || item?.createdAt),
                width: "110px",
            },
            {
                label: "تلفن",
                field: (item: any) => item?.phone || "بدون شماره",
                width: "120px",
            },
            {
                label: "پرداخت",
                field: (item: any) =>
                    item?.payment_type_label || paymentTypeLabel(item?.payment_type || "") || "—",
                width: "90px",
            },
            {
                label: "مبلغ",
                field: (item: any) =>
                    item?.total_amount != null ? `${formatNumber(item.total_amount)} تومان` : "—",
            },
            {
                label: "اقلام",
                field: (item: any) => {
                    const total = formatPurchaseItemsTotal(item);
                    const breakdown = formatPurchaseItemsBreakdown(item);
                    if (total === "—") return total;
                    return (
                        <Box component="span" title={breakdown} sx={{ cursor: "help", borderBottom: "1px dotted var(--admin-text-muted)" }}>
                            {total}
                        </Box>
                    );
                },
                width: "72px",
            },
        ],
        [showDailyTicket],
    );
    
    let searchBoxList: any = [
      { fieldName: "phone", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
    ];


    const buildUrl = () => buildPurchasesListApiUrl(filterMode, dateRange);

    const handlePrintAllReceipts = () => {
        const query = buildPurchasesBulkPrintQuery(filterMode, dateRange);
        if (!query) return;
        const direct = readSaleReceiptPrintSettings().autoPrint ? "&direct=1" : "";
        window.open(`/admin/print/sale/bulk?${query}${direct}`, "_blank", "noopener,noreferrer");
    };

    const openFilterSheet = () => {
        setDraftFilterMode(filterMode);
        setDraftDateRange(dateRange);
        setFilterSheetOpen(true);
    };

    const closeFilterSheet = () => {
        setFilterSheetOpen(false);
    };

    const handleDraftDateRangeChange = (dates: any) => {
        setDraftDateRange(dates);
        if (dates.length === 2) {
            setDraftFilterMode("range");
        }
    };

    const handleDraftFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value as "today" | "week" | "month" | "all";
        setDraftFilterMode(value === "all" ? null : value);
        setDraftDateRange([]);
    };

    const handleClearDraftFilters = () => {
        setDraftDateRange([]);
        setDraftFilterMode(null);
    };

    const handleApplyFilters = () => {
        if (draftDateRange.length === 2) {
            setFilterMode("range");
            setDateRange(draftDateRange);
        } else {
            setFilterMode(draftFilterMode === "range" ? null : draftFilterMode);
            setDateRange([]);
        }
        setFilterSheetOpen(false);
    };

    const handleClearFilters = () => {
        setDateRange([]);
        setFilterMode(null);
        setDraftDateRange([]);
        setDraftFilterMode(null);
        setFilterSheetOpen(false);
    };

    const hasActiveFilters = () => filterMode !== null || dateRange.length > 0;

    const hasDraftFilters = () => draftFilterMode !== null || draftDateRange.length > 0;
  
    return (
      <Suspense fallback={<div>در حال بارگذاری...</div>}>
        <Box sx={{ width: "100%", direction: "rtl", padding: "16px", paddingBottom: "100px", minHeight: "100vh", background: "var(--admin-bg-gradient)" }}>
         
  
          {/* List Section */}
          <div style={{ width: "100%", direction: "rtl" }} className="flex-col items-center justify-center">
            <List
              key={`${filterMode}-${dateRange.length > 0 ? dateRange.map((d: any) => `${d.year}-${d.month.number}-${d.day}`).join('-') : ''}`}
              disableFilter={true}
              searchBoxList={searchBoxList}
              filterBoxList={dataFilter}
              CartComponent={(gridProps: any) => (
                <PurchaseSummaryCard
                  data={gridProps.data}
                  rowNumber={gridProps.rowNumber}
                  onOpenDetails={() => openDetails(gridProps.data)}
                />
              )}
              url={buildUrl()}
              filterComponent={null}
              showTotal={true}
              enablePagination={true}
              compactDesktop
              actionsColumnWidth="108px"
              desktopColumns={desktopColumns}
              refreshGrid={refreshGrid}
              hidePrintAction
              onRowClick={openDetails}
              renderRowActions={(item: any) => (
                <PurchaseRowActions item={item} onOpenDetails={openDetails} />
              )}
              customActions={
                <Box sx={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PrintIcon sx={{ fontSize: 18 }} />}
                    disabled={!hasActiveFilters()}
                    title={
                      hasActiveFilters()
                        ? `چاپ همه فیش‌های ${purchasesFilterLabel(filterMode, dateRange)}`
                        : "ابتدا فیلتر تاریخ (روزانه یا بازه) را انتخاب کنید"
                    }
                    onClick={handlePrintAllReceipts}
                    sx={{
                      fontSize: 12,
                      minWidth: 0,
                      px: 1.2,
                      py: 0.5,
                      whiteSpace: "nowrap",
                      color: hasActiveFilters() ? "var(--admin-text)" : "var(--admin-text-muted)",
                      borderColor: "var(--admin-border)",
                    }}
                  >
                    چاپ همه فیش‌ها
                  </Button>
                  {hasActiveFilters() && (
                    <IconButton
                      onClick={handleClearFilters}
                      sx={{
                        color: "var(--admin-error)",
                        backgroundColor: "var(--admin-error-bg)",
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
                    onClick={openFilterSheet}
                    sx={{
                      color: hasActiveFilters() ? "var(--admin-accent)" : "#000",
                      backgroundColor: hasActiveFilters() ? "rgba(120, 181, 104, 0.2)" : "var(--admin-divider)",
                      border: "1px solid #C9C9C9",
                      padding: "7px",
                      borderRadius: "15px",
                      "&:hover": {
                        backgroundColor: hasActiveFilters() ? "rgba(120, 181, 104, 0.3)" : "var(--admin-icon-bg)"
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

          <Dialog
            open={!!detailsItem}
            onClose={closeDetails}
            fullWidth
            maxWidth="md"
            scroll="paper"
            PaperProps={{
              sx: {
                backgroundColor: "var(--admin-surface)",
                borderRadius: "16px",
                direction: "rtl",
                border: "1px solid var(--admin-border)",
                maxHeight: "92vh",
              },
            }}
          >
            <DialogTitle
              sx={{
                color: "var(--admin-text)",
                fontSize: "16px",
                fontWeight: 600,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pb: 1,
              }}
            >
              جزئیات فروش {detailsItem?.id != null ? `#${detailsItem.id}` : ""}
              {showDailyTicket && dailyTicketFromRecord(detailsItem) != null
                ? ` · فیش ${formatDailyTicketNumber(dailyTicketFromRecord(detailsItem) as number)}`
                : ""}
              <IconButton
                onClick={closeDetails}
                size="small"
                sx={{ color: "var(--admin-text-muted)" }}
                aria-label="بستن"
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ px: { xs: 1.5, md: 2 }, pb: 2 }}>
              {detailsItem ? (
                <Purchas
                  props={{
                    data: detailsItem,
                    refreshGrid: handleRefresh,
                    variant: "details",
                  }}
                />
              ) : null}
            </DialogContent>
          </Dialog>

          <Dialog
            open={filterSheetOpen}
            onClose={closeFilterSheet}
            fullWidth
            maxWidth="sm"
            PaperProps={{
              sx: {
                backgroundColor: "var(--admin-surface)",
                borderRadius: "16px",
                direction: "rtl",
                border: "1px solid var(--admin-border)",
              },
            }}
          >
            <DialogTitle
              sx={{
                color: "var(--admin-text)",
                fontSize: "18px",
                fontWeight: 600,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pb: 1,
              }}
            >
              فیلتر خریدها
              <IconButton
                onClick={closeFilterSheet}
                size="small"
                sx={{ color: "var(--admin-text-muted)" }}
                aria-label="بستن"
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box>
                <Box sx={{ marginBottom: "16px" }}>
                  <Typography sx={{ color: "#000", fontSize: "14px", marginBottom: "8px" }}>
                    فیلتر بر اساس تاریخ (از - تا):
                  </Typography>
                  <DatePicker
                    range
                    value={draftDateRange}
                    onChange={handleDraftDateRangeChange}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-center"
                    style={{
                      height: "50px",
                      borderRadius: "15px",
                      backgroundColor: "var(--admin-surface)",
                      width: "100%",
                    }}
                    className="rmdp-mobile"
                    placeholder="انتخاب بازه تاریخ"
                  />
                </Box>

                <Box sx={{ marginTop: "16px" }}>
                  <Typography sx={{ color: "#000", marginBottom: "8px", fontSize: "14px" }}>
                    فیلتر زمانی:
                  </Typography>
                  <RadioGroup
                    row
                    value={draftFilterMode === "range" ? "all" : (draftFilterMode || "all")}
                    onChange={handleDraftFilterChange}
                    sx={{
                      justifyContent: "space-around",
                      "& .MuiFormControlLabel-root": { margin: 0 },
                    }}
                  >
                    <FormControlLabel
                      value="all"
                      control={<Radio sx={{ color: "#1f9ad1", "&.Mui-checked": { color: "#1f9ad1" } }} />}
                      label="همه"
                      sx={{ color: "#000" }}
                      disabled={draftDateRange.length === 2}
                    />
                    <FormControlLabel
                      value="today"
                      control={<Radio sx={{ color: "#1f9ad1", "&.Mui-checked": { color: "#1f9ad1" } }} />}
                      label="روزانه"
                      sx={{ color: "#000" }}
                      disabled={draftDateRange.length === 2}
                    />
                    <FormControlLabel
                      value="week"
                      control={<Radio sx={{ color: "#1f9ad1", "&.Mui-checked": { color: "#1f9ad1" } }} />}
                      label="هفتگی"
                      sx={{ color: "#000" }}
                      disabled={draftDateRange.length === 2}
                    />
                    <FormControlLabel
                      value="month"
                      control={<Radio sx={{ color: "#1f9ad1", "&.Mui-checked": { color: "#1f9ad1" } }} />}
                      label="ماهانه"
                      sx={{ color: "#000" }}
                      disabled={draftDateRange.length === 2}
                    />
                  </RadioGroup>
                </Box>

                {hasDraftFilters() ? (
                  <Box sx={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
                    <Button
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      onClick={handleClearDraftFilters}
                      sx={{
                        color: "var(--admin-error)",
                        borderColor: "var(--admin-error)",
                        "&:hover": {
                          borderColor: "#ff6666",
                          backgroundColor: "var(--admin-error-bg)",
                        },
                      }}
                    >
                      حذف فیلترها
                    </Button>
                  </Box>
                ) : null}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 2, pt: 0, gap: 1, justifyContent: "flex-start" }}>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                sx={{
                  bgcolor: "var(--admin-accent)",
                  "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                  minWidth: 120,
                }}
              >
                تأیید
              </Button>
              <Button variant="outlined" onClick={closeFilterSheet} sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}>
                انصراف
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Suspense>
    );
  }
