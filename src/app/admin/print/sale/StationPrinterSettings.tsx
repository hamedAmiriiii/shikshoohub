"use client";

import { useCallback, useState } from "react";
import { Box, Button, MenuItem, Select, Switch, TextField, Typography } from "@mui/material";
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

const switchSx = {
  transform: "scale(0.85)",
  "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--admin-accent)" },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "var(--admin-accent)",
  },
};

function ToggleRow({
  title,
  hint,
  checked,
  onChange,
  last = false,
}: {
  title: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  last?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 0.75,
        py: 0.55,
        borderBottom: last ? "none" : "1px solid var(--admin-divider)",
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ color: "var(--admin-text)", fontSize: "13px", fontWeight: 600, lineHeight: 1.25 }}>
          {title}
        </Typography>
        <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "11px", lineHeight: 1.25, mt: 0.1 }}>
          {hint}
        </Typography>
      </Box>
      <Switch
        size="small"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        sx={switchSx}
      />
    </Box>
  );
}

export function StationPrinterSettings({
  settings,
  onChange,
  compact = false,
  showReceiptToggles = false,
}: {
  settings: SaleReceiptPrintSettings;
  onChange: (partial: Partial<SaleReceiptPrintSettings>) => void;
  compact?: boolean;
  showReceiptToggles?: boolean;
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
  const [revealQz, setRevealQz] = useState(
    Boolean(settings.qzCertificate?.trim() && settings.qzPrivateKey?.trim()),
  );

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
      const message = qzErrorMessage(error);
      if (message.includes("گواهی") || String(error).toLowerCase().includes("qz_credentials_missing")) {
        setRevealQz(true);
      }
      setStatus(message);
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

  const enabled = getEnabledReceiptPrintStations(settings);
  const stations = (["hall", "kitchen", "extra"] as ReceiptPrintStation[]).filter((station) =>
    enabled.includes(station),
  );
  const uniqueSelectedPrinters = Array.from(
    new Set(stations.map((station) => getStationPrinterName(settings, station)).filter(Boolean)),
  );
  const showQzSettings =
    revealQz || uniqueSelectedPrinters.length >= 2;

  const pemFieldSx = {
    "& .MuiInputBase-input": {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: 11,
      direction: "ltr",
      textAlign: "left",
    },
  };

  return (
    <Box sx={{ gridColumn: "1 / -1", display: "grid", gap: 1.5 }}>
      {showReceiptToggles ? (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <ToggleRow
            title="چاپ مستقیم فاکتور"
            hint="بدون پیش‌نمایش چاپ"
            checked={Boolean(settings.autoPrint)}
            onChange={(checked) => onChange({ autoPrint: checked })}
          />
          <ToggleRow
            title="فیش آشپزخانه"
            hint="با چاپ سالن، یک فیش بدون قیمت هم چاپ می‌شود"
            checked={Boolean(settings.printKitchen)}
            onChange={(checked) => onChange({ printKitchen: checked })}
          />
          <ToggleRow
            title="فیش سوم (بار)"
            hint="ایستگاه جدا با پرینتر مستقل"
            checked={Boolean(settings.printExtra)}
            onChange={(checked) => onChange({ printExtra: checked })}
            last
          />
        </Box>
      ) : null}

      {stations.map((station) => {
        const key = stationPrinterSettingKey(station);
        const value = settings[key] || "";
        const options = value && !printers.includes(value) ? [value, ...printers] : printers;
        return (
          <Box key={station} sx={{ display: "grid", gap: 0.5 }}>
            <Typography sx={{ fontSize: 13, color: "var(--admin-text)" }}>
              {STATION_LABEL[station]}
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

      {showQzSettings ? (
        <Box sx={{ display: "grid", gap: 1.25 }}>
          {!compact && (
            <Typography sx={{ fontSize: 13, color: "#555" }}>
              برای چاپ بدون پنجره تأیید روی چند پرینتر، گواهی و کلید خصوصی QZ را وارد کنید، QZ Tray را باز نگه دارید، و یک‌بار اجازه اتصال را بدهید.
            </Typography>
          )}
          {compact && (
            <Typography sx={{ fontSize: 12, color: "var(--admin-text-secondary)" }}>
              چند پرینتر انتخاب شده؛ گواهی و کلید خصوصی QZ را وارد کنید تا چاپ مستقیم به همه ارسال شود.
            </Typography>
          )}
          <TextField
            size="small"
            fullWidth
            multiline
            minRows={compact ? 3 : 4}
            label="گواهی QZ (Certificate)"
            placeholder="-----BEGIN CERTIFICATE-----"
            value={settings.qzCertificate || ""}
            onChange={(e) => onChange({ qzCertificate: e.target.value })}
            sx={pemFieldSx}
          />
          <TextField
            size="small"
            fullWidth
            multiline
            minRows={compact ? 3 : 4}
            label="کلید خصوصی QZ (Private Key)"
            placeholder="-----BEGIN PRIVATE KEY-----"
            value={settings.qzPrivateKey || ""}
            onChange={(e) => onChange({ qzPrivateKey: e.target.value })}
            sx={pemFieldSx}
          />
        </Box>
      ) : (
        <Typography sx={{ fontSize: 12, color: "var(--admin-text-secondary)" }}>
          اگر برای چند فیش پرینتر جدا انتخاب کنید، تنظیمات اتصال QZ اینجا می‌آید.
        </Typography>
      )}
    </Box>
  );
}
