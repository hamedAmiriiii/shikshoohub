"use client";
import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { apiRequestError } from '@/app/lib/apiRequestError/client';
import tokenCode from '@/app/coponent/tokenCode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TodayIcon from '@mui/icons-material/Today';
import YesterdayIcon from '@mui/icons-material/Event';
import WeekIcon from '@mui/icons-material/DateRange';
import MonthIcon from '@mui/icons-material/CalendarMonth';
import YearIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InventoryIcon from '@mui/icons-material/Inventory';
import UndoIcon from '@mui/icons-material/Undo';

interface ReportData {
  today: {
    total_sales: number;
    total_profit: number;
    total_returns: number;
  };
  yesterday: {
    total_sales: number;
    total_profit: number;
    total_returns: number;
  };
  week: {
    total_sales: number;
    total_profit: number;
    total_returns: number;
  };
  month: {
    total_sales: number;
    total_profit: number;
    total_returns: number;
  };
  last_month: {
    total_sales: number;
    total_profit: number;
    total_returns: number;
  };
  year: {
    total_sales: number;
    total_profit: number;
    total_returns: number;
  };
  products_inventory?: {
    total_purchase_value: number;
    total_sale_value: number;
  };
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('fa-IR').format(num);
};

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportData | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      const token = tokenCode();
      try {
        const res = await apiRequestError("Get", {}, {}, "/api/reports", true, true, token);

        if (res.hasError) {
          const parsedResponse = JSON.parse(res.errorText);
          const readableMessage = parsedResponse.message;
          toast.error(readableMessage || "خطا در دریافت گزارشات");
          return;
        }
        setReports(res);
      } catch (error) {
        toast.error("خطا در دریافت گزارشات");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const getIcon = (title: string) => {
    switch (title) {
      case "امروز":
        return <TodayIcon sx={{ fontSize: "22px" }} />;
      case "دیروز":
        return <YesterdayIcon sx={{ fontSize: "22px" }} />;
      case "هفته جاری":
        return <WeekIcon sx={{ fontSize: "22px" }} />;
      case "ماه جاری":
        return <MonthIcon sx={{ fontSize: "22px" }} />;
      case "ماه گذشته":
        return <MonthIcon sx={{ fontSize: "22px" }} />;
      case "سال جاری":
        return <YearIcon sx={{ fontSize: "22px" }} />;
      default:
        return <TodayIcon sx={{ fontSize: "22px" }} />;
    }
  };

  const getGradient = (title: string) => {
    switch (title) {
      case "امروز":
        return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
      case "دیروز":
        return "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
      case "هفته جاری":
        return "linear-gradient(135deg,rgb(33, 108, 173) 0%,rgb(21, 129, 134) 100%)";
      case "ماه جاری":
        return "linear-gradient(135deg,rgb(15, 112, 47) 0%,rgb(5, 63, 52) 100%)";
      case "ماه گذشته":
        return "linear-gradient(135deg, #fa709a 0%,rgb(119, 105, 24) 100%)";
      case "سال جاری":
        return "linear-gradient(135deg,rgb(17, 109, 109) 0%, #330867 100%)";
      default:
        return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    }
  };

  const gradientCardText = "#ffffff";
  const gradientCardMuted = "rgba(255, 255, 255, 0.85)";

  const ReportCard = ({ title, sales, profit, returns, icon }: { title: string; sales: number; profit: number; returns: number; icon: React.ReactNode }) => {
    const profitPercentage = sales > 0 ? ((profit / sales) * 100).toFixed(1) : 0;

    return (
      <Paper
        elevation={0}
        className="admin-report-gradient-card"
        sx={{
          padding: "17px",
          background: getGradient(title),
          borderRadius: "16px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s ease",
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.12)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 8px 20px rgba(15, 23, 42, 0.18)",
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            right: 0,
            width: "72px",
            height: "72px",
            background: "rgba(255, 255, 255, 0.12)",
            borderRadius: "50%",
            transform: "translate(24px, -24px)",
            pointerEvents: "none",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "58px",
            height: "58px",
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: "50%",
            transform: "translate(-16px, 16px)",
            pointerEvents: "none",
          },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <Typography sx={{ color: gradientCardText, fontSize: "14px", fontWeight: "700", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
              {title}
            </Typography>
            <Box
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: "10px",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: gradientCardText,
                "& .MuiSvgIcon-root": { color: gradientCardText },
              }}
            >
              {icon}
            </Box>
          </Box>

          <Box sx={{ marginBottom: "11px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
              <AttachMoneyIcon sx={{ color: gradientCardText, fontSize: "13px", opacity: 0.95 }} />
              <Typography sx={{ color: gradientCardMuted, fontSize: "9px", fontWeight: "500" }}>
                فروش کل
              </Typography>
            </Box>
            <Typography sx={{ color: gradientCardText, fontSize: "18px", fontWeight: "700", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
              {formatNumber(sales)}
            </Typography>
            <Typography sx={{ color: gradientCardMuted, fontSize: "8px", marginTop: "1px" }}>
              تومان
            </Typography>
          </Box>

          <Box sx={{ marginBottom: "11px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
              <TrendingUpIcon sx={{ color: gradientCardText, fontSize: "13px", opacity: 0.95 }} />
              <Typography sx={{ color: gradientCardMuted, fontSize: "9px", fontWeight: "500" }}>
                سود
              </Typography>
            </Box>
            <Typography sx={{ color: gradientCardText, fontSize: "18px", fontWeight: "700", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
              {formatNumber(profit)}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
              <Typography sx={{ color: gradientCardMuted, fontSize: "8px" }}>
                تومان
              </Typography>
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.22)",
                  borderRadius: "6px",
                  padding: "1px 6px",
                  fontSize: "8px",
                  fontWeight: "600",
                  color: gradientCardText,
                }}
              >
                {profitPercentage}%
              </Box>
            </Box>
          </Box>

          {/* <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
              <UndoIcon sx={{ color: "var(--admin-text)", fontSize: "13px", opacity: 0.9 }} />
              <Typography sx={{ color: "var(--admin-text)", fontSize: "9px", fontWeight: "500" }}>
                برگشت خرید
              </Typography>
            </Box>
            <Typography sx={{ color: "var(--admin-text)", fontSize: "18px", fontWeight: "700", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
              {formatNumber(returns)}
            </Typography>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "8px", marginTop: "1px" }}>
              تومان
            </Typography>
          </Box> */}
        </Box>
      </Paper>
    );
  };

  const totalSales = reports ? 
    reports.today.total_sales + reports.yesterday.total_sales + reports.week.total_sales + 
    reports.month.total_sales + reports.last_month.total_sales + reports.year.total_sales : 0;
  
  const totalProfit = reports ? 
    reports.today.total_profit + reports.yesterday.total_profit + reports.week.total_profit + 
    reports.month.total_profit + reports.last_month.total_profit + reports.year.total_profit : 0;

  return (
    <Box sx={{ width: "100%", direction: "rtl", padding: "16px", paddingBottom: "100px", minHeight: "100vh", background: "var(--admin-bg-gradient)" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        
      </Box>

      {/* Summary Cards */}
      {reports && (
        <>
          <Grid container spacing={2} sx={{ marginBottom: "24px" }}>
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                className="admin-report-gradient-card"
                sx={{
                  padding: "20px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "16px",
                  color: gradientCardText,
                  overflow: "hidden",
                  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
              >
                <Typography sx={{ fontSize: "14px", color: gradientCardMuted, marginBottom: "8px" }}>
                  مجموع فروش
                </Typography>
                <Typography sx={{ fontSize: "32px", fontWeight: "700", color: gradientCardText }}>
                  {formatNumber(reports.month.total_sales)} تومان
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                className="admin-report-gradient-card"
                sx={{
                  padding: "20px",
                  background: "linear-gradient(135deg, #43e97b 0%, rgb(8, 141, 117) 100%)",
                  borderRadius: "16px",
                  color: gradientCardText,
                  overflow: "hidden",
                  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
              >
                <Typography sx={{ fontSize: "14px", color: gradientCardMuted, marginBottom: "8px" }}>
                  مجموع سود
                </Typography>
                <Typography sx={{ fontSize: "32px", fontWeight: "700", color: gradientCardText }}>
                  {formatNumber(reports.month.total_profit)} تومان
                </Typography>
              </Paper>
            </Grid>
          </Grid>

        </>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : reports ? (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <ReportCard
              title="امروز"
              sales={reports.today.total_sales}
              profit={reports.today.total_profit}
              returns={reports.today.total_returns}
              icon={getIcon("امروز")}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ReportCard
              title="دیروز"
              sales={reports.yesterday.total_sales}
              profit={reports.yesterday.total_profit}
              returns={reports.yesterday.total_returns}
              icon={getIcon("دیروز")}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ReportCard
              title="هفته جاری"
              sales={reports.week.total_sales}
              profit={reports.week.total_profit}
              returns={reports.week.total_returns}
              icon={getIcon("هفته جاری")}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ReportCard
              title="ماه جاری"
              sales={reports.month.total_sales}
              profit={reports.month.total_profit}
              returns={reports.month.total_returns}
              icon={getIcon("ماه جاری")}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ReportCard
              title="ماه گذشته"
              sales={reports.last_month.total_sales}
              profit={reports.last_month.total_profit}
              returns={reports.last_month.total_returns}
              icon={getIcon("ماه گذشته")}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ReportCard
              title="سال جاری"
              sales={reports.year.total_sales}
              profit={reports.year.total_profit}
              returns={reports.year.total_returns}
              icon={getIcon("سال جاری")}
            />
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <Typography sx={{ color: "var(--admin-text)", fontSize: "18px" }}>
            داده‌ای برای نمایش وجود ندارد
          </Typography>
        </Box>
      )}

      <ToastContainer autoClose={3000} style={{ marginBottom: '76px', borderRadius: "15px" }} position={"bottom-right"} />
    </Box>
  );
}

