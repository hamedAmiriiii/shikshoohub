"use client";

import { Box, Typography, Tooltip } from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import type { SalesByDaySnapshot } from "@/app/lib/shopSalesByDay";

function shortJalaliLabel(dateJalali: string): string {
  const parts = dateJalali.split("-");
  if (parts.length >= 3) return parts[2];
  return dateJalali.slice(-2) || "—";
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

type Props = {
  data: SalesByDaySnapshot | null;
  formatNumber: (n: number) => string;
};

const CHART_BAR_AREA_PX = { xs: 140, md: 180 } as const;

export default function SalesByDayChart({ data, formatNumber }: Props) {
  const daily = data?.daily ?? [];
  const maxSales = Math.max(1, ...daily.map((d) => d.total_sales));
  const hasData = daily.length > 0;

  const barHeightPx = (sales: number, areaPx: number) => {
    if (sales <= 0) return 4;
    return Math.max(6, Math.round((sales / maxSales) * areaPx));
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: { xs: 280, md: "100%" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: { xs: 1.5, md: 2 } }}>
        <ShowChartIcon sx={{ color: "var(--admin-accent)", fontSize: { xs: 22, md: 26 } }} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: { xs: "15px", md: "17px" } }}>
            فروش ۱۰ روز اخیر
          </Typography>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: { xs: "11px", md: "12px" } }}>
            {data?.from_date_jalali && data?.to_date_jalali
              ? `${data.from_date_jalali} تا ${data.to_date_jalali}`
              : "پس از اولین فروش نمایش داده می‌شود"}
          </Typography>
        </Box>
        {data && (
          <Box sx={{ textAlign: "left" }}>
            <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: { xs: "13px", md: "15px" } }}>
              {formatNumber(data.period_total_sales)}
            </Typography>
            <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "10px" }}>جمع دوره</Typography>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          pt: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: { xs: "4px", md: "6px" },
            height: { xs: CHART_BAR_AREA_PX.xs + 28, md: CHART_BAR_AREA_PX.md + 28 },
            px: 0.5,
          }}
        >
          {hasData ? (
            daily.map((day) => (
              <Tooltip
                key={day.date}
                title={
                  <Box sx={{ textAlign: "right", p: 0.5 }}>
                    <Typography variant="caption" display="block">
                      {day.date_jalali || day.date}
                    </Typography>
                    <Typography variant="caption" display="block">
                      فروش: {formatNumber(day.total_sales)} تومان
                    </Typography>
                    <Typography variant="caption" display="block">
                      {day.purchases_count} فاکتور
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
              >
                <Box
                  sx={{
                    flex: 1,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    minWidth: 0,
                    cursor: "default",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: { xs: 28, md: 40 },
                      height: {
                        xs: `${barHeightPx(day.total_sales, CHART_BAR_AREA_PX.xs)}px`,
                        md: `${barHeightPx(day.total_sales, CHART_BAR_AREA_PX.md)}px`,
                      },
                      flexShrink: 0,
                      borderRadius: "6px 6px 2px 2px",
                      background:
                        day.total_sales > 0
                          ? "linear-gradient(180deg, var(--admin-accent) 0%, var(--admin-accent-hover) 100%)"
                          : "var(--admin-border)",
                      transition: "height 0.35s ease, filter 0.2s ease",
                      "&:hover": {
                        filter: day.total_sales > 0 ? "brightness(1.1)" : "none",
                      },
                    }}
                  />
                  <Typography
                    sx={{
                      color: "var(--admin-text-secondary)",
                      fontSize: { xs: "9px", md: "10px" },
                      mt: 0.75,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    {shortJalaliLabel(day.date_jalali)}
                  </Typography>
                </Box>
              </Tooltip>
            ))
          ) : (
            Array.from({ length: 10 }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 40,
                    height: 12,
                    borderRadius: "6px 6px 2px 2px",
                    backgroundColor: "var(--admin-border)",
                  }}
                />
                <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "10px", mt: 0.75 }}>
                  —
                </Typography>
              </Box>
            ))
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 1,
            pt: 1,
            borderTop: "1px solid var(--admin-border)",
          }}
        >
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "10px" }}>
            بیشترین فروش: {formatCompact(maxSales)}
          </Typography>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "10px" }}>
            خالص فروش (تومان)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
