"use client";
import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CreditCardIcon from "@mui/icons-material/CreditCard";

interface InstallmentCreditCardProps {
  props: {
    data: {
      phone: string;
      installment_credit?: number;
      credit?: number;
      created_at?: string;
      updated_at?: string;
    };
  };
  onEdit: (credit: any) => void;
  onDelete: (phone: string) => void;
}

export default function InstallmentCreditCard({ props, onEdit, onDelete }: InstallmentCreditCardProps) {
  const { data } = props;

  const formatNumber = (num: number | string) => {
    const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
    if (isNaN(numValue)) return '0';
    return new Intl.NumberFormat('fa-IR').format(numValue);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "بدون تاریخ";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <Card
      sx={{
        backgroundColor: "#1a1d2e",
        border: "1px solid #505669",
        borderRadius: "12px",
        marginBottom: "12px",
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: "#78b568",
          transform: "translateY(-2px)",
          boxShadow: "0 4px 12px rgba(120, 181, 104, 0.2)",
        },
      }}
    >
      <CardContent sx={{ padding: { xs: "12px", md: "16px" } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "12px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CreditCardIcon sx={{ color: "#78b568", fontSize: "24px" }} />
            <Typography
              sx={{
                fontSize: { xs: "16px", md: "18px" },
                fontWeight: "600",
                color: "#fff",
              }}
            >
              {data.phone || "بدون شماره"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: "4px" }}>
            <IconButton
              onClick={() => onEdit(data)}
              sx={{
                color: "#78b568",
                backgroundColor: "rgba(120, 181, 104, 0.1)",
                padding: "6px",
                "&:hover": {
                  backgroundColor: "rgba(120, 181, 104, 0.2)",
                },
              }}
              size="small"
            >
              <EditIcon sx={{ fontSize: "18px" }} />
            </IconButton>
            <IconButton
              onClick={() => onDelete(data.phone)}
              sx={{
                color: "#ff4444",
                backgroundColor: "rgba(255, 68, 68, 0.1)",
                padding: "6px",
                "&:hover": {
                  backgroundColor: "rgba(255, 68, 68, 0.2)",
                },
              }}
              size="small"
            >
              <DeleteIcon sx={{ fontSize: "18px" }} />
            </IconButton>
          </Box>
        </Box>

        {/* Credit Amounts */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          {/* Installment Credit */}
          <Box
            sx={{
              backgroundColor: "#2b3143",
              borderRadius: "8px",
              padding: { xs: "10px", md: "12px" },
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: "12px", md: "14px" },
                color: "rgba(255,255,255,0.7)",
                marginBottom: "4px",
              }}
            >
              اعتبار اقساطی (تومان)
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "18px", md: "22px" },
                fontWeight: "700",
                color: "#78b568",
              }}
            >
              {formatNumber(data.installment_credit || 0)} تومان
            </Typography>
          </Box>

          {/* Regular Credit */}
          <Box
            sx={{
              backgroundColor: "#2b3143",
              borderRadius: "8px",
              padding: { xs: "10px", md: "12px" },
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: "12px", md: "14px" },
                color: "rgba(255,255,255,0.7)",
                marginBottom: "4px",
              }}
            >
              اعتبار عادی (تومان)
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "18px", md: "22px" },
                fontWeight: "700",
                color: "#2196f3",
              }}
            >
              {formatNumber(data.credit || 0)} تومان
            </Typography>
          </Box>
        </Box>

        {/* Dates */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {data.created_at && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: "11px", md: "12px" },
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                تاریخ ایجاد:
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: "11px", md: "12px" },
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                {formatDate(data.created_at)}
              </Typography>
            </Box>
          )}
          {data.updated_at && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: "11px", md: "12px" },
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                آخرین بروزرسانی:
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: "11px", md: "12px" },
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                {formatDate(data.updated_at)}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

