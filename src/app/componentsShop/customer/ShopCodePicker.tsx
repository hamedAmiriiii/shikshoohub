"use client";

import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { customerInputSx, customerPaperSx } from "./customerAuthStyles";

type ShopCodePickerProps = {
  onConfirm: (shopCode: string) => void;
};

export default function ShopCodePicker({ onConfirm }: ShopCodePickerProps) {
  const [code, setCode] = useState("");

  return (
    <Paper elevation={0} sx={customerPaperSx}>
      <Typography
        sx={{ mb: 2, fontSize: "15px", color: "#fff", textAlign: "center", lineHeight: 1.7 }}
      >
        برای ورود یا ثبت‌نام، ابتدا کد فروشگاه را وارد کنید (مثلاً milito).
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          value={code}
          onChange={(e) => setCode(e.target.value.trim().toLowerCase())}
          placeholder="کد فروشگاه"
          fullWidth
          sx={customerInputSx}
        />
        <Button
          variant="contained"
          disabled={!code}
          onClick={() => onConfirm(code)}
          fullWidth
          sx={{
            py: "12px",
            borderRadius: "14px",
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: code ? "#78b568" : "#505669",
            "&:hover": { backgroundColor: code ? "#5a9a4a" : "#505669" },
          }}
        >
          ادامه
        </Button>
      </Box>
    </Paper>
  );
}
