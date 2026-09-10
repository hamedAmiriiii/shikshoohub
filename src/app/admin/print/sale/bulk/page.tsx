"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  DEFAULT_LIST_RECEIPT_PRINT_SETTINGS,
  readListReceiptPrintSettings,
  resolvePaperWidthMm,
  type SaleReceiptData,
  type SaleReceiptPrintSettings,
  writeListReceiptPrintSettings,
} from "@/app/lib/saleReceiptPrint";
import { ReceiptTicketsBlock } from "@/app/admin/print/sale/SaleReceiptTickets";
import { StationPrinterSettings } from "@/app/admin/print/sale/StationPrinterSettings";
import {
  buildPurchasesListApiUrl,
  fetchAllPurchases,
  parsePurchasesBulkPrintQuery,
  printAllSaleReceipts,
  purchasesFilterLabel,
  purchasesToSaleReceipts,
} from "@/app/lib/purchaseReceiptPrint";

function BulkSaleReceiptPrintContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoPrintedRef = useRef(false);

  const { filterMode, dateRange } = useMemo(
    () => parsePurchasesBulkPrintQuery(searchParams),
    [searchParams],
  );

  const [settings, setSettings] = useState<SaleReceiptPrintSettings>(DEFAULT_LIST_RECEIPT_PRINT_SETTINGS);
  const [receipts, setReceipts] = useState<SaleReceiptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const paperWidthMm = useMemo(() => resolvePaperWidthMm(settings), [settings]);
  const filterLabel = useMemo(
    () => purchasesFilterLabel(filterMode, dateRange),
    [filterMode, dateRange],
  );

  useEffect(() => {
    setSettings(readListReceiptPrintSettings());
  }, []);

  useEffect(() => {
    if (!filterMode) {
      setLoading(false);
      setError("برای چاپ گروهی، ابتدا در لیست فروش فیلتر تاریخ (مثلاً روزانه یا یک روز خاص) را انتخاب کنید.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const url = buildPurchasesListApiUrl(filterMode, dateRange);
        const purchases = await fetchAllPurchases(url);
        if (cancelled) return;
        const mapped = purchasesToSaleReceipts(purchases);
        setReceipts(mapped);
        if (mapped.length === 0) {
          setError("فروشی برای چاپ در این بازه یافت نشد.");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "خطا در دریافت لیست فروش");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filterMode, dateRange]);

  const handlePrint = useCallback(async () => {
    if (printing || receipts.length === 0) return;
    setPrinting(true);
    try {
      await printAllSaleReceipts(receipts, settings);
    } finally {
      setPrinting(false);
    }
  }, [printing, receipts, settings]);

  useEffect(() => {
    if (loading || error || receipts.length === 0 || autoPrintedRef.current) return;
    if (!settings.autoPrint || searchParams.get("direct") !== "1") return;
    autoPrintedRef.current = true;
    const timer = window.setTimeout(() => {
      void handlePrint();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [loading, error, receipts.length, settings.autoPrint, searchParams, handlePrint]);

  const saveSettings = useCallback((partial: Partial<SaleReceiptPrintSettings>) => {
    setSettings((prev) => writeListReceiptPrintSettings({ ...prev, ...partial }));
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
        .print-receipt-batch-group {
          page-break-after: always;
          break-after: page;
        }
        .print-receipt-batch-group:last-child {
          page-break-after: auto;
          break-after: auto;
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

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center", direction: "rtl" }}>
        <CircularProgress size={32} sx={{ mb: 2 }} />
        <Typography>در حال آماده‌سازی فیش‌ها...</Typography>
      </Box>
    );
  }

  if (error || receipts.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center", direction: "rtl" }}>
        <Typography sx={{ mb: 2 }}>{error || "فروشی برای چاپ یافت نشد."}</Typography>
        <Button variant="contained" onClick={() => router.push("/admin/purchas")}>
          بازگشت به لیست فروش
        </Button>
      </Box>
    );
  }

  return (
    <>
      <style>{printStyles}</style>
      <Box sx={{ direction: "rtl", bgcolor: "var(--admin-bg-gradient)", minHeight: "100vh", p: 2, color: "var(--admin-text)" }}>
        <Box sx={{ maxWidth: 820, mx: "auto" }}>
          <Box className="no-print" sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2, alignItems: "center" }}>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={() => void handlePrint()}
              disabled={printing}
              sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
            >
              {printing ? "در حال چاپ..." : `چاپ ${receipts.length} فیش`}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/admin/purchas")}
              sx={{ color: "var(--admin-text)", borderColor: "var(--admin-input-border, var(--admin-border))" }}
            >
              بازگشت
            </Button>
            <Button variant="text" onClick={() => setShowSettings((v) => !v)} sx={{ color: "var(--admin-text)" }}>
              {showSettings ? "پنهان کردن تنظیمات" : "تنظیمات چاپ"}
            </Button>
          </Box>

          <Typography className="no-print" sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>
            {filterLabel} — {receipts.length} فیش
          </Typography>
          <Typography className="no-print" sx={{ fontSize: 13, color: "var(--admin-text-secondary)", mb: 2 }}>
            فقط فیش سالن — تنظیمات جدا از چاپ لحظه فروش (بدون آشپزخانه/بار).
          </Typography>

          {showSettings ? (
            <Box
              className="no-print"
              sx={{
                bgcolor: "var(--admin-surface)",
                borderRadius: 2,
                p: 2,
                mb: 2,
                border: "1px solid var(--admin-border)",
                maxWidth: 480,
              }}
            >
              <StationPrinterSettings
                compact
                showReceiptToggles
                listMode
                settings={settings}
                onChange={saveSettings}
              />
            </Box>
          ) : null}

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
            {receipts.map((receipt) => (
              <Box
                key={String(receipt.purchaseId ?? receipt.createdAt)}
                className="print-receipt-batch-group"
              >
                <ReceiptTicketsBlock receipt={receipt} settings={settings} paperWidthMm={paperWidthMm} />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default function BulkSaleReceiptPrintPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography>در حال آماده‌سازی...</Typography>
        </Box>
      }
    >
      <BulkSaleReceiptPrintContent />
    </Suspense>
  );
}
