"use client";

import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import BarcodeScanner from "react-qr-barcode-scanner";
import {
  ensureMediaDevicesGetSupportedConstraints,
  isTorchConstraintSupported,
} from "@/app/lib/mediaDevicesPolyfill";

type ScannerProps = {
  width?: number | string;
  height?: number | string;
  torch?: boolean;
  delay?: number;
  facingMode?: string;
  onUpdate: (err: unknown, result?: unknown) => void;
  onError?: (error: string | DOMException) => void;
  videoConstraints?: MediaTrackConstraints;
  stopStream?: boolean;
};

function ScannerUnavailable({ message }: { message: string }) {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: 120,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        textAlign: "center",
      }}
    >
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", lineHeight: 1.6 }}>
        {message}
      </Typography>
    </Box>
  );
}

class ScannerErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default function SafeBarcodeScanner({
  torch,
  ...props
}: ScannerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    ensureMediaDevicesGetSupportedConstraints();
    setMounted(true);
  }, []);

  const safeTorch = useMemo(() => {
    if (typeof torch !== "boolean") return undefined;
    return isTorchConstraintSupported() ? torch : undefined;
  }, [torch]);

  const offlineFallback = (
    <ScannerUnavailable message="دوربین در حالت آفلاین در دسترس نیست. لطفاً کد را دستی وارد کنید." />
  );

  if (!mounted) return null;

  return (
    <ScannerErrorBoundary fallback={offlineFallback}>
      <BarcodeScanner {...props} torch={safeTorch} />
    </ScannerErrorBoundary>
  );
}
