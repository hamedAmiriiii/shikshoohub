"use client";

import { useCallback, useState } from "react";
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";
import {
  type ReceiptPrintStation,
  type SaleReceiptPrintSettings,
  getEnabledReceiptPrintStations,
  getStationPrinterName,
  stationPrinterSettingKey,
} from "@/app/lib/saleReceiptPrint";
import {
  QZ_TRAY_DOWNLOAD_URL,
  listSystemPrinters,
  printHtmlToNamedPrinter,
  qzErrorMessage,
} from "@/app/lib/qzSilentPrint";
import { resolvePaperWidthMm } from "@/app/lib/saleReceiptPrint";

const STATION_LABEL: Record<ReceiptPrintStation, string> = {
  hall: "پرینتر سالن",
  kitchen: "پرینتر آشپزخانه",
  extra: "پرینتر سوم (بار)",
};

export function StationPrinterSettings({
  settings,
  onChange,
  compact = false,
}: {
  settings: SaleReceiptPrintSettings;
  onChange: (partial: Partial<SaleReceiptPrintSettings>) => void;
  compact?: boolean;
}) {
  const [printers, setPrinters] = useState<string[]>(() => {
    const current = [
      settings.hallPrinter,
      settings.kitchenPrinter,
      settings.extraPrinter,
    ].filter(Boolean);
    return Array.from(new Set(current));
  });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setStatus("در حال اتصال به QZ Tray...");
    try {
      const found = await listSystemPrinters();
      const merged = Array.from(
        new Set(
          [
            ...found,
            settings.hallPrinter,
            settings.kitchenPrinter,
            settings.extraPrinter,
          ].filter(Boolean),
        ),
      );
      setPrinters(merged);
      setStatus(found.length ? `${found.length} پرینتر پیدا شد` : "پرینتری در ویندوز پیدا نشد");
    } catch (error) {
      setStatus(qzErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }, [settings.extraPrinter, settings.hallPrinter, settings.kitchenPrinter]);

  const testStation = useCallback(
    async (station: ReceiptPrintStation) => {
      const printer = getStationPrinterName(settings, station);
      if (!printer) {
        setStatus(`اول ${STATION_LABEL[station]} را انتخاب کنید`);
        return;
      }
      setBusy(true);
      try {
        const html = `<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="utf-8"/></head><body style="font-family:Tahoma;padding:8px;text-align:center"><h2>تست چاپ</h2><div>${STATION_LABEL[station]}</div><div>${printer}</div></body></html>`;
        await printHtmlToNamedPrinter(printer, html, resolvePaperWidthMm(settings));
        setStatus(`تست ${STATION_LABEL[station]} ارسال شد`);
      } catch (error) {
        setStatus(qzErrorMessage(error));
      } finally {
        setBusy(false);
      }
    },
    [settings],
  );

  const stations: ReceiptPrintStation[] = ["hall", "kitchen", "extra"];
  const enabled = getEnabledReceiptPrintStations(settings);

  return (
    <Box sx={{ gridColumn: "1 / -1", display: "grid", gap: 1.5 }}>
      {!compact && (
        <Typography sx={{ fontSize: 13, color: "#555" }}>
          برای چاپ بدون پنجره تأیید، QZ Tray را روی همین کامپیوتر نصب و باز نگه دارید، پرینتر هر بخش را انتخاب کنید، و یک‌بار اجازه اتصال را بدهید.
        </Typography>
      )}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        <Button size="small" variant="contained" disabled={busy} onClick={() => void refresh()}>
          {busy ? "صبر کنید..." : "خواندن پرینترهای سیستم"}
        </Button>
        <Button size="small" variant="outlined" href={QZ_TRAY_DOWNLOAD_URL} target="_blank" rel="noreferrer">
          دانلود QZ Tray
        </Button>
      </Box>
      {status ? (
        <Typography sx={{ fontSize: 12, color: status.includes("ناموفق") || status.includes("نیست") ? "#b45309" : "#166534" }}>
          {status}
        </Typography>
      ) : null}

      {stations.map((station) => {
        const key = stationPrinterSettingKey(station);
        const value = settings[key] || "";
        const options = value && !printers.includes(value) ? [value, ...printers] : printers;
        return (
          <Box key={station} sx={{ display: "grid", gap: 0.5 }}>
            <Typography sx={{ fontSize: 13 }}>
              {STATION_LABEL[station]}
              {!enabled.includes(station) ? " (این فیش خاموش است)" : ""}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Select
                size="small"
                displayEmpty
                value={value}
                onChange={(e) => onChange({ [key]: String(e.target.value) })}
                sx={{ minWidth: 220, flex: 1 }}
              >
                <MenuItem value="">انتخاب نشده</MenuItem>
                {options.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
              <Button size="small" variant="outlined" disabled={busy || !value} onClick={() => void testStation(station)}>
                تست
              </Button>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
