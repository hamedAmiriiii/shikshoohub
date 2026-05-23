"use client";

import { useState } from "react";
import { Box, Collapse, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  COLLECTION_DETAIL_FIELDS,
  getPeriodNumber,
  getSettlementAmount,
  periodHasCollectionDetails,
  type ReportPeriod,
} from "./reportPeriodTypes";

const formatNumber = (num: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(num));

type Props = {
  period: ReportPeriod;
  sales: number;
  mutedColor?: string;
  textColor?: string;
};

export default function ReportPeriodCollectionDetails({
  period,
  sales,
  mutedColor = "rgba(255, 255, 255, 0.85)",
  textColor = "#ffffff",
}: Props) {
  const [open, setOpen] = useState(false);

  if (!periodHasCollectionDetails(period)) return null;

  const settlement = getSettlementAmount(period);
  const salesGap =
    settlement != null && sales > 0 ? sales - settlement : null;
  const hasSettlement = getPeriodNumber(period, "settlement_total") !== null;

  return (
    <Box sx={{ mt: 1, position: "relative", zIndex: 1 }}>
      <Box
        component="button"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          width: "100%",
          border: "none",
          borderRadius: "8px",
          py: 0.5,
          px: 1,
          cursor: "pointer",
          bgcolor: "rgba(255, 255, 255, 0.15)",
          color: textColor,
          fontSize: "11px",
          fontWeight: 600,
          fontFamily: "inherit",
          "&:hover": { bgcolor: "rgba(255, 255, 255, 0.22)" },
        }}
      >
        جزئیات وصول
        <ExpandMoreIcon
          sx={{
            fontSize: 18,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </Box>

      <Collapse in={open}>
        <Box
          sx={{
            mt: 1,
            p: 1,
            borderRadius: "10px",
            bgcolor: "rgba(0, 0, 0, 0.18)",
          }}
        >
          {COLLECTION_DETAIL_FIELDS.map(({ key, label, highlight }) => {
            const value = getPeriodNumber(period, key);
            if (value === null) return null;
            return (
              <Box
                key={key}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                  py: 0.35,
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <Typography
                  sx={{
                    fontSize: highlight ? "10px" : "9px",
                    color: mutedColor,
                    fontWeight: highlight ? 700 : 500,
                  }}
                >
                  {label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: highlight ? "11px" : "10px",
                    color: textColor,
                    fontWeight: highlight ? 700 : 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatNumber(value)}
                </Typography>
              </Box>
            );
          })}

          {salesGap != null && salesGap !== 0 && (
            <Typography
              sx={{
                fontSize: "9px",
                color: mutedColor,
                mt: 0.75,
                pt: 0.5,
                borderTop: "1px dashed rgba(255,255,255,0.15)",
                lineHeight: 1.5,
              }}
            >
              اختلاف فروش با {hasSettlement ? "تسویه" : "وصول"}:{" "}
              {formatNumber(Math.abs(salesGap))}
              {salesGap > 0
                ? " (بیشتر از تسویه/وصول دوره)"
                : " (تسویه بیشتر از فروش ثبت‌شده)"}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
