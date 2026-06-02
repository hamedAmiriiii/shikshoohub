"use client";

import { Box, Container, Link, Typography } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { customerAuthGradient } from "./customerAuthStyles";

type CustomerAuthShellProps = {
  title: string;
  subtitle?: string;
  shopName?: string;
  children: React.ReactNode;
};

export default function CustomerAuthShell({
  title,
  subtitle,
  shopName,
  children,
}: CustomerAuthShellProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: customerAuthGradient,
        padding: { xs: "16px", md: "24px" },
        direction: "rtl",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="xs" sx={{ width: "100%" }}>
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Typography
            variant="h5"
            sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: "20px", md: "24px" } }}
          >
            {title}
          </Typography>
          {shopName ? (
            <Typography sx={{ color: "#78b568", mt: 0.5, fontSize: "15px" }}>
              {shopName}
            </Typography>
          ) : null}
          {subtitle ? (
            <Typography sx={{ color: "rgba(255,255,255,0.65)", mt: 1, fontSize: "13px" }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        {children}

        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", mb: 0.5 }}>
            صاحب فروشگاه یا مدیر هستید؟
          </Typography>
          <Link
            href="/admin/login"
            sx={{
              color: "#78b568",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            ورود به پنل مدیریت فروشگاه
          </Link>
        </Box>
      </Container>
      <ToastContainer position="top-center" rtl />
    </Box>
  );
}
