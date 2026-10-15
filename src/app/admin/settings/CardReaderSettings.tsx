"use client";

import { useCallback, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import UsbIcon from "@mui/icons-material/Usb";
import CableIcon from "@mui/icons-material/Cable";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { toast } from "react-toastify";
import { adminButtonStartIconSx } from "@/app/admin/theme/adminTheme";
import { formatAmountInput, parseAmountInput } from "@/app/lib/amountInput";
import {
  CARD_READER_BAUD_OPTIONS,
  CARD_READER_PROVIDERS,
  cardReaderErrorMessage,
  chargeCardReader,
  isCardReaderUsbSupported,
  readCardReaderSettings,
  requestCardReaderUsb,
  testCardReaderLink,
  writeCardReaderSettings,
  type CardReaderSettings,
  type CardReaderTransport,
} from "@/app/lib/cardReader";

const btnSx = {
  ...adminButtonStartIconSx,
  fontSize: "12px",
  py: 0.5,
  px: 1.25,
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontSize: "13px",
    "& fieldset": { borderColor: "var(--admin-border)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)", fontSize: 13 },
  "& .MuiSelect-icon": { color: "var(--admin-text-muted)" },
};

export default function CardReaderSettings() {
  const [settings, setSettings] = useState<CardReaderSettings>(() => readCardReaderSettings());
  const [testingLink, setTestingLink] = useState(false);
  const [charging, setCharging] = useState(false);
  const [testAmount, setTestAmount] = useState("1000");
  const [message, setMessage] = useState("");
  const [raw, setRaw] = useState("");
  const usbOk = isCardReaderUsbSupported();

  const persist = useCallback((partial: Partial<CardReaderSettings>) => {
    const next = writeCardReaderSettings(partial);
    setSettings(next);
    return next;
  }, []);

  const runLinkTest = async () => {
    setTestingLink(true);
    setMessage("در حال اتصال…");
    setRaw("");
    try {
      const result = await testCardReaderLink();
      setMessage(result.message);
      setRaw(result.raw);
      toast.success(result.message);
    } catch (err) {
      const msg = cardReaderErrorMessage(err);
      setMessage(msg);
      toast.error(msg);
    } finally {
      setTestingLink(false);
    }
  };

  const runChargeTest = async () => {
    const toman = Math.floor(parseAmountInput(testAmount));
    if (toman <= 0) {
      toast.error("مبلغ تست را وارد کنید");
      return;
    }
    setCharging(true);
    setMessage("مبلغ به کارتخوان رفت. کارت را بکشید…");
    setRaw("");
    try {
      const result = await chargeCardReader(toman, {
        allowRequestPort: true,
        onChunk: (chunk) => setRaw(chunk.slice(-400)),
      });
      setMessage(result.message);
      setRaw(result.raw.slice(-400));
      if (result.approved) toast.success(result.message);
      else toast.warning(result.message);
    } catch (err) {
      const msg = cardReaderErrorMessage(err);
      setMessage(msg);
      toast.error(msg);
    } finally {
      setCharging(false);
    }
  };

  const busy = testingLink || charging;

  return (
    <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1.25 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Box>
          <Typography sx={{ color: "var(--admin-text)", fontSize: 13, fontWeight: 600 }}>
            ارسال مبلغ به کارتخوان
          </Typography>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11 }}>
            فروش کارتی فقط بعد از تأیید کارتخوان ثبت می‌شود
          </Typography>
        </Box>
        <Switch
          size="small"
          checked={settings.enabled}
          onChange={(e) => {
            persist({ enabled: e.target.checked });
            toast.success(e.target.checked ? "کارتخوان فعال شد" : "کارتخوان غیرفعال شد");
          }}
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--admin-accent)" },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "var(--admin-accent)" },
          }}
        />
      </Box>

      <FormControl size="small" fullWidth sx={fieldSx}>
        <InputLabel id="card-reader-provider">شرکت کارتخوان</InputLabel>
        <Select
          labelId="card-reader-provider"
          label="شرکت کارتخوان"
          value={settings.provider}
          onChange={(e) => {
            const provider = e.target.value as CardReaderSettings["provider"];
            const found = CARD_READER_PROVIDERS.find((p) => p.id === provider);
            persist({ provider, port: found?.defaultPort ?? settings.port });
          }}
        >
          {CARD_READER_PROVIDERS.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth sx={fieldSx}>
        <InputLabel id="card-reader-transport">نحوه اتصال</InputLabel>
        <Select
          labelId="card-reader-transport"
          label="نحوه اتصال"
          value={settings.transport}
          onChange={(e) => persist({ transport: e.target.value as CardReaderTransport })}
        >
          <MenuItem value="lan">شبکه (IP) — با QZ Tray</MenuItem>
          <MenuItem value="usb" disabled={!usbOk}>
            USB مستقیم{usbOk ? "" : " — مرورگر پشتیبانی نمی‌کند"}
          </MenuItem>
        </Select>
      </FormControl>

      {settings.transport === "lan" ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 120px" }, gap: 1 }}>
          <TextField
            size="small"
            label="IP کارتخوان"
            value={settings.host}
            placeholder="192.168.1.10"
            onChange={(e) => persist({ host: e.target.value.replace(/[^\d.]/g, "").slice(0, 40) })}
            sx={fieldSx}
          />
          <TextField
            size="small"
            label="پورت"
            value={String(settings.port)}
            onChange={(e) => persist({ port: Number(e.target.value.replace(/\D/g, "").slice(0, 5)) || 0 })}
            sx={fieldSx}
          />
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr auto" }, gap: 1, alignItems: "center" }}>
          <FormControl size="small" sx={fieldSx}>
            <InputLabel id="card-reader-baud">Baud</InputLabel>
            <Select
              labelId="card-reader-baud"
              label="Baud"
              value={settings.baudRate}
              onChange={(e) => persist({ baudRate: Number(e.target.value) })}
            >
              {CARD_READER_BAUD_OPTIONS.map((b) => (
                <MenuItem key={b} value={b}>
                  {b}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            size="small"
            variant="outlined"
            startIcon={<UsbIcon />}
            onClick={() => {
              void requestCardReaderUsb()
                .then((next) => {
                  setSettings(next);
                  toast.success(next.deviceLabel || "دستگاه انتخاب شد");
                })
                .catch((err) => toast.error(cardReaderErrorMessage(err)));
            }}
            sx={{ ...btnSx, color: "var(--admin-accent)", borderColor: "var(--admin-accent)", height: 40 }}
          >
            انتخاب USB
          </Button>
          <Typography sx={{ gridColumn: "1 / -1", color: "var(--admin-text-muted)", fontSize: 12 }}>
            {settings.deviceLabel || "هنوز دستگاهی انتخاب نشده"}
          </Typography>
        </Box>
      )}

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={settings.sendAsRial}
            onChange={(e) => persist({ sendAsRial: e.target.checked })}
          />
        }
        label={
          <Typography sx={{ fontSize: 12, color: "var(--admin-text)" }}>
            مبلغ را به ریال بفرست (تومان × ۱۰)
          </Typography>
        }
      />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        <Button
          size="small"
          variant="outlined"
          disabled={busy}
          startIcon={testingLink ? <CircularProgress size={14} /> : <CableIcon />}
          onClick={() => void runLinkTest()}
          sx={{ ...btnSx, color: "var(--admin-accent)", borderColor: "var(--admin-accent)" }}
        >
          تست اتصال
        </Button>
        <TextField
          size="small"
          label="مبلغ تست (تومان)"
          value={testAmount}
          onChange={(e) => setTestAmount(formatAmountInput(e.target.value))}
          sx={{ ...fieldSx, width: 140 }}
        />
        <Button
          size="small"
          variant="contained"
          disabled={busy}
          startIcon={charging ? <CircularProgress size={14} color="inherit" /> : <CreditCardIcon />}
          onClick={() => void runChargeTest()}
          sx={{ ...btnSx, bgcolor: "var(--admin-accent)", color: "#fff" }}
        >
          ارسال مبلغ تست
        </Button>
      </Box>
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11 }}>
        ارسال مبلغ تست واقعاً روی کارتخوان می‌رود و کارت می‌کشد.
      </Typography>

      {(message || raw) && (
        <Box sx={{ p: 1.25, borderRadius: "8px", border: "1px solid var(--admin-border)", bgcolor: "var(--admin-surface-alt)" }}>
          {message ? <Typography sx={{ fontSize: 12.5, color: "var(--admin-text)" }}>{message}</Typography> : null}
          {raw ? (
            <Typography
              component="pre"
              sx={{
                mt: 0.75,
                mb: 0,
                fontSize: 11,
                direction: "ltr",
                textAlign: "left",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                color: "var(--admin-text-muted)",
                fontFamily: "ui-monospace, Consolas, monospace",
              }}
            >
              {raw.replace(/[^\x09\x0a\x0d\x20-\x7e]/g, (ch) => `<${ch.charCodeAt(0).toString(16)}>`)}
            </Typography>
          ) : null}
        </Box>
      )}
    </Box>
  );
}
