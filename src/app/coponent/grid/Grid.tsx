"use client";
import React, { ReactNode, useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Box, Grid, LinearProgress, Typography, CircularProgress, Pagination, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip } from "@mui/material";
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import PaletteIcon from '@mui/icons-material/Palette';
import FactoryIcon from '@mui/icons-material/Factory';
import PaymentIcon from '@mui/icons-material/Payment';
import DeleteIcon from '@mui/icons-material/Delete';
import { FetchWithJwtClient } from "../fetchWithJwtClient";
import CustomizedInputBase from "../CustomizedInputBase";
import BottomSheetModal from "../BottomSheetModal";
import { useResponsive } from "../useResponsive";
import { appendProductLabelPrintParams } from "@/app/lib/productLabelPrint";
import { isProducedGoodItem } from "@/app/lib/catalogItems";

// Component to render actions in desktop table
const DesktopActionsCell: React.FC<{
  item: any;
  CartComponent: any;
  onCheck?: any;
  refetch: () => void;
  onEdit?: (item: any) => void;
  onSizeColor?: (item: any) => void;
  onManufacturer?: (item: any) => void;
  onPayInstallment?: (item: any) => void;
  onDelete?: (item: any) => void;
  hidePrint?: boolean;
}> = ({ item, CartComponent, onCheck, refetch, onEdit, onSizeColor, onManufacturer, onPayInstallment, onDelete, hidePrint }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePrint = () => {
    const productId = item?.id;
    // Save product ID to localStorage for scroll back
    if (productId) {
      localStorage.setItem('lastPrintedProductId', productId.toString());
    }
    // Save current page to localStorage
    const currentPage = searchParams.get("page") || "1";
    localStorage.setItem('productListPage', currentPage);
    
    const params = new URLSearchParams({
      name: item?.name || "",
      barcode: item?.barcode || "",
      price: item?.sale_price?.toString() || "",
      quantity: item?.quantity?.toString() || "1",
      from: "list",
    });
    appendProductLabelPrintParams(params, item);
    router.push(`/admin/printCustom?${params.toString()}`);
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
      {onEdit && (
        <Tooltip title={isProducedGoodItem(item) ? "ویرایش در تولید" : "ویرایش"} arrow placement="top">
          <IconButton
            onClick={() => onEdit(item)}
            sx={{
              backgroundColor: "#ff9100",
              color: "#fff",
              "&:hover": { backgroundColor: "#e68100" },
            }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      )}
      {onSizeColor && !isProducedGoodItem(item) && (
        <Tooltip title="سایز و رنگ" arrow placement="top">
          <IconButton
            onClick={() => onSizeColor(item)}
            sx={{
              backgroundColor: "#9c27b0",
              color: "#fff",
              "&:hover": { backgroundColor: "#7b1fa2" },
            }}
          >
            <PaletteIcon />
          </IconButton>
        </Tooltip>
      )}
      {onManufacturer && !isProducedGoodItem(item) && (
        <Tooltip title="تولیدکننده" arrow placement="top">
          <IconButton
            onClick={() => onManufacturer(item)}
            sx={{
              backgroundColor: "#2196f3",
              color: "#fff",
              "&:hover": { backgroundColor: "#1976d2" },
            }}
          >
            <FactoryIcon />
          </IconButton>
        </Tooltip>
      )}
      {onPayInstallment && !item.is_paid && (
        <Tooltip title="پرداخت قسط" arrow placement="top">
          <IconButton
            onClick={() => onPayInstallment(item)}
            sx={{
              backgroundColor: "var(--admin-accent)",
              color: "#fff",
              "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
            }}
          >
            <PaymentIcon />
          </IconButton>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip title="حذف" arrow placement="top">
          <IconButton
            onClick={() => onDelete(item)}
            sx={{
              backgroundColor: "#ff4444",
              color: "#fff",
              "&:hover": { backgroundColor: "#cc0000" },
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )}
      {!hidePrint && (
        <Tooltip title="چاپ برچسب" arrow placement="top">
          <IconButton
            onClick={handlePrint}
            sx={{
              backgroundColor: "var(--admin-accent)",
              color: "#fff",
              "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
            }}
          >
            <PrintIcon />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

interface SearchBoxItem {
  fieldName: string;
  fieldOperation: "MATCH" | "EQUAL" | "DSC" | "ASC";
  fieldValue: string;
  nextConditionOperator: "OR" | "AND";
}

interface DesktopColumn {
  label: string;
  field: string | ((item: any) => ReactNode);
  width?: string | number;
}

interface Props {
  searchBoxList: SearchBoxItem[];
  filterBoxList: SearchBoxItem[];
  filterComponent: ReactNode;
  url: string;
  onCheck?: any;
  onDelete?: any;
  CartComponent?: any;
  refreshData?: () => void;
  refreshGrid?: boolean;
  disableFilter: Boolean | undefined;
  rows?: number;
  textTotal?: any;
  Price?: any;
  showTotal: Boolean | undefined;
  desktopColumns?: DesktopColumn[];
  /** جدول دسکتاپ فشرده: سلول‌ها و ستون عملیات باریک‌تر */
  compactDesktop?: boolean;
  enablePagination?: boolean; // برای فعال کردن pagination بدون desktopColumns
  customActions?: ReactNode; // برای نمایش دکمه‌های اضافی کنار جستجو
  onEditItem?: (item: any) => void; // برای ویرایش آیتم در حالت دسکتاپ
  onSizeColorItem?: (item: any) => void; // برای افزودن سایز و رنگ در حالت دسکتاپ
  onManufacturerItem?: (item: any) => void; // برای تنظیم تولیدکننده در حالت دسکتاپ
  onPayInstallmentItem?: (item: any) => void; // برای پرداخت قسط در حالت دسکتاپ
  onDeleteItem?: (item: any) => void;
  /** ستون عملیات سفارشی دسکتاپ (مثلاً مدیریت فروشگاه‌ها) */
  renderRowActions?: (item: any) => ReactNode;
  onRowClick?: (item: any) => void;
  /** مخفی کردن دکمه چاپ برچسب در ستون عملیات */
  hidePrintAction?: boolean;
}

let totalData = null;

// Function for infinite query (mobile)
async function getdatas(
  { pageParam = 1 }: { pageParam: number },
  searchFilterBoxList: any,
  url: string,
  rows: number = 10
) {
  // Build searchFilterModel from searchBoxList
  let searchFilterModel: any = {};
  if (searchFilterBoxList[1]?.restrictionList && searchFilterBoxList[1].restrictionList.length > 0) {
    searchFilterBoxList[1].restrictionList.forEach((item: any) => {
      if (item.fieldValue && item.fieldValue.trim() !== "") {
        searchFilterModel[item.fieldName] = item.fieldValue;
      }
    });
  }

  // Build URL with searchFilterModel
  const separator = url.includes("?") ? "&" : "?";
  let fullUrl = `${url}${separator}page=${pageParam}`;
  
  // Add searchFilterModel to URL if it has values
  if (Object.keys(searchFilterModel).length > 0) {
    const searchFilterModelStr = encodeURIComponent(JSON.stringify(searchFilterModel));
    fullUrl += `&searchFilterModel=${searchFilterModelStr}`;
  }

  const res = await FetchWithJwtClient("GET", fullUrl, null, {});

  if (!res?.data) {
    throw new Error(" خطا در ارتباط با سرور ");
  }

  totalData = res.total;
  return {
    data: res.data,
    totalPurchasePrice: res.total_purchase_price,
    total: res.total,
    per_page: res.per_page || rows,
    current_page: res.current_page || pageParam,
    last_page: res.last_page,
    next_page_url: res.next_page_url,
  };
}

// Function for regular query (desktop pagination)
async function getdatasDesktop(
  page: number,
  searchFilterBoxList: any,
  url: string,
  rows: number = 10
) {
  // Build searchFilterModel from searchBoxList
  let searchFilterModel: any = {};
  if (searchFilterBoxList[1]?.restrictionList && searchFilterBoxList[1].restrictionList.length > 0) {
    searchFilterBoxList[1].restrictionList.forEach((item: any) => {
      if (item.fieldValue && item.fieldValue.trim() !== "") {
        searchFilterModel[item.fieldName] = item.fieldValue;
      }
    });
  }

  // Build URL with searchFilterModel
  const separator = url.includes("?") ? "&" : "?";
  let fullUrl = `${url}${separator}page=${page}`;
  
  // Add searchFilterModel to URL if it has values
  if (Object.keys(searchFilterModel).length > 0) {
    const searchFilterModelStr = encodeURIComponent(JSON.stringify(searchFilterModel));
    fullUrl += `&searchFilterModel=${searchFilterModelStr}`;
  }

  const res = await FetchWithJwtClient("GET", fullUrl, null, {});

  if (!res?.data) {
    throw new Error(" خطا در ارتباط با سرور ");
  }

  return {
    data: res.data,
    totalPurchasePrice: res.total_purchase_price,
    total: res.total || 0,
  };
}

const List: React.FC<Props> = ({
  filterComponent,
  searchBoxList,
  filterBoxList,
  CartComponent,
  url,
  onCheck,
  onDelete,
  refreshGrid,
  disableFilter,
  Price,
  textTotal = ["", "عدد"],
  rows = 10,
  showTotal = true,
  desktopColumns,
  compactDesktop = false,
  enablePagination = false,
  customActions,
  onEditItem,
  onSizeColorItem,
  onManufacturerItem,
  onPayInstallmentItem,
  onDeleteItem,
  renderRowActions,
  onRowClick,
  hidePrintAction = false,
}) => {
  const compactActionWidth = compactDesktop ? "96px" : "280px";
  const compactCellPad = compactDesktop ? "7px 10px" : "16px 24px";
  const compactFont = compactDesktop ? "12px" : "16px";

  const actionsHeaderCellSx = {
    fontWeight: "600",
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontSize: compactFont,
    padding: compactDesktop ? "7px 8px" : "16px 12px",
    minWidth: compactActionWidth,
    width: compactActionWidth,
    whiteSpace: "nowrap" as const,
    position: "sticky" as const,
    right: 0,
    zIndex: 2,
    boxShadow: "-4px 0 8px -4px rgba(0,0,0,0.12)",
  };

  const actionsBodyCellSx = {
    color: "var(--admin-text)",
    fontSize: compactDesktop ? 12 : 16,
    padding: compactDesktop ? "6px 8px" : "12px",
    minWidth: compactActionWidth,
    width: compactActionWidth,
    position: "sticky" as const,
    right: 0,
    zIndex: 1,
    backgroundColor: "var(--admin-surface)",
    boxShadow: "-4px 0 8px -4px rgba(0,0,0,0.12)",
    ".MuiTableRow-root:nth-of-type(even) &": {
      backgroundColor: "var(--admin-surface-alt)",
    },
    ".MuiTableRow-root:hover &": {
      backgroundColor: "var(--admin-menu-hover)",
    },
  };

  const columnWidthSx = (column: DesktopColumn, idx: number) => {
    if (column.width) {
      return { minWidth: column.width, width: column.width };
    }
    if (!compactDesktop && idx === 0) {
      return { minWidth: "300px", width: "300px" };
    }
    return {};
  };

  const { ref, inView } = useInView();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const query = searchParams.get("query")?.toString() || "";
  const pageParam = searchParams.get("page");
  
  // Detect mobile/desktop
  const isMobile = useResponsive("down", "md");
  const isDesktop = !isMobile && desktopColumns && desktopColumns.length > 0;
  const usePagination = enablePagination || isDesktop;
  
  // Track initial mount to prevent unnecessary resets
  const isInitialMount = useRef(true);
  const prevQueryRef = useRef<string | null>(null);
  
  // For desktop: use regular pagination
  const [desktopPage, setDesktopPage] = useState(() => {
    const initialPage = pageParam ? parseInt(pageParam) : 1;
    return isNaN(initialPage) || initialPage < 1 ? 1 : initialPage;
  });
  
  const [queryState, setQueryState] = useState(() => {
    // Initialize from URL, but don't trigger reset on mount
    return query;
  });
  const [open, setOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);

  const handleOpen = () => {
    if (!disableFilter) {
      setOpen(true);
    }
  };

  const handleClose = () => setOpen(false);

  const deleteItem = (filterBoxList: any) => {
    let arrayTemp: any = [];
    return arrayTemp;
  };

  const deleteEmpty = (searchBoxList: any) => {
    // Return searchBoxList items that have fieldValue
    return searchBoxList.filter((item: any) => item.fieldValue && item.fieldValue.trim() !== "");
  };

  // Merge query from URL with searchBoxList
  const searchBoxListWithQuery = useMemo(() => {
    if (!query || query.trim() === "") {
      return searchBoxList;
    }
    // Create a new array with query applied to all search fields
    return searchBoxList.map((item: any) => ({
      ...item,
      fieldValue: query
    }));
  }, [searchBoxList, query]);

  const searchFilterBoxList = useMemo(() => [
    {
      restrictionList: deleteItem(filterBoxList),
    },
    {
      restrictionList: deleteEmpty(searchBoxListWithQuery),
    },
  ], [filterBoxList, searchBoxListWithQuery]);

  const searchFilterBoxListStr = useMemo(() => JSON.stringify(searchFilterBoxList), [searchFilterBoxList]);

  // Mobile: Infinite query
  const {
    data: datas,
    error: infiniteError,
    fetchNextPage,
    hasNextPage,
    isLoading: infiniteLoading,
    isFetching: infiniteFetching,
    isFetchingNextPage,
    refetch: infiniteRefetch,
  } = useInfiniteQuery({
    queryKey: ["datas-infinite", queryState, url, searchFilterBoxListStr],
    queryFn: ({ pageParam }) =>
      getdatas({ pageParam }, searchFilterBoxList, url, rows),
    enabled: isMobile && !isDesktop && !enablePagination, // Only enable for mobile if pagination is not enabled
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Check if there's a next page using next_page_url or by comparing current_page with last_page
      if (lastPage.next_page_url) {
        return allPages.length + 1;
      }
      if (lastPage.last_page && lastPage.current_page) {
        return lastPage.current_page < lastPage.last_page ? allPages.length + 1 : undefined;
      }
      // Fallback: check if we got a full page of data
      return lastPage.data.length >= (lastPage.per_page || rows) ? allPages.length + 1 : undefined;
    },
  });

  // Desktop: Regular query with pagination
  const {
    data: desktopData,
    error: desktopError,
    isLoading: desktopLoading,
    isFetching: desktopFetching,
    refetch: desktopRefetch,
  } = useQuery({
    queryKey: ["datas-desktop", queryState, url, desktopPage, searchFilterBoxListStr],
    queryFn: () => getdatasDesktop(desktopPage, searchFilterBoxList, url, rows),
    enabled: isDesktop || enablePagination, // Enable for desktop or if pagination is explicitly enabled
  });

  const error = usePagination ? desktopError : infiniteError;
  const isLoading = usePagination ? desktopLoading : infiniteLoading;
  const isFetching = usePagination ? desktopFetching : infiniteFetching;
  const refetch = usePagination ? desktopRefetch : infiniteRefetch;

  // Mark initial mount as complete after first render
  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  // Sync desktop page with URL parameter (only for desktop)
  useEffect(() => {
    if (!isDesktop) return; // Only for desktop mode
    
    const pageFromUrl = searchParams.get("page");
    const urlPageNum = pageFromUrl ? parseInt(pageFromUrl) : 1;
    
    // Only update if URL has a valid page number and it's different from current page
    if (!isNaN(urlPageNum) && urlPageNum > 0 && urlPageNum !== desktopPage) {
      // Only update if this is a real URL change, not initial mount
      if (!isInitialMount.current || urlPageNum !== 1) {
        setDesktopPage(urlPageNum);
      }
    }
  }, [searchParams, isDesktop, desktopPage]);

  // Handle query changes - protect mobile infinite scroll initialization
  useEffect(() => {
    // Skip on initial mount to prevent unnecessary resets
    if (isInitialMount.current) {
      prevQueryRef.current = query;
      return;
    }
    
    const prevQuery = prevQueryRef.current;
    
    // Only update if query actually changed (user typed new search)
    // This prevents resetting when coming back from other pages
    if (prevQuery !== query) {
      setQueryState(query);
      prevQueryRef.current = query;
      
      // Only reset page if query actually changed (not just initial mount)
      if (prevQuery !== null && prevQuery !== query) {
        if (isDesktop) {
          setDesktopPage(1);
          // Update URL to remove page parameter on search
          const params = new URLSearchParams(searchParams.toString());
          params.delete('page');
          const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
          router.push(newUrl);
        }
        // For mobile: infinite query will reset automatically via queryKey change
      }
    }
  }, [query, isDesktop, pathname, router, searchParams]);

  // Refetch when queryState or refreshGrid changes
  useEffect(() => {
    if (queryState !== undefined) {
      setIsPageLoading(true);
      refetch().finally(() => setIsPageLoading(false));
    }
  }, [queryState, refreshGrid, refetch]);

  // Infinite scroll trigger for mobile
  useEffect(() => {
    // Only trigger infinite scroll in mobile mode and if pagination is not enabled
    if (!isMobile || isDesktop || enablePagination) return;
    
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage, isMobile, isDesktop]);

  // Desktop pagination handler
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    if (!usePagination) return;
    
    setDesktopPage(value);
    // Update URL with page parameter
    const params = new URLSearchParams(searchParams.toString());
    if (value === 1) {
      params.delete('page');
    } else {
      params.set('page', value.toString());
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper function to get field value from nested object path or function
  const getFieldValue = (item: any, field: string | ((item: any) => ReactNode)): ReactNode => {
    if (typeof field === 'function') {
      return field(item);
    }
    
    // Handle nested paths like "user.name" or "atelier.name"
    const keys = field.split('.');
    let value: any = item;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined || value === null) break;
    }
    return value ?? '-';
  };

  if (isLoading || isPageLoading) {
    return (
      <Box sx={{ width: "100%", display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Get data based on mode
  const mobileData = datas?.pages?.flatMap(page => page.data) || [];
  const desktopDataArray = desktopData?.data || [];
  const currentData = usePagination ? desktopDataArray : mobileData;
  
  const totalPurchasePrice = usePagination 
    ? desktopData?.totalPurchasePrice 
    : datas?.pages?.[0]?.totalPurchasePrice;
  
  const total = usePagination 
    ? (desktopData?.total || 0)
    : (totalData || 0);
  
  const totalPages = usePagination && total > 0 ? Math.ceil(total / rows) : 0;

  return (
    <Grid
      container
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: isDesktop ? "stretch" : "center",
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
        p: isDesktop ? 0 : 2,
      }}
    >
      <Grid
        item
        xs={12}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          maxWidth: isDesktop ? "100%" : "600px",
          width: "100%",
          mx: isDesktop ? 0 : "auto",
        }}
      >
        <Grid container sx={{ width: "100%", mx: 0 }}>
          <Grid display="flex" item xs={12} sx={{ width: "100%", maxWidth: "100%", mt: 2, gap: 2, boxSizing: "border-box" }}>
            <Grid item xs={12} sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
              <Box sx={{ flex: 1 }}>
                <CustomizedInputBase />
              </Box>
              {customActions && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {customActions}
                </Box>
              )}
              {!disableFilter && (
                <Grid item sx={{ ml: 2, display: { xs: "flex", lg: "none" } }} onClick={handleOpen}>
                  <Image
                    src="/pic/FilterAA.svg"
                    width={51}
                    height={51}
                    alt="Add"
                    style={{
                      cursor: "pointer",
                      marginLeft: "10px",
                      border: "1px solid #C9C9C9",
                      margin: "5px",
                      padding: "7px",
                      borderRadius: "15px",
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </Grid>

          {total && total != 0 && (
            <Grid display="flex" item xs={12} sx={{ width: "100%", maxWidth: "100%", justifyContent: "space-between", mt: 2, boxSizing: "border-box" }}>
              {showTotal && (
                <Box display="flex" flexDirection="column">
                  <Typography sx={{ color: "var(--admin-text)" }}>تعداد کل {textTotal[0]}: {total}{textTotal[1]}</Typography>
                 {Price && <Typography sx={{ mt: 1, fontWeight: "bold", color: "var(--admin-accent)" }}>
                    مجموع مبلغ خرید: {Number(totalPurchasePrice || 0).toLocaleString()} تومان
                  </Typography>}
                </Box>
              )}
            </Grid>
          )}

          <Grid container item xs={12} sx={{ width: "100%", mx: 0, mt: 1, mb: 5 }}>
            {isPageLoading || isLoading ? (
              <Box sx={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", padding: "40px" }}>
                <CircularProgress />
              </Box>
            ) : currentData && currentData.length > 0 ? (
              <>
                {isDesktop ? (
                  // Desktop Table View
                  <>
                    <TableContainer 
                      component={Paper} 
                      sx={{ 
                        width: "100%",
                        maxWidth: "100%",
                        mt: 2,
                        backgroundColor: 'var(--admin-surface)',
                        borderRadius: '16px',
                        border: '1px solid var(--admin-border)',
                        overflowX: 'auto',
                      }}
                    >
                      <Table sx={{ minWidth: compactDesktop ? 560 : 650, direction: "rtl" }} aria-label="simple table">
                        <TableHead>
                          <TableRow>
                            {(CartComponent || renderRowActions) && (
                              <TableCell align="center" sx={actionsHeaderCellSx}>
                                عملیات
                              </TableCell>
                            )}
                            {desktopColumns?.map((column, idx) => (
                              <TableCell 
                                key={idx} 
                                align="right" 
                                sx={{ 
                                  fontWeight: "600",
                                  backgroundColor: "var(--admin-surface-alt)",
                                  color: "var(--admin-text)",
                                  fontSize: compactFont,
                                  padding: compactCellPad,
                                  whiteSpace: "nowrap",
                                  ...columnWidthSx(column, idx),
                                }}
                              >
                                {column.label}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {currentData.map((item: any, index: number) => (
                            <TableRow
                              key={`desktop-${desktopPage}-${index}`}
                              onClick={onRowClick ? () => onRowClick(item) : undefined}
                              sx={{ 
                                backgroundColor: "var(--admin-surface)",
                                cursor: onRowClick ? "pointer" : "default",
                                '&:nth-of-type(even)': {
                                  backgroundColor: "var(--admin-surface-alt)",
                                },
                                '&:hover': {
                                  backgroundColor: "var(--admin-menu-hover)",
                                },
                                '&:last-child td, &:last-child th': { border: 0 } 
                              }}
                            >
                              {(CartComponent || renderRowActions) && (
                                <TableCell
                                  align="center"
                                  sx={actionsBodyCellSx}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {renderRowActions ? (
                                    renderRowActions(item)
                                  ) : (
                                    <DesktopActionsCell 
                                      item={item} 
                                      CartComponent={CartComponent}
                                      onCheck={onCheck} 
                                      refetch={refetch}
                                      onEdit={onEditItem}
                                      onSizeColor={onSizeColorItem}
                                      onManufacturer={onManufacturerItem}
                                      onPayInstallment={onPayInstallmentItem}
                                      onDelete={onDeleteItem}
                                      hidePrint={hidePrintAction}
                                    />
                                  )}
                                </TableCell>
                              )}
                              {desktopColumns?.map((column, colIdx) => (
                                <TableCell 
                                  key={colIdx} 
                                  align="right"
                                  sx={{
                                    color: "var(--admin-text)",
                                    fontSize: compactDesktop ? 12 : 16,
                                    padding: compactCellPad,
                                    whiteSpace: compactDesktop ? "nowrap" : undefined,
                                    ...columnWidthSx(column, colIdx),
                                  }}
                                >
                                  {getFieldValue(item, column.field)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {totalPages > 1 && (
                      <Box sx={{ width: "100%", display: "flex", justifyContent: "center", mt: 4, mb: 2 }}>
                        <Pagination
                          count={totalPages}
                          page={desktopPage}
                          onChange={handlePageChange}
                          color="primary"
                          size="large"
                          sx={{
                            '& .MuiPaginationItem-root': {
                              color: 'var(--admin-text)',
                              '&.Mui-selected': {
                                backgroundColor: 'var(--admin-accent)',
                                color: '#fff',
                              },
                            },
                          }}
                        />
                      </Box>
                    )}
                  </>
                ) : usePagination && !isDesktop ? (
                  // Mobile Card View with Pagination
                  <>
                    {currentData.map((data: any, index: number) => (
                      <Grid sx={{ width: 1 }} key={`pagination-${desktopPage}-${index}`}>
                        <CartComponent
                          onCheck={(id, checked) => onCheck?.(id, checked)}
                          data={data}
                          refreshGrid={() => refetch()}
                          onEdit={onEditItem}
                        />
                      </Grid>
                    ))}
                    {totalPages > 1 && (
                      <Box sx={{ width: "100%", display: "flex", justifyContent: "center", mt: 4, mb: 2 }}>
                        <Pagination
                          count={totalPages}
                          page={desktopPage}
                          onChange={handlePageChange}
                          color="primary"
                          size="large"
                          sx={{
                            '& .MuiPaginationItem-root': {
                              color: 'var(--admin-text)',
                              '&.Mui-selected': {
                                backgroundColor: 'var(--admin-accent)',
                                color: '#fff',
                              },
                            },
                          }}
                        />
                      </Box>
                    )}
                  </>
                ) : (
                  // Mobile Card View with Infinite Scroll
                  <>
                    {datas?.pages?.map((page, pageIndex) =>
                      page.data.map((data, index) => {
                        const key = `mobile-${pageIndex}-${index}`;
                        const isLastItem = pageIndex === datas.pages.length - 1 && index === page.data.length - 1;
                        return (
                          <Grid sx={{ width: 1 }} key={key}>
                            <CartComponent
                              onCheck={(id, checked) => onCheck?.(id, checked)}
                              data={data}
                              refreshGrid={() => refetch()}
                              onEdit={onEditItem}
                            />
                            {isLastItem && hasNextPage && (
                              <Box ref={ref} sx={{ width: "100%", height: "20px" }} />
                            )}
                          </Grid>
                        );
                      })
                    )}
                    {isFetchingNextPage && (
                      <Box sx={{ width: "100%", display: "flex", justifyContent: "center", mt: 2, mb: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    )}
                    {!hasNextPage && currentData.length > 0 && (
                      <Box sx={{ width: "100%", display: "flex", justifyContent: "center", mt: 2, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          همه داده‌ها نمایش داده شد
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </>
            ) : (
              <Box sx={{ width: "100%", display: "flex", justifyContent: "center", padding: "40px" }}>
                <Typography sx={{ color: "var(--admin-text)" }}>موردی یافت نشد</Typography>
              </Box>
            )}
          </Grid>
        </Grid>

        <BottomSheetModal open={open} onClose={handleClose}>
          <Grid>{filterComponent}</Grid>
        </BottomSheetModal>
      </Grid>
    </Grid>
  );
};

export default List;
