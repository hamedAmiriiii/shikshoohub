"use client";

import { Box, Typography } from "@mui/material";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

export default function ProductPurchaseDateField({
  value,
  onChange,
}: {
  value: DateObject | null;
  onChange: (value: DateObject | null) => void;
}) {
  return (
    <Box
      sx={{
        "& .rmdp-input": {
          width: "100%",
          height: 40,
          borderRadius: "10px",
          border: "1px solid var(--admin-border)",
          background: "var(--admin-surface-alt)",
          color: "var(--admin-text)",
          padding: "0 10px",
          fontSize: 13,
        },
      }}
    >
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.4 }}>تاریخ خرید</Typography>
      <DatePicker
        value={value}
        onChange={(date) => onChange(date && !Array.isArray(date) ? (date as DateObject) : null)}
        calendar={persian}
        locale={persian_fa}
        calendarPosition="bottom-right"
        format="YYYY/MM/DD"
        containerStyle={{ width: "100%" }}
        inputClass="rmdp-input"
        placeholder="تاریخ خرید کالا"
      />
    </Box>
  );
}
