"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Slider,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  RECEIPT_PAPER_PRESETS,
  getStationLayout,
  getStationPrinterName,
  resolvePaperWidthMm,
  stationLayoutSettingKey,
  stationPrinterSettingKey,
  type ReceiptPrintStation,
  type SaleReceiptPrintSettings,
  type StationTicketLayout,
} from "@/app/lib/saleReceiptPrint";
import {
  QZ_TRAY_DOWNLOAD_URL,
  listSystemPrinters,
  printHtmlToNamedPrinter,
  qzErrorMessage,
} from "@/app/lib/qzSilentPrint";

const STATION_LABEL: Record<ReceiptPrintStation, string> = {
  hall: "سالن",
  kitchen: "آشپزخانه",
  extra: "بار",
};

const STATION_HINT: Record<ReceiptPrintStation, string> = {
  hall: "فیش با قیمت",
  kitchen: "فیش بدون قیمت",
  extra: "ایستگاه سوم",
};

const switchSx = {
  transform: "scale(0.85)",
  "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--admin-accent)" },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "var(--admin-accent)",
  },
};

const fieldSx = {
  width: "100%",
  color: "var(--admin-text)",
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-input-bg)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-input-border, var(--admin-border))" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiSelect-select": { color: "var(--admin-text)" },
  "& .MuiSelect-icon": { color: "var(--admin-text-muted)" },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
  "& .MuiInputBase-input": { color: "var(--admin-text)" },
  "& .MuiFormLabel-root": { color: "var(--admin-text-muted)" },
};

const menuProps = {
  PaperProps: {
    sx: {
      bgcolor: "var(--admin-surface)",
      color: "var(--admin-text)",
      backgroundImage: "none",
      "& .MuiMenuItem-root": { color: "var(--admin-text)" },
    },
  },
};

const dialogPaperSx = {
  bgcolor: "var(--admin-surface)",
  color: "var(--admin-text)",
  direction: "rtl" as const,
  borderRadius: 2,
  backgroundImage: "none",
  "& .MuiDialogTitle-root, & .MuiTypography-root": { color: "var(--admin-text)" },
};

const outlinedBtnSx = {
  color: "var(--admin-text)",
  borderColor: "var(--admin-input-border, var(--admin-border))",
  "&:hover": {
    borderColor: "var(--admin-accent)",
    bgcolor: "var(--admin-menu-hover)",
  },
};

const containedBtnSx = {
  bgcolor: "var(--admin-accent)",
  color: "#fff",
  "&:hover": { bgcolor: "var(--admin-accent-hover)", color: "#fff" },
  "&.Mui-disabled": {
    bgcolor: "var(--admin-border)",
    color: "var(--admin-text-muted)",
  },
};

type StationDraft = {
  enabled: boolean;
  printer: string;
  layout: StationTicketLayout;
  title: string;
  shopTitle: string;
  footerText: string;
  showDate: boolean;
  showPurchaseId: boolean;
  showCustomerPhone: boolean;
  showPaymentMethod: boolean;
  showItemUnitPrice: boolean;
  compactItems: boolean;
};

function paperLabel(layout: StationTicketLayout): string {
  if (layout.paperPreset === "custom") return `${layout.customPaperWidthMm}mm`;
  const preset = RECEIPT_PAPER_PRESETS.find((item) => item.id === layout.paperPreset);
  return preset ? `${preset.widthMm || layout.customPaperWidthMm}mm` : `${layout.customPaperWidthMm}mm`;
}

function draftFromSettings(settings: SaleReceiptPrintSettings, station: ReceiptPrintStation): StationDraft {
  const enabled =
    station === "hall"
      ? settings.printHall !== false
      : station === "kitchen"
        ? Boolean(settings.printKitchen)
        : Boolean(settings.printExtra);
  return {
    enabled,
    printer: getStationPrinterName(settings, station),
    layout: getStationLayout(settings, station),
    title: station === "kitchen" ? settings.kitchenTitle : station === "extra" ? settings.extraTitle : "فیش سالن",
    shopTitle: settings.shopTitle,
    footerText: settings.footerText,
    showDate: settings.showDate,
    showPurchaseId: settings.showPurchaseId,
    showCustomerPhone: settings.showCustomerPhone,
    showPaymentMethod: settings.showPaymentMethod,
    showItemUnitPrice: settings.showItemUnitPrice,
    compactItems: settings.compactItems,
  };
}

