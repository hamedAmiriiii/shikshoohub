"use client";

import { useState } from "react";
import { Box, Button, Container, Paper, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

export default function ReferralLookupPage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  const normalized = token.trim();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--admin-bg-gradient)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        direction: "rtl",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: "18px",
            backgroundColor: "var(--admin-surface-alt)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "22px", mb: 1.5 }}>
            داشبورد معرفی
          </Typography>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px", mb: 2.5 }}>
            شماره کاربر یا توکن اختصاصی را وارد کنید تا آمار معرفی نمایش داده شود.
          </Typography>

          <TextField
            fullWidth
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="مثال: 9123456789"
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "var(--admin-text)",
                backgroundColor: "var(--admin-surface)",
                "& fieldset": { borderColor: "var(--admin-border)" },
                "&:hover fieldset": { borderColor: "var(--admin-accent)" },
                "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
              },
            }}
          />

          <Button
            fullWidth
            variant="contained"
            disabled={!normalized}
            onClick={() => router.push(`/referrals/${encodeURIComponent(normalized)}`)}
            sx={{
              mt: 2,
              py: 1.2,
              borderRadius: "12px",
              backgroundColor: "var(--admin-accent)",
              "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
            }}
          >
            مشاهده آمار
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
