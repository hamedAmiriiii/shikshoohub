"use client";
import React from "react";
import { Card, CardContent, Typography, Box, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import {
  formatCreditDate,
  formatCreditMoney,
  normalizeInstallmentCredit,
  type InstallmentCreditRow,
} from "./creditRow";

type InstallmentCreditCardProps = {
  props: { data?: unknown };
  onEdit: (row: InstallmentCreditRow) => void;
  onDelete: (row: InstallmentCreditRow) => void;
};

export default function InstallmentCreditCard({ props, onEdit, onDelete }: InstallmentCreditCardProps) {
  const row = normalizeInstallmentCredit(props?.data);

  return (
    <Card
      sx={{
        backgroundColor: "var(--admin-surface-alt)",
        border: "1px solid var(--admin-border)",
        borderRadius: "12px",
        marginBottom: "12px",
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: "var(--admin-accent)",
          transform: "translateY(-2px)",
          boxShadow: "0 4px 12px rgba(120, 181, 104, 0.2)",
        },
      }}
    >
      <CardContent sx={{ padding: { xs: "12px", md: "16px" } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "12px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <CreditCardIcon sx={{ color: "var(--admin-accent)", fontSize: "24px" }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: { xs: "16px", md: "18px" },
                  fontWeight: "600",
                  color: "var(--admin-text)",
                }}
              >
                {row.name || row.phone || "بدون مشخصات"}
              </Typography>
              {row.name && row.phone ? (
                <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", direction: "ltr" }}>
                  {row.phone}
                </Typography>
              ) : null}
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: "4px", flexShrink: 0 }}>
            <IconButton
              onClick={() => onEdit(row)}
              sx={{
                color: "var(--admin-accent)",
                backgroundColor: "var(--admin-menu-hover)",
                padding: "6px",
                "&:hover": { backgroundColor: "rgba(120, 181, 104, 0.2)" },
              }}
              size="small"
            >
              <EditIcon sx={{ fontSize: "18px" }} />
            </IconButton>
            <IconButton
              onClick={() => onDelete(row)}
              sx={{
                color: "#ff4444",
                backgroundColor: "rgba(255, 68, 68, 0.1)",
                padding: "6px",
                "&:hover": { backgroundColor: "rgba(255, 68, 68, 0.2)" },
              }}
              size="small"
            >
              <DeleteIcon sx={{ fontSize: "18px" }} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
          <Box sx={{ backgroundColor: "var(--admin-surface)", borderRadius: "8px", padding: { xs: "10px", md: "12px" } }}>
            <Typography sx={{ fontSize: { xs: "12px", md: "14px" }, color: "var(--admin-text-muted)", marginBottom: "4px" }}>
              اعتبار اقساطی
            </Typography>
            <Typography sx={{ fontSize: { xs: "18px", md: "22px" }, fontWeight: "700", color: "var(--admin-accent)" }}>
              {formatCreditMoney(row.installment_credit)} تومان
            </Typography>
          </Box>
          <Box sx={{ backgroundColor: "var(--admin-surface)", borderRadius: "8px", padding: { xs: "10px", md: "12px" } }}>
            <Typography sx={{ fontSize: { xs: "12px", md: "14px" }, color: "var(--admin-text-muted)", marginBottom: "4px" }}>
              اعتبار عادی
            </Typography>
            <Typography sx={{ fontSize: { xs: "18px", md: "22px" }, fontWeight: "700", color: "#2196f3" }}>
              {formatCreditMoney(row.credit)} تومان
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>تاریخ ایجاد</Typography>
            <Typography sx={{ fontSize: 12, color: "var(--admin-text)" }}>
              {formatCreditDate(row.created_at_jalali || row.created_at)}
            </Typography>
          </Box>
          {(row.updated_at_jalali || row.updated_at) ? (
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>آخرین بروزرسانی</Typography>
              <Typography sx={{ fontSize: 12, color: "var(--admin-text)" }}>
                {formatCreditDate(row.updated_at_jalali || row.updated_at)}
              </Typography>
            </Box>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  );
}
