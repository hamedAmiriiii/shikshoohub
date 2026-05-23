"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo } from "react";
import {
  ensureMediaDevicesGetSupportedConstraints,
  isTorchConstraintSupported,
} from "@/app/lib/mediaDevicesPolyfill";

const BarcodeScanner = dynamic(() => import("react-qr-barcode-scanner"), {
  ssr: false,
  loading: () => null,
});

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

export default function SafeBarcodeScanner({
  torch,
  ...props
}: ScannerProps) {
  useEffect(() => {
    ensureMediaDevicesGetSupportedConstraints();
  }, []);

  const safeTorch = useMemo(() => {
    if (typeof torch !== "boolean") return undefined;
    return isTorchConstraintSupported() ? torch : undefined;
  }, [torch]);

  return <BarcodeScanner {...props} torch={safeTorch} />;
}
