"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PlaceIcon from "@mui/icons-material/Place";
import { toast } from "react-toastify";
import { isRepairError, repairApi, type LatLng, type RepairMapProvider, type RepairPublicConfig } from "@/app/lib/repair/api";

const NESHAN_SDK = "https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8";
const LEAFLET_CDNS = ["https://unpkg.com/leaflet@1.9.4/dist", "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist"];
const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_CENTER: [number, number] = [35.6997, 51.338];

export type MapSource = { provider: RepairMapProvider; mapKey: string };

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
  map: (el: HTMLElement, options: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: LeafletMap) => unknown };
  marker: (latlng: [number, number]) => { addTo: (map: LeafletMap) => unknown };
};

type LeafletWindow = Window & { L?: LeafletGlobal };

/** سرویس نقشه از تنظیمات؛ نشان بدون کلید ممکن نیست و به OpenStreetMap برمی‌گردد. */
export function mapSourceFrom(config: RepairPublicConfig): MapSource {
  const mapKey = config.neshan_map_key || "";
  const provider: RepairMapProvider = config.map_provider === "osm" || !mapKey ? "osm" : "neshan";
  return { provider, mapKey };
}

function loadAssets(base: string): Promise<LeafletGlobal> {
  const w = window as LeafletWindow;
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${base}/index.css"], link[href="${base}/leaflet.css"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = base === NESHAN_SDK ? `${base}/index.css` : `${base}/leaflet.css`;
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = base === NESHAN_SDK ? `${base}/index.js` : `${base}/leaflet.js`;
    script.async = true;
    script.onload = () => (w.L?.Map ? resolve(w.L) : reject(new Error("leaflet")));
    script.onerror = () => {
      script.remove();
      reject(new Error("leaflet"));
    };
    document.body.appendChild(script);
  });
}

let neshanPromise: Promise<LeafletGlobal> | null = null;
let leafletPromise: Promise<LeafletGlobal> | null = null;

function loadNeshanSdk(): Promise<LeafletGlobal> {
  if (!neshanPromise) {
    neshanPromise = loadAssets(NESHAN_SDK).catch((err) => {
      neshanPromise = null;
      throw err;
    });
  }
  return neshanPromise;
}

function loadLeaflet(): Promise<LeafletGlobal> {
  const w = window as LeafletWindow;
  if (w.L?.tileLayer) return Promise.resolve(w.L);
  if (!leafletPromise) {
    leafletPromise = LEAFLET_CDNS.reduce<Promise<LeafletGlobal>>(
      (prev, base) => prev.catch(() => loadAssets(base)),
      Promise.reject(new Error("start")),
    ).catch((err) => {
      leafletPromise = null;
      throw err;
    });
  }
  return leafletPromise;
}

async function createMap(el: HTMLElement, source: MapSource, center: [number, number], zoom: number) {
  if (source.provider === "neshan") {
    try {
      const L = await loadNeshanSdk();
      const map = new L.Map(el, { key: source.mapKey, maptype: "neshan", poi: true, traffic: false, center, zoom });
      return { L, map };
    } catch {
      /* در صورت خطای SDK نشان، OpenStreetMap */
    }
  }
  const L = await loadLeaflet();
  const map = L.map(el, { center, zoom });
  L.tileLayer(OSM_TILES, {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
  }).addTo(map);
  return { L, map };
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

function useRepairMap(source: MapSource, initial: LatLng | null, onReady: (L: LeafletGlobal, map: LeafletMap) => void) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const initialRef = useRef(initial);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const { provider, mapKey } = source;

  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;
    setState("loading");
    const start = initialRef.current;
    createMap(el, { provider, mapKey }, start ? [start.lat, start.lng] : DEFAULT_CENTER, start ? 16 : 12)
      .then(({ L, map }) => {
        if (cancelled) {
          map.remove();
          return;
        }
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
  }, [provider, mapKey]);

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

function MapBox({ containerRef, state, height }: { containerRef: React.RefObject<HTMLDivElement | null>; state: string; height: number }) {
  return (
    <Box sx={{ position: "relative", height, borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
      <Box ref={containerRef} dir="ltr" sx={{ position: "absolute", inset: 0 }} />
      {state === "loading" && (
        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f5f5f5", zIndex: 1001 }}>
          <CircularProgress size={26} />
        </Box>
      )}
    </Box>
  );
}

/** انتخاب لوکیشن: پین وسط نقشه ثابت است و کاربر نقشه را جابه‌جا می‌کند. */
export function LocationPicker({
  source,
  value,
  onChange,
  onAddress,
  required,
}: {
  source: MapSource;
  value: LatLng | null;
  onChange: (point: LatLng | null) => void;
  onAddress?: (address: string) => void;
  required?: boolean;
}) {
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { containerRef, mapRef, state } = useRepairMap(source, value, (_L, map) => {
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

  const noMap = state === "error";

  return (
    <Stack spacing={1}>
      <Typography variant="body2" fontWeight={700}>
        موقعیت روی نقشه {required ? "(الزامی)" : "(اختیاری)"}
      </Typography>

      {noMap ? (
        <Alert severity="info" icon={<PlaceIcon />}>
          نقشه بارگذاری نشد. با دکمهٔ زیر موقعیت فعلی خودتان را ثبت کنید.
        </Alert>
      ) : (
        <Box sx={{ position: "relative" }}>
          <MapBox containerRef={containerRef} state={state} height={280} />
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
export function LocationView({ source, point }: { source: MapSource; point: LatLng }) {
  const { containerRef, state } = useRepairMap(source, point, (L, map) => {
    L.marker([point.lat, point.lng]).addTo(map);
  });
  const links = mapLinks(point);

  return (
    <Stack spacing={1}>
      {state !== "error" && <MapBox containerRef={containerRef} state={state} height={220} />}
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
