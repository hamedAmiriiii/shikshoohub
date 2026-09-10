"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Typography } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  type SaleReceiptData,
  type SaleReceiptPrintSettings,
  readSaleReceiptPrintData,
  readSaleReceiptPrintSettings,
  writeSaleReceiptPrintSettings,
  resolvePaperWidthMm,
  DEFAULT_SALE_RECEIPT_PRINT_SETTINGS,
  getEnabledReceiptPrintStations,
  printReceiptStationsSequentially,
} from "@/app/lib/saleReceiptPrint";
import { ReceiptTicketsBlock } from "@/app/admin/print/sale/SaleReceiptTickets";
import { StationPrinterSettings } from "@/app/admin/print/sale/StationPrinterSettings";
import { canSilentPrint, qzErrorMessage, silentPrintReceiptStations } from "@/app/lib/qzSilentPrint";

function SaleReceiptPrintContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [receipt, setReceipt] = useState<SaleReceiptData | null>(null);
  const [settings, setSettings] = useState<SaleReceiptPrintSettings>(DEFAULT_SALE_RECEIPT_PRINT_SETTINGS);
  const [showSettings, setShowSettings] = useState(true);
  const [printing, setPrinting] = useState(false);
  const autoPrintedRef = useRef(false);
  const directPrintMode = searchParams.get("direct") === "1";

  const paperWidthMm = useMemo(() => resolvePaperWidthMm(settings), [settings]);
  const stations = useMemo(() => getEnabledReceiptPrintStations(settings), [settings]);

  useEffect(() => {
    setSettings(readSaleReceiptPrintSettings());
    setReceipt(readSaleReceiptPrintData());
  }, []);

  const handlePrint = useCallback(async () => {
    if (printing || !receipt) return;
    setPrinting(true);
    try {
      if (canSilentPrint(settings)) {
        await silentPrintReceiptStations(receipt, settings);
        return;
      }
      await printReceiptStationsSequentially(getEnabledReceiptPrintStations(settings));
    } catch (error) {
      await printReceiptStationsSequentially(getEnabledReceiptPrintStations(settings));
      console.warn(qzErrorMessage(error));
    } finally {
      setPrinting(false);
    }
  }, [printing, receipt, settings]);

  useEffect(() => {
    if (!receipt || !settings.autoPrint || autoPrintedRef.current) return;
    autoPrintedRef.current = true;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          if (canSilentPrint(settings)) {
            await silentPrintReceiptStations(receipt, settings);
          } else {
            await printReceiptStationsSequentially(getEnabledReceiptPrintStations(settings));
          }
        } catch {
          await printReceiptStationsSequentially(getEnabledReceiptPrintStations(settings));
        }
      })();
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // Intentionally only auto-print once after receipt loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directPrintMode, receipt, settings.autoPrint]);

  const saveSettings = useCallback((partial: Partial<SaleReceiptPrintSettings>) => {
    setSettings((prev) => writeSaleReceiptPrintSettings({ ...prev, ...partial }));
  }, []);

  const printStyles = useMemo(
    () => `
      @page {
        size: ${paperWidthMm}mm auto;
        margin: 0;
      }
      @media print {
        html, body {
          width: ${paperWidthMm}mm;
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
          color: #111 !important;
        }
        .no-print {
          display: none !important;
        }
        .print-preview {
          background: #fff !important;
          border: none !important;
          padding: 0 !important;
          color: #111 !important;
        }
        .print-ticket {
          box-shadow: none !important;
        }
        body[data-print-station="hall"] .print-ticket:not(.print-ticket-hall) {
          display: none !important;
        }
        body[data-print-station="kitchen"] .print-ticket:not(.print-ticket-kitchen) {
          display: none !important;
        }
        body[data-print-station="extra"] .print-ticket:not(.print-ticket-extra) {
          display: none !important;
        }
      }
    `,
    [paperWidthMm],
  );

  if (!receipt) {
    return (
      <Box sx={{ p: 3, textAlign: "center", direction: "rtl" }}>
        <Typography sx={{ mb: 2 }}>اطلاعات فاکتور برای چاپ یافت نشد.</Typography>
        <Button variant="contained" onClick={() => router.push("/admin")}>
          بازگشت
        </Button>
      </Box>
    );
  }

  return (
    <>
      <style>{printStyles}</style>

      <Box sx={{ direction: "rtl", bgcolor: "var(--admin-bg-gradient)", minHeight: "100vh", p: 2, color: "var(--admin-text)" }}>
          <Box sx={{ maxWidth: 820, mx: "auto" }}>
            <Box className="no-print" sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={() => void handlePrint()}
                disabled={printing}
                sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
              >
                {printing ? "در حال چاپ..." : stations.length > 1 ? `چاپ ${stations.length} فیش` : "چاپ فاکتور"}
              </Button>
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => window.close()} sx={{ color: "var(--admin-text)", borderColor: "var(--admin-input-border, var(--admin-border))" }}>
                بستن
              </Button>
              <Button variant="text" onClick={() => setShowSettings((v) => !v)} sx={{ color: "var(--admin-text)" }}>
                {showSettings ? "پنهان کردن تنظیمات" : "تنظیمات چاپ"}
              </Button>
            </Box>

            {canSilentPrint(settings) ? (
              <Typography className="no-print" sx={{ fontSize: 13, color: "var(--admin-accent)", mb: 2 }}>
                چاپ بی‌صدا فعال است؛ فیش هر بخش مستقیم به پرینتر انتخاب‌شده ارسال می‌شود.
              </Typography>
            ) : stations.length > 1 ? (
              <Typography className="no-print" sx={{ fontSize: 13, color: "var(--admin-text-secondary)", mb: 2 }}>
                پرینتر و کاغذ هر فیش را جدا تنظیم کنید.
              </Typography>
            ) : null}

            {showSettings && (
              <Box
                className="no-print"
                sx={{
                  bgcolor: "var(--admin-surface)",
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  border: "1px solid var(--admin-border)",
                  color: "var(--admin-text)",
                  maxWidth: 480,
                }}
              >
                <StationPrinterSettings compact showReceiptToggles settings={settings} onChange={saveSettings} />
              </Box>
            )}

            <Box
              className="print-preview"
              sx={{
                bgcolor: "var(--admin-on-accent)",
                color: "#111",
                borderRadius: 2,
                p: 2,
                border: "1px dashed #ccc",
                overflowX: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <Typography className="no-print" sx={{ fontSize: 12, color: "var(--admin-text-secondary)", textAlign: "center" }}>
                پیش‌نمایش — عرض {paperWidthMm}mm
                {stations.length > 1 ? ` — ${stations.length} فیش` : ""}
              </Typography>
              <ReceiptTicketsBlock receipt={receipt} settings={settings} paperWidthMm={paperWidthMm} />
            </Box>
          </Box>
        </Box>
    </>
  );
}

export default function SaleReceiptPrintPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography>در حال آماده‌سازی فاکتور...</Typography>
        </Box>
      }
    >
      <SaleReceiptPrintContent />
    </Suspense>
  );
}
