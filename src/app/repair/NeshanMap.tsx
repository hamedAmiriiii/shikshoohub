"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PlaceIcon from "@mui/icons-material/Place";
import { toast } from "react-toastify";
import { isRepairError, repairApi, type LatLng } from "@/app/lib/repair/api";

const SDK_BASE = "https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8";
const DEFAULT_CENTER: [number, number] = [35.6997, 51.338];

type LeafletMap = {
  setView: (center: [number, number], zoom?: number) => void;
  getCenter: () => { lat: number; lng: number };
  getZoom: () => number;
  on: (event: string, handler: () => void) => void;
  invalidateSize: () => void;
  remove: () => void;
};

type LeafletGlobal = {
  Map: new (el: HTMLElement, options: Record<string, unknown>) => LeafletMap;
  marker: (latlng: [number, number]) => { addTo: (map: LeafletMap) => unknown };
};

let sdkPromise: Promise<LeafletGlobal> | null = null;

function loadNeshanSdk(): Promise<LeafletGlobal> {
  const w = window as Window & { L?: LeafletGlobal };
  if (w.L?.Map) return Promise.resolve(w.L);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${SDK_BASE}/index.css"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${SDK_BASE}/index.css`;
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = `${SDK_BASE}/index.js`;
    script.async = true;
    script.onload = () => (w.L?.Map ? resolve(w.L) : reject(new Error("neshan sdk")));
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("neshan sdk"));
    };
    document.body.appendChild(script);
  });
  return sdkPromise;
}

function round(value: number) {
  return Math.round(value * 1e6) / 1e6;
}

export function mapLinks(point: LatLng) {
  return {
    neshan: `https://neshan.org/maps/@${point.lat},${point.lng},17z,0p`,
    balad: `https://balad.ir/location?latitude=${point.lat}&longitude=${point.lng}&zoom=17`,
  };
}

function useNeshanMap(
  mapKey: string,
  initial: LatLng | null,
  onReady: (L: LeafletGlobal, map: LeafletMap) => void,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const initialRef = useRef(initial);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    let cancelled = false;
    loadNeshanSdk()
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        const start = initialRef.current;
        const map = new L.Map(containerRef.current, {
          key: mapKey,
          maptype: "neshan",
          poi: true,
          traffic: false,
          center: start ? [start.lat, start.lng] : DEFAULT_CENTER,
          zoom: start ? 16 : 12,
        });
        mapRef.current = map;
        setState("ready");
        onReadyRef.current(L, map);
        window.setTimeout(() => map.invalidateSize(), 200);
      })
      .catch(() => !cancelled && setState("error"));

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mapKey]);

  return { containerRef, mapRef, state };
}

function locateMe(onFound: (point: LatLng) => void, setBusy: (busy: boolean) => void) {
  if (!navigator.geolocation) {
    toast.error("مرورگر شما موقعیت‌یابی را پشتیبانی نمی‌کند.");
    return;
  }
  setBusy(true);
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setBusy(false);
      onFound({ lat: round(pos.coords.latitude), lng: round(pos.coords.longitude) });
    },
    () => {
      setBusy(false);
      toast.error("دسترسی به موقعیت داده نشد. GPS و اجازهٔ مرورگر را بررسی کنید.");
    },
    { enableHighAccuracy: true, timeout: 15000 },
  );
}

/** انتخاب لوکیشن: پین وسط نقشه ثابت است و کاربر نقشه را جابه‌جا می‌کند. */
export function LocationPicker({
  mapKey,
  value,
  onChange,
  onAddress,
  required,
}: {
  mapKey: string;
  value: LatLng | null;
  onChange: (point: LatLng | null) => void;
  onAddress?: (address: string) => void;
  required?: boolean;
}) {
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { containerRef, mapRef, state } = useNeshanMap(mapKey, value, (_L, map) => {
    map.on("moveend", () => {
      const c = map.getCenter();
      onChangeRef.current({ lat: round(c.lat), lng: round(c.lng) });
    });
  });

  useEffect(() => {
    if (!value) {
      setAddress(null);
      return;
    }
    const t = window.setTimeout(() => {
      void repairApi.reverseGeocode(value).then((res) => {
        setAddress(isRepairError(res) ? null : res.address);
      });
    }, 600);
    return () => window.clearTimeout(t);
  }, [value]);

  const handleLocate = () =>
    locateMe((point) => {
      if (mapRef.current) mapRef.current.setView([point.lat, point.lng], 17);
      onChange(point);
    }, setLocating);

  const noMap = !mapKey || state === "error";

  return (
    <Stack spacing={1}>
      <Typography variant="body2" fontWeight={700}>
        موقعیت روی نقشه {required ? "(الزامی)" : "(اختیاری)"}
      </Typography>

      {noMap ? (
        <Alert severity="info" icon={<PlaceIcon />}>
          {mapKey ? "نقشه بارگذاری نشد. " : ""}با دکمهٔ زیر موقعیت فعلی خودتان را ثبت کنید.
        </Alert>
      ) : (
        <Box sx={{ position: "relative", height: 280, borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
          <Box ref={containerRef} dir="ltr" sx={{ position: "absolute", inset: 0 }} />
          {state === "loading" && (
            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f5f5f5" }}>
              <CircularProgress size={26} />
            </Box>
          )}
          {state === "ready" && (
            <PlaceIcon
              color="error"
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                fontSize: 42,
                transform: "translate(-50%, -100%)",
                pointerEvents: "none",
                zIndex: 1000,
                filter: "drop-shadow(0 2px 2px rgba(0,0,0,.35))",
              }}
            />
          )}
        </Box>
      )}

      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Button size="small" variant="outlined" startIcon={locating ? <CircularProgress size={14} /> : <MyLocationIcon />} onClick={handleLocate} disabled={locating}>
          موقعیت فعلی من
        </Button>
        {value && !required && (
          <Button size="small" color="inherit" onClick={() => onChange(null)}>
            حذف موقعیت
          </Button>
        )}
      </Stack>

      {value ? (
        <Stack spacing={0.5}>
          <Typography variant="caption" color="success.main">
            موقعیت انتخاب شد{noMap ? ` (${value.lat}, ${value.lng})` : ""}.
          </Typography>
          {address && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
                {address}
              </Typography>
              {onAddress && (
                <Button size="small" onClick={() => onAddress(address)} sx={{ flexShrink: 0 }}>
                  درج در آدرس
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      ) : (
        !noMap && (
          <Typography variant="caption" color="text.secondary">
            نقشه را جابه‌جا کنید تا پین روی محل دقیق قرار بگیرد.
          </Typography>
        )
      )}
    </Stack>
  );
}

/** نمایش لوکیشن ثبت‌شده با لینک مسیریابی نشان و بلد. */
export function LocationView({ mapKey, point }: { mapKey: string; point: LatLng }) {
  const { containerRef, state } = useNeshanMap(mapKey, point, (L, map) => {
    L.marker([point.lat, point.lng]).addTo(map);
  });
  const links = mapLinks(point);

  return (
    <Stack spacing={1}>
      {mapKey && state !== "error" && (
        <Box sx={{ position: "relative", height: 220, borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
          <Box ref={containerRef} dir="ltr" sx={{ position: "absolute", inset: 0 }} />
          {state === "loading" && (
            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f5f5f5" }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>
      )}
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="outlined" href={links.neshan} target="_blank" rel="noreferrer" fullWidth>
          مسیریابی با نشان
        </Button>
        <Button size="small" variant="outlined" href={links.balad} target="_blank" rel="noreferrer" fullWidth>
          مسیریابی با بلد
        </Button>
      </Stack>
    </Stack>
  );
}
