"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Divider,
  Slider,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  type SaleReceiptData,
  type SaleReceiptPrintSettings,
  RECEIPT_PAPER_PRESETS,
  readSaleReceiptPrintData,
  readSaleReceiptPrintSettings,
  writeSaleReceiptPrintSettings,
  resetSaleReceiptPrintSettings,
  resolvePaperWidthMm,
  DEFAULT_SALE_RECEIPT_PRINT_SETTINGS,
  getEnabledReceiptPrintStations,
  printReceiptStationsSequentially,
} from "@/app/lib/saleReceiptPrint";
import { ReceiptTicketsBlock } from "@/app/admin/print/sale/SaleReceiptTickets";
import { StationPrinterSettings } from "@/app/admin/print/sale/StationPrinterSettings";
import { canSilentPrint, qzErrorMessage, silentPrintReceiptStations } from "@/app/lib/qzSilentPrint";

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ gridColumn: "1 / -1" }}>
      <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1, color: "#333" }}>{title}</Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function SaleReceiptPrintContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [receipt, setReceipt] = useState<SaleReceiptData | null>(null);
  const [settings, setSettings] = useState<SaleReceiptPrintSettings>(DEFAULT_SALE_RECEIPT_PRINT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
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
        if (!cancelled && directPrintMode) {
          window.setTimeout(() => window.close(), 400);
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

  const handleResetSettings = useCallback(() => {
    setSettings(resetSaleReceiptPrintSettings());
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
        }
        .no-print {
          display: none !important;
        }
        .print-only {
          display: block !important;
        }
        .print-ticket {
          width: ${paperWidthMm}mm !important;
          max-width: ${paperWidthMm}mm !important;
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

      {!directPrintMode && (
        <Box className="no-print" sx={{ direction: "rtl", bgcolor: "#f3f4f6", minHeight: "100vh", p: 2 }}>
          <Box sx={{ maxWidth: 820, mx: "auto" }}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={() => void handlePrint()}
                disabled={printing}
                sx={{ bgcolor: "#78b568", "&:hover": { bgcolor: "#5a9a4a" } }}
              >
                {printing ? "در حال چاپ..." : stations.length > 1 ? `چاپ ${stations.length} فیش` : "چاپ فاکتور"}
              </Button>
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => window.close()}>
                بستن
              </Button>
              <Button variant="text" onClick={() => setShowSettings((v) => !v)}>
                {showSettings ? "پنهان کردن تنظیمات" : "تنظیمات چاپ"}
              </Button>
            </Box>

            {canSilentPrint(settings) ? (
              <Typography sx={{ fontSize: 13, color: "#166534", mb: 2 }}>
                چاپ بی‌صدا فعال است؛ فیش هر بخش مستقیم به پرینتر انتخاب‌شده ارسال می‌شود.
              </Typography>
            ) : stations.length > 1 ? (
              <Typography sx={{ fontSize: 13, color: "#555", mb: 2 }}>
                پرینتر هر بخش را در تنظیمات انتخاب کنید تا بدون پنجره چاپ ارسال شود. تا آن زمان برای هر فیش پنجره چاپ باز می‌شود.
              </Typography>
            ) : null}

            {showSettings && (
              <Box
                sx={{
                  bgcolor: "#fff",
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  border: "1px solid #e0e0e0",
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                }}
              >
                <Typography sx={{ gridColumn: "1 / -1", fontWeight: 700, fontSize: 16 }}>تنظیمات چاپ فاکتور</Typography>

                <SettingsSection title="ایستگاه‌های چاپ">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.printHall !== false}
                        onChange={(e) => saveSettings({ printHall: e.target.checked })}
                      />
                    }
                    label="فیش سالن (با قیمت)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(settings.printKitchen)}
                        onChange={(e) => saveSettings({ printKitchen: e.target.checked })}
                      />
                    }
                    label="فیش آشپزخانه (بدون قیمت)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(settings.printExtra)}
                        onChange={(e) => saveSettings({ printExtra: e.target.checked })}
                      />
                    }
                    label="فیش سوم (بار / سردخانه)"
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label="عنوان فیش آشپزخانه"
                    value={settings.kitchenTitle}
                    onChange={(e) => saveSettings({ kitchenTitle: e.target.value })}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label="عنوان فیش سوم"
                    value={settings.extraTitle}
                    onChange={(e) => saveSettings({ extraTitle: e.target.value })}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.silentPrint !== false}
                        onChange={(e) => saveSettings({ silentPrint: e.target.checked })}
                      />
                    }
                    label="ارسال مستقیم به پرینتر انتخاب‌شده (بدون سؤال)"
                  />
                  <StationPrinterSettings settings={settings} onChange={saveSettings} />
                </SettingsSection>

                <Divider sx={{ gridColumn: "1 / -1" }} />

                <SettingsSection title="عرض و اندازه کاغذ">
                  <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                    <Typography sx={{ fontSize: 13, mb: 0.5 }}>نوع / عرض کاغذ</Typography>
                    <Select
                      size="small"
                      fullWidth
                      value={settings.paperPreset}
                      onChange={(e) =>
                        saveSettings({
                          paperPreset: e.target.value as SaleReceiptPrintSettings["paperPreset"],
                        })
                      }
                    >
                      {RECEIPT_PAPER_PRESETS.map((preset) => (
                        <MenuItem key={preset.id} value={preset.id}>
                          {preset.label}
                          {preset.hint ? ` — ${preset.hint}` : ""}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>

                  {settings.paperPreset === "custom" && (
                    <Box>
                      <Typography sx={{ fontSize: 13, mb: 0.5 }}>عرض سفارشی (40 تا 220 میلی‌متر)</Typography>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={settings.customPaperWidthMm}
                        inputProps={{ min: 40, max: 220 }}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          if (!Number.isNaN(value)) saveSettings({ customPaperWidthMm: value });
                        }}
                      />
                    </Box>
                  )}

                  <Box>
                    <Typography sx={{ fontSize: 13, mb: 0.5 }}>حاشیه داخلی (mm)</Typography>
                    <Slider
                      size="small"
                      value={settings.paddingMm}
                      min={0}
                      max={12}
                      step={1}
                      valueLabelDisplay="auto"
                      onChange={(_, value) => saveSettings({ paddingMm: value as number })}
                    />
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography sx={{ fontSize: 13, color: "#666" }}>
                      عرض مؤثر چاپ: <strong>{paperWidthMm}mm</strong>
                    </Typography>
                  </Box>
                </SettingsSection>

                <Divider sx={{ gridColumn: "1 / -1" }} />

                <SettingsSection title="ظاهر متن">
                  <Box>
                    <Typography sx={{ fontSize: 13, mb: 0.5 }}>اندازه فونت متن ({settings.fontSize}px)</Typography>
                    <Slider
                      size="small"
                      value={settings.fontSize}
                      min={8}
                      max={18}
                      step={1}
                      valueLabelDisplay="auto"
                      onChange={(_, value) => saveSettings({ fontSize: value as number })}
                    />
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: 13, mb: 0.5 }}>اندازه عنوان ({settings.titleFontSize}px)</Typography>
                    <Slider
                      size="small"
                      value={settings.titleFontSize}
                      min={10}
                      max={22}
                      step={1}
                      valueLabelDisplay="auto"
                      onChange={(_, value) => saveSettings({ titleFontSize: value as number })}
                    />
                  </Box>

                  <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                    <Typography sx={{ fontSize: 13, mb: 0.5 }}>فاصله خطوط ({settings.lineHeight.toFixed(1)})</Typography>
                    <Slider
                      size="small"
                      value={settings.lineHeight}
                      min={1.1}
                      max={2.2}
                      step={0.1}
                      valueLabelDisplay="auto"
                      onChange={(_, value) => saveSettings({ lineHeight: value as number })}
                    />
                  </Box>
                </SettingsSection>

                <Divider sx={{ gridColumn: "1 / -1" }} />

                <SettingsSection title="محتوای فاکتور">
                  <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                    <Typography sx={{ fontSize: 13, mb: 0.5 }}>عنوان فروشگاه روی فاکتور</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      value={settings.shopTitle}
                      placeholder="نام فروشگاه"
                      onChange={(e) => saveSettings({ shopTitle: e.target.value })}
                    />
                  </Box>

                  <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                    <Typography sx={{ fontSize: 13, mb: 0.5 }}>متن پایین فاکتور</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      value={settings.footerText}
                      onChange={(e) => saveSettings({ footerText: e.target.value })}
                    />
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showDate}
                        onChange={(e) => saveSettings({ showDate: e.target.checked })}
                      />
                    }
                    label="نمایش تاریخ و ساعت"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showPurchaseId}
                        onChange={(e) => saveSettings({ showPurchaseId: e.target.checked })}
                      />
                    }
                    label="نمایش شماره فاکتور"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showCustomerPhone}
                        onChange={(e) => saveSettings({ showCustomerPhone: e.target.checked })}
                      />
                    }
                    label="نمایش شماره مشتری"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showPaymentMethod}
                        onChange={(e) => saveSettings({ showPaymentMethod: e.target.checked })}
                      />
                    }
                    label="نمایش روش پرداخت"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showItemUnitPrice}
                        onChange={(e) => saveSettings({ showItemUnitPrice: e.target.checked })}
                      />
                    }
                    label="نمایش قیمت واحد کالا"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.compactItems}
                        onChange={(e) => saveSettings({ compactItems: e.target.checked })}
                      />
                    }
                    label="چیدمان فشرده اقلام"
                  />
                </SettingsSection>

                <Divider sx={{ gridColumn: "1 / -1" }} />

                <SettingsSection title="رفتار چاپ">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoPrint}
                        onChange={(e) => saveSettings({ autoPrint: e.target.checked })}
                      />
                    }
                    label="چاپ خودکار هنگام باز شدن"
                  />
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<RestartAltIcon />}
                      onClick={handleResetSettings}
                    >
                      بازنشانی به پیش‌فرض
                    </Button>
                  </Box>
                </SettingsSection>
              </Box>
            )}

            <Box
              sx={{
                bgcolor: "#fff",
                borderRadius: 2,
                p: 2,
                border: "1px dashed #ccc",
                overflowX: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <Typography sx={{ fontSize: 12, color: "#888", textAlign: "center" }}>
                پیش‌نمایش — عرض {paperWidthMm}mm
                {stations.length > 1 ? ` — ${stations.length} فیش` : ""}
              </Typography>
              <ReceiptTicketsBlock receipt={receipt} settings={settings} paperWidthMm={paperWidthMm} />
            </Box>
          </Box>
        </Box>
      )}

      <Box sx={{ display: directPrintMode ? "block" : "none" }} className="print-only">
        <ReceiptTicketsBlock receipt={receipt} settings={settings} paperWidthMm={paperWidthMm} />
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