function StationSettingsDialog({
  open,
  station,
  settings,
  printers,
  busy,
  onClose,
  onSave,
  onTest,
}: {
  open: boolean;
  station: ReceiptPrintStation | null;
  settings: SaleReceiptPrintSettings;
  printers: string[];
  busy: boolean;
  onClose: () => void;
  onSave: (partial: Partial<SaleReceiptPrintSettings>) => void;
  onTest: (station: ReceiptPrintStation, printer: string, layout: StationTicketLayout) => void;
}) {
  const [draft, setDraft] = useState<StationDraft | null>(null);

  useEffect(() => {
    if (open && station) setDraft(draftFromSettings(settings, station));
  }, [open, station, settings]);

  if (!station || !draft) return null;

  const options = draft.printer && !printers.includes(draft.printer) ? [draft.printer, ...printers] : printers;
  const widthMm = resolvePaperWidthMm({ ...settings, ...draft.layout });

  const save = () => {
    const layoutKey = stationLayoutSettingKey(station);
    const printerKey = stationPrinterSettingKey(station);
    const partial: Partial<SaleReceiptPrintSettings> = {
      [printerKey]: draft.printer,
      [layoutKey]: draft.layout,
    };
    if (station === "hall") {
      Object.assign(partial, {
        printHall: draft.enabled,
        paperPreset: draft.layout.paperPreset,
        customPaperWidthMm: draft.layout.customPaperWidthMm,
        fontSize: draft.layout.fontSize,
        titleFontSize: draft.layout.titleFontSize,
        paddingMm: draft.layout.paddingMm,
        lineHeight: draft.layout.lineHeight,
        shopTitle: draft.shopTitle,
        footerText: draft.footerText,
        showDate: draft.showDate,
        showPurchaseId: draft.showPurchaseId,
        showCustomerPhone: draft.showCustomerPhone,
        showPaymentMethod: draft.showPaymentMethod,
        showItemUnitPrice: draft.showItemUnitPrice,
        compactItems: draft.compactItems,
      });
    } else if (station === "kitchen") {
      partial.printKitchen = draft.enabled;
      partial.kitchenTitle = draft.title;
    } else {
      partial.printExtra = draft.enabled;
      partial.extraTitle = draft.title;
    }
    onSave(partial);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: dialogPaperSx }}
    >
      <DialogTitle sx={{ fontSize: 16, fontWeight: 700, pb: 1 }}>تنظیمات {STATION_LABEL[station]}</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 1.25, pt: "8px !important" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 13 }}>فعال</Typography>
          <Switch
            size="small"
            checked={draft.enabled}
            onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
            sx={switchSx}
          />
        </Box>

        {station !== "hall" && (
          <TextField
            size="small"
            label="عنوان فیش"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            sx={fieldSx}
          />
        )}

        <Select
          size="small"
          displayEmpty
          value={draft.printer}
          onChange={(e) => setDraft({ ...draft, printer: String(e.target.value) })}
          sx={fieldSx}
          MenuProps={menuProps}
        >
          <MenuItem value="">پرینتر پیش‌فرض ویندوز</MenuItem>
          {options.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>

        <Select
          size="small"
          value={draft.layout.paperPreset}
          onChange={(e) =>
            setDraft({
              ...draft,
              layout: { ...draft.layout, paperPreset: e.target.value as StationTicketLayout["paperPreset"] },
            })
          }
          sx={fieldSx}
          MenuProps={menuProps}
        >
          {RECEIPT_PAPER_PRESETS.map((preset) => (
            <MenuItem key={preset.id} value={preset.id}>
              {preset.label}
            </MenuItem>
          ))}
        </Select>

        {draft.layout.paperPreset === "custom" && (
          <TextField
            size="small"
            type="number"
            label="عرض سفارشی (mm)"
            value={draft.layout.customPaperWidthMm}
            inputProps={{ min: 40, max: 220 }}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!Number.isNaN(value)) {
                setDraft({ ...draft, layout: { ...draft.layout, customPaperWidthMm: value } });
              }
            }}
            sx={fieldSx}
          />
        )}

        <Typography sx={{ fontSize: 12, color: "var(--admin-text-secondary)" }}>عرض چاپ: {widthMm}mm</Typography>

        <Box>
          <Typography sx={{ fontSize: 12, mb: 0.25 }}>حاشیه {draft.layout.paddingMm}mm</Typography>
          <Slider
            size="small"
            value={draft.layout.paddingMm}
            min={0}
            max={12}
            step={1}
            onChange={(_, value) => setDraft({ ...draft, layout: { ...draft.layout, paddingMm: value as number } })}
          />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, mb: 0.25 }}>فونت {draft.layout.fontSize}px</Typography>
          <Slider
            size="small"
            value={draft.layout.fontSize}
            min={8}
            max={18}
            step={1}
            onChange={(_, value) => setDraft({ ...draft, layout: { ...draft.layout, fontSize: value as number } })}
          />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, mb: 0.25 }}>عنوان {draft.layout.titleFontSize}px</Typography>
          <Slider
            size="small"
            value={draft.layout.titleFontSize}
            min={10}
            max={22}
            step={1}
            onChange={(_, value) =>
              setDraft({ ...draft, layout: { ...draft.layout, titleFontSize: value as number } })
            }
          />
        </Box>

        {station === "hall" && (
          <>
            <TextField
              size="small"
              label="عنوان فروشگاه"
              value={draft.shopTitle}
              onChange={(e) => setDraft({ ...draft, shopTitle: e.target.value })}
              sx={fieldSx}
            />
            <TextField
              size="small"
              label="متن پایین فاکتور"
              value={draft.footerText}
              onChange={(e) => setDraft({ ...draft, footerText: e.target.value })}
              sx={fieldSx}
            />
            {(
              [
                ["showDate", "تاریخ"],
                ["showPurchaseId", "شماره فاکتور"],
                ["showCustomerPhone", "شماره مشتری"],
                ["showPaymentMethod", "روش پرداخت"],
                ["showItemUnitPrice", "قیمت واحد"],
                ["compactItems", "چیدمان فشرده"],
              ] as const
            ).map(([key, label]) => (
              <Box key={key} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: 13 }}>{label}</Typography>
                <Switch
                  size="small"
                  checked={Boolean(draft[key])}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
                  sx={switchSx}
                />
              </Box>
            ))}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          disabled={busy || !draft.printer}
          onClick={() => onTest(station, draft.printer, draft.layout)}
          sx={outlinedBtnSx}
        >
          تست
        </Button>
        <Button size="small" onClick={onClose} sx={{ color: "var(--admin-text-secondary)" }}>
          انصراف
        </Button>
        <Button size="small" variant="contained" onClick={save} sx={containedBtnSx}>
          ذخیره
        </Button>
      </DialogActions>
    </Dialog>
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
    const current = [settings.hallPrinter, settings.kitchenPrinter, settings.extraPrinter].filter(Boolean);
    return Array.from(new Set(current));
  });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [editStation, setEditStation] = useState<ReceiptPrintStation | null>(null);
  const [qzOpen, setQzOpen] = useState(false);
  const [qzDraft, setQzDraft] = useState({
    certificate: settings.qzCertificate || "",
    privateKey: settings.qzPrivateKey || "",
  });

  const stations = useMemo(() => {
    const list: ReceiptPrintStation[] = ["hall", "kitchen"];
    if (showReceiptToggles || settings.printExtra) list.push("extra");
    return list;
  }, [settings.printExtra, showReceiptToggles]);

  const refresh = useCallback(async () => {
    setBusy(true);
    setStatus("در حال اتصال...");
    try {
      const found = await listSystemPrinters();
      setPrinters(
        Array.from(
          new Set([...found, settings.hallPrinter, settings.kitchenPrinter, settings.extraPrinter].filter(Boolean)),
        ),
      );
      setStatus(found.length ? `${found.length} پرینتر` : "پرینتری پیدا نشد");
    } catch (error) {
      setStatus(qzErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }, [settings.extraPrinter, settings.hallPrinter, settings.kitchenPrinter]);

  const testStation = useCallback(
    async (station: ReceiptPrintStation, printer: string, layout: StationTicketLayout) => {
      if (!printer) {
        setStatus("اول پرینتر را انتخاب کنید");
        return;
      }
      setBusy(true);
      try {
        const html = `<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" dir="rtl" lang="fa"><head><meta charset="utf-8"/></head><body style="font-family:Tahoma;padding:8px;text-align:center;color:#000;background:#fff"><h2>تست چاپ</h2><div>${STATION_LABEL[station]}</div><div>${printer}</div></body></html>`;
        await printHtmlToNamedPrinter(printer, html, resolvePaperWidthMm({ ...settings, ...layout }));
        setStatus(`تست ${STATION_LABEL[station]} ارسال شد`);
      } catch (error) {
        setStatus(qzErrorMessage(error));
      } finally {
        setBusy(false);
      }
    },
    [settings],
  );

  return (
    <Box sx={{ gridColumn: "1 / -1", display: "grid", gap: 1 }}>
      {showReceiptToggles ? (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.25 }}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>چاپ خودکار</Typography>
            <Typography sx={{ fontSize: 11, color: "var(--admin-text-secondary)" }}>بعد از فروش</Typography>
          </Box>
          <Switch
            size="small"
            checked={Boolean(settings.autoPrint)}
            onChange={(e) => onChange({ autoPrint: e.target.checked })}
            sx={switchSx}
          />
        </Box>
      ) : null}

      {stations.map((station) => {
        const enabled =
          station === "hall"
            ? settings.printHall !== false
            : station === "kitchen"
              ? Boolean(settings.printKitchen)
              : Boolean(settings.printExtra);
        const printer = getStationPrinterName(settings, station);
        const layout = getStationLayout(settings, station);
        return (
          <Box
            key={station}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              py: 0.75,
              borderBottom: "1px solid var(--admin-divider)",
              opacity: enabled ? 1 : 0.55,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{STATION_LABEL[station]}</Typography>
              <Typography sx={{ fontSize: 11, color: "var(--admin-text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {STATION_HINT[station]} · {paperLabel(layout)}
                {printer ? ` · ${printer}` : " · بدون پرینتر"}
              </Typography>
            </Box>
            <Button size="small" variant="outlined" onClick={() => setEditStation(station)} sx={{ ...outlinedBtnSx, minWidth: 72 }}>
              تنظیمات
            </Button>
          </Box>
        );
      })}

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", pt: 0.5 }}>
        <Button size="small" variant="contained" disabled={busy} onClick={() => void refresh()} sx={containedBtnSx}>
          {busy ? "..." : "پرینترها"}
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setQzDraft({
              certificate: settings.qzCertificate || "",
              privateKey: settings.qzPrivateKey || "",
            });
            setQzOpen(true);
          }}
          sx={outlinedBtnSx}
        >
          اتصال QZ
        </Button>
        <Button size="small" variant="text" href={QZ_TRAY_DOWNLOAD_URL} target="_blank" rel="noreferrer" sx={{ color: "var(--admin-text-secondary)", fontSize: 12 }}>
          دانلود
        </Button>
      </Box>
      {status ? (
        <Typography
          sx={{
            fontSize: 12,
            color: status.includes("ناموفق") || status.includes("نیست") ? "#d97706" : "var(--admin-accent)",
          }}
        >
          {status}
        </Typography>
      ) : null}

      <StationSettingsDialog
        open={Boolean(editStation)}
        station={editStation}
        settings={settings}
        printers={printers}
        busy={busy}
        onClose={() => setEditStation(null)}
        onSave={onChange}
        onTest={(station, printer, layout) => void testStation(station, printer, layout)}
      />

      <Dialog
        open={qzOpen}
        onClose={() => setQzOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>اتصال QZ Tray</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.25, pt: "8px !important" }}>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-secondary)" }}>
            برای چاپ مستقیم روی چند پرینتر، گواهی و کلید را وارد کنید.
          </Typography>
          <TextField
            size="small"
            multiline
            minRows={compact ? 3 : 4}
            label="گواهی"
            value={qzDraft.certificate}
            onChange={(e) => setQzDraft({ ...qzDraft, certificate: e.target.value })}
            sx={{
              ...fieldSx,
              "& .MuiInputBase-input": {
                ...fieldSx["& .MuiInputBase-input"],
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                fontSize: 11,
                direction: "ltr",
                textAlign: "left",
              },
            }}
          />
          <TextField
            size="small"
            multiline
            minRows={compact ? 3 : 4}
            label="کلید خصوصی"
            value={qzDraft.privateKey}
            onChange={(e) => setQzDraft({ ...qzDraft, privateKey: e.target.value })}
            sx={{
              ...fieldSx,
              "& .MuiInputBase-input": {
                ...fieldSx["& .MuiInputBase-input"],
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                fontSize: 11,
                direction: "ltr",
                textAlign: "left",
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setQzOpen(false)} sx={{ color: "var(--admin-text-secondary)" }}>
            انصراف
          </Button>
          <Button
            size="small"
            variant="contained"
            sx={containedBtnSx}
            onClick={() => {
              onChange({ qzCertificate: qzDraft.certificate, qzPrivateKey: qzDraft.privateKey });
              setQzOpen(false);
            }}
          >
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
