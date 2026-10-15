"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import UsbIcon from "@mui/icons-material/Usb";
import CableIcon from "@mui/icons-material/Cable";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";
import { adminButtonStartIconSx } from "@/app/admin/theme/adminTheme";
import {
  formatScaleRawPreview,
  hasGrantedWebSerialPort,
  isWebSerialSupported,
  listScalePorts,
  readSadrScaleSettings,
  requestWebSerialScalePort,
  SADR_SCALE_BAUD_OPTIONS,
  scaleErrorMessage,
  testSadrScale,
  writeSadrScaleSettings,
  type SadrScaleSettings,
  type SadrScaleTransport,
} from "@/app/lib/sadrScale";

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
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)", fontSize: 13 },
  "& .MuiSelect-icon": { color: "var(--admin-text-muted)" },
};

export default function SadrScaleSettings() {
  const webSerialOk = isWebSerialSupported();
  const [settings, setSettings] = useState<SadrScaleSettings>(() => {
    const s = readSadrScaleSettings();
    // اگر مرورگر Web Serial دارد، پیش‌فرض همان باشد
    if (webSerialOk && s.transport !== "qz") {
      return { ...s, transport: "web_serial" };
    }
    return s;
  });
  const [ports, setPorts] = useState<string[]>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [pickingUsb, setPickingUsb] = useState(false);
  const [testing, setTesting] = useState(false);
  const [liveRaw, setLiveRaw] = useState("");
  const [liveWeight, setLiveWeight] = useState<number | null>(null);
  const [testMessage, setTestMessage] = useState("");
  const [usbReady, setUsbReady] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const persist = useCallback((partial: Partial<SadrScaleSettings>) => {
    const next = writeSadrScaleSettings(partial);
    setSettings(next);
    return next;
  }, []);

  const refreshUsbStatus = useCallback(async () => {
    if (!webSerialOk) {
      setUsbReady(false);
      return;
    }
    try {
      setUsbReady(await hasGrantedWebSerialPort());
    } catch {
      setUsbReady(false);
    }
  }, [webSerialOk]);

  const refreshPorts = useCallback(async () => {
    setLoadingPorts(true);
    try {
      const found = await listScalePorts();
      setPorts(found);
    } catch {
      setPorts([]);
    } finally {
      setLoadingPorts(false);
    }
  }, []);

  useEffect(() => {
    void refreshUsbStatus();
    if (settings.transport === "qz") void refreshPorts();
    return () => {
      abortRef.current?.abort();
    };
  }, [refreshUsbStatus, refreshPorts, settings.transport]);

  const pickUsb = async () => {
    setPickingUsb(true);
    try {
      const next = await requestWebSerialScalePort();
      setSettings(next);
      setUsbReady(true);
      toast.success(`دستگاه انتخاب شد: ${next.deviceLabel || "USB"}`);
    } catch (err) {
      const msg = String(err instanceof Error ? err.message : err).toLowerCase();
      if (msg.includes("cancel") || msg.includes("no port selected")) {
        toast.info("انتخاب دستگاه لغو شد");
      } else {
        toast.error(scaleErrorMessage(err));
      }
    } finally {
      setPickingUsb(false);
    }
  };

  const canTest =
    settings.transport === "web_serial"
      ? webSerialOk && (usbReady || Boolean(settings.deviceLabel))
      : Boolean(settings.port.trim());

  const runTest = async () => {
    if (settings.transport === "web_serial" && !webSerialOk) {
      toast.error("مرورگر از اتصال USB مستقیم پشتیبانی نمی‌کند (Chrome/Edge)");
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setTesting(true);
    setLiveRaw("");
    setLiveWeight(null);
    setTestMessage("در حال گوش دادن به ترازو…");
    try {
      const result = await testSadrScale({
        port: settings.port,
        baudRate: settings.baudRate,
        listenMs: 4500,
        transport: settings.transport,
        allowRequestPort: true,
        signal: ac.signal,
        onChunk: (chunk, weight) => {
          setLiveRaw((prev) => formatScaleRawPreview(prev + chunk, 400));
          if (weight != null) setLiveWeight(weight);
        },
      });
      setLiveRaw(formatScaleRawPreview(result.raw, 400));
      setLiveWeight(result.weightKg);
      setTestMessage(result.message);
      if (result.ok) toast.success(result.message);
      else toast.warning(result.message);
      void refreshUsbStatus();
    } catch (err) {
      const msg = scaleErrorMessage(err);
      setTestMessage(msg);
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const portOptions =
    settings.port && !ports.includes(settings.port) ? [settings.port, ...ports] : ports;

  return (
    <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1.25 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          py: 0.5,
          borderBottom: "1px solid var(--admin-border)",
        }}
      >
        <Box>
          <Typography sx={{ color: "var(--admin-text)", fontSize: 13, fontWeight: 600 }}>
            فعال‌سازی ترازو صدر ویستا B
          </Typography>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11 }}>
            اتصال مستقیم USB از مرورگر — بدون نیاز به QZ
          </Typography>
        </Box>
        <Switch
          size="small"
          checked={settings.enabled}
          onChange={(e) => {
            const enabled = e.target.checked;
            persist({ enabled });
            toast.success(enabled ? "ترازو فعال شد" : "ترازو غیرفعال شد");
          }}
          sx={{
            transform: "scale(0.85)",
            "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--admin-accent)" },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              backgroundColor: "var(--admin-accent)",
            },
          }}
        />
      </Box>

      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11 }}>
        مدل: توزین صدر · ویستا B · معمولاً 9600 baud · 8N1 · Chrome یا Edge
      </Typography>

      <FormControl size="small" fullWidth sx={fieldSx}>
        <InputLabel id="sadr-scale-transport">نحوه اتصال</InputLabel>
        <Select
          labelId="sadr-scale-transport"
          label="نحوه اتصال"
          value={settings.transport}
          onChange={(e) => {
            const transport = e.target.value as SadrScaleTransport;
            persist({ transport });
          }}
        >
          <MenuItem value="web_serial" disabled={!webSerialOk}>
            USB مستقیم (بدون QZ){!webSerialOk ? " — مرورگر پشتیبانی نمی‌کند" : ""}
          </MenuItem>
          <MenuItem value="qz">پورت COM با QZ Tray</MenuItem>
        </Select>
      </FormControl>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
          gap: 1,
          alignItems: "start",
        }}
      >
        <FormControl size="small" sx={{ ...fieldSx, minWidth: 110 }}>
          <InputLabel id="sadr-scale-baud">Baud</InputLabel>
          <Select
            labelId="sadr-scale-baud"
            label="Baud"
            value={settings.baudRate}
            onChange={(e) => persist({ baudRate: Number(e.target.value) })}
          >
            {SADR_SCALE_BAUD_OPTIONS.map((b) => (
              <MenuItem key={b} value={b}>
                {b}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {settings.transport === "web_serial" ? (
          <Button
            size="small"
            variant="outlined"
            startIcon={pickingUsb ? <CircularProgress size={14} /> : <UsbIcon />}
            disabled={pickingUsb || testing || !webSerialOk}
            onClick={() => void pickUsb()}
            sx={{ ...btnSx, color: "var(--admin-accent)", borderColor: "var(--admin-accent)", height: 40 }}
          >
            انتخاب دستگاه USB
          </Button>
        ) : (
          <Button
            size="small"
            variant="outlined"
            startIcon={loadingPorts ? <CircularProgress size={14} /> : <RefreshIcon />}
            disabled={loadingPorts || testing}
            onClick={() => void refreshPorts()}
            sx={{ ...btnSx, color: "var(--admin-accent)", borderColor: "var(--admin-accent)", height: 40 }}
          >
            پورت‌ها
          </Button>
        )}
      </Box>

      {settings.transport === "web_serial" ? (
        <Typography sx={{ color: usbReady || settings.deviceLabel ? "var(--admin-accent)" : "var(--admin-text-muted)", fontSize: 12 }}>
          {settings.deviceLabel
            ? `دستگاه: ${settings.deviceLabel}${usbReady ? " · آماده" : " · یک‌بار دوباره انتخاب کنید"}`
            : "هنوز دستگاهی انتخاب نشده — ترازو را با USB وصل کنید و دکمه بالا را بزنید"}
        </Typography>
      ) : (
        <>
          <FormControl size="small" fullWidth sx={fieldSx}>
            <InputLabel id="sadr-scale-port">پورت COM</InputLabel>
            <Select
              labelId="sadr-scale-port"
              label="پورت COM"
              value={settings.port}
              onChange={(e) => persist({ port: String(e.target.value) })}
            >
              <MenuItem value="">
                <em>انتخاب نشده</em>
              </MenuItem>
              {portOptions.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {!ports.length ? (
            <TextField
              size="small"
              label="پورت دستی (مثلاً COM3)"
              value={settings.port}
              onChange={(e) =>
                persist({ port: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) })
              }
              placeholder="COM3"
              sx={fieldSx}
            />
          ) : null}
        </>
      )}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        <Button
          size="small"
          variant="contained"
          startIcon={testing ? <CircularProgress size={14} color="inherit" /> : <CableIcon />}
          disabled={testing || (!canTest && settings.transport === "qz")}
          onClick={() => void runTest()}
          sx={{
            ...btnSx,
            bgcolor: "var(--admin-accent)",
            color: "#fff",
            "&:hover": { bgcolor: "var(--admin-accent-hover)" },
          }}
        >
          {testing ? "در حال تست…" : "تست اتصال ترازو"}
        </Button>
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11 }}>
          حدود ۴ ثانیه از USB می‌خواند؛ اگر خالی بود فرمان وزن هم می‌فرستد
        </Typography>
      </Box>

      {(testMessage || liveRaw || liveWeight != null) && (
        <Box
          sx={{
            p: 1.25,
            borderRadius: "8px",
            border: "1px solid var(--admin-border)",
            bgcolor: "var(--admin-surface-alt)",
          }}
        >
          {liveWeight != null ? (
            <Typography sx={{ color: "var(--admin-accent)", fontWeight: 800, fontSize: 22, direction: "ltr" }}>
              {liveWeight}{" "}
              <Typography component="span" sx={{ fontSize: 13, fontWeight: 600, color: "var(--admin-text-muted)" }}>
                کیلو
              </Typography>
            </Typography>
          ) : null}
          {testMessage ? (
            <Typography sx={{ color: "var(--admin-text)", fontSize: 12.5, mt: liveWeight != null ? 0.5 : 0 }}>
              {testMessage}
            </Typography>
          ) : null}
          {liveRaw ? (
            <Typography
              component="pre"
              sx={{
                mt: 0.75,
                mb: 0,
                fontSize: 11,
                color: "var(--admin-text-muted)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                direction: "ltr",
                textAlign: "left",
                fontFamily: "ui-monospace, Consolas, monospace",
              }}
            >
              {liveRaw || "(خالی)"}
            </Typography>
          ) : null}
        </Box>
      )}
    </Box>
  );
}
