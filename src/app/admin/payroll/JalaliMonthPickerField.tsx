"use client";

import { Box, Typography } from "@mui/material";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";

const DATE_PICKER_Z_INDEX = 1500;

type JalaliMonthPickerFieldProps = {
  label?: string;
  value: DateObject | null;
  onChange: (value: DateObject | null) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function JalaliMonthPickerField({
  label,
  value,
  onChange,
  placeholder = "انتخاب سال و ماه شمسی",
  disabled = false,
}: JalaliMonthPickerFieldProps) {
  return (
    <Box>
      {label ? (
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 0.5 }}>
          {label}
        </Typography>
      ) : null}
      <Box
        sx={{
          width: "100%",
          "& .rmdp-wrapper": { width: "100%" },
          "& .rmdp-portal": { zIndex: `${DATE_PICKER_Z_INDEX} !important` },
          "& .rmdp-calendar": { zIndex: DATE_PICKER_Z_INDEX },
          "& .rmdp-input": {
            width: "100%",
            height: "40px",
            borderRadius: "8px",
            backgroundColor: "var(--admin-surface-alt)",
            border: "1px solid var(--admin-border)",
            color: "var(--admin-text)",
            fontSize: "14px",
            padding: "8px 12px",
            boxSizing: "border-box",
          },
          "& .rmdp-input:focus": {
            borderColor: "var(--admin-accent)",
            outline: "none",
          },
          "& .rmdp-input:disabled": {
            opacity: 0.6,
          },
        }}
      >
        <DatePicker
          onlyMonthPicker
          value={value}
          onChange={(next) =>
            onChange(next && !Array.isArray(next) ? (next as DateObject) : null)
          }
          calendar={persian}
          locale={persian_fa}
          format="MMMM YYYY"
          calendarPosition="bottom-center"
          zIndex={DATE_PICKER_Z_INDEX}
          containerStyle={{ width: "100%", zIndex: DATE_PICKER_Z_INDEX }}
          portal
          fixMainPosition
          disabled={disabled}
          placeholder={placeholder}
          className="rmdp-mobile"
          style={{
            width: "100%",
            height: "40px",
            borderRadius: "8px",
            backgroundColor: "var(--admin-surface-alt)",
            color: "var(--admin-text)",
          }}
        />
      </Box>
    </Box>
  );
}
