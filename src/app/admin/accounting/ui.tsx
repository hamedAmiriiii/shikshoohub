"use client";

import type { ReactNode } from "react";
import { Box, Container, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { TableCell, TableRow } from "@mui/material";
import { tableCellClasses } from "@mui/material/TableCell";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { adminButtonStartIconSx } from "@/app/admin/theme/adminTheme";

const DATE_Z = 1600;

export const accountingFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontSize: 13,
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)", fontSize: 13 },
  "& .MuiInputBase-input": { py: "8px", fontSize: 13 },
  "& .MuiSelect-icon": { color: "var(--admin-text-muted)" },
} as const;

export const accountingButtonSx = {
  ...adminButtonStartIconSx,
  bgcolor: "var(--admin-accent)",
  color: "#fff",
  "&:hover": { bgcolor: "var(--admin-accent-hover)" },
  "&.Mui-disabled": { bgcolor: "var(--admin-border)", color: "var(--admin-text-muted)" },
} as const;

export const accountingPaginationSx = {
  "& .MuiPaginationItem-root": { color: "var(--admin-text)", fontSize: 12 },
  "& .Mui-selected": {
    backgroundColor: "var(--admin-accent) !important",
    color: "#fff",
  },
} as const;

export const AccountingTableCell = styled(TableCell)({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontWeight: 600,
    fontSize: 12,
    padding: "8px 10px",
    whiteSpace: "nowrap",
  },
  [`&.${tableCellClasses.body}`]: {
    color: "var(--admin-text)",
    fontSize: 12,
    padding: "7px 10px",
    whiteSpace: "nowrap",
  },
});

export const AccountingTableRow = styled(TableRow)({
  backgroundColor: "var(--admin-surface)",
  "&:nth-of-type(even)": { backgroundColor: "var(--admin-surface-alt)" },
  "&:hover": { backgroundColor: "var(--admin-menu-hover)" },
  "&:last-child td, &:last-child th": { border: 0 },
});

export function AccountingPageShell({
  title,
  subtitle,
  actions,
  maxWidth = "lg",
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--admin-bg-gradient)",
        pt: { xs: 1.5, md: 3 },
        pb: { xs: "140px", md: 8 },
        direction: "rtl",
      }}
    >
      <Container maxWidth={maxWidth} sx={{ px: { xs: 1.5, md: 3 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1.5,
            flexWrap: "wrap",
            mb: 2,
          }}
        >
          <Box>
            <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: { xs: 18, md: 22 } }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mt: 0.5 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {actions ? <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>{actions}</Box> : null}
        </Box>
        {children}
      </Container>
      <ToastContainer rtl position="top-center" />
    </Box>
  );
}

export function AccountingJalaliDateField({
  value,
  onChange,
  placeholder = "تاریخ شمسی",
}: {
  value: DateObject | null;
  onChange: (value: DateObject | null) => void;
  placeholder?: string;
}) {
  return (
    <Box
      sx={{
        width: "100%",
        "& .rmdp-wrapper": { width: "100%" },
        "& .rmdp-portal": { zIndex: `${DATE_Z} !important` },
        "& .rmdp-input": {
          width: "100%",
          height: "40px",
          borderRadius: "8px",
          backgroundColor: "var(--admin-surface-alt)",
          border: "1px solid var(--admin-border)",
          color: "var(--admin-text)",
          fontSize: "13px",
          padding: "8px 12px",
          boxSizing: "border-box",
          textAlign: "right",
          direction: "rtl",
        },
        "& .rmdp-input:focus": {
          borderColor: "var(--admin-accent)",
          outline: "none",
        },
      }}
    >
      <DatePicker
        value={value}
        onChange={(next) => onChange(next && !Array.isArray(next) ? (next as DateObject) : null)}
        calendar={persian}
        locale={persian_fa}
        format="YYYY/MM/DD"
        calendarPosition="bottom-right"
        zIndex={DATE_Z}
        containerStyle={{ width: "100%", zIndex: DATE_Z }}
        portal
        placeholder={placeholder}
        className="rmdp-mobile"
        style={{ width: "100%", height: 40, borderRadius: 8, textAlign: "right", direction: "rtl" }}
      />
    </Box>
  );
}
