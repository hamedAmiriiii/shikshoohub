"use client";

import AddIcon from "@mui/icons-material/Add";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import RemoveIcon from "@mui/icons-material/Remove";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { Box, ButtonBase, IconButton, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { APP_FONT_FAMILY } from "@/app/lib/appFont";
import type { ReservMenuItem, ReservMenuLayoutProps } from "./ReservMenuLayouts";
import { useReservI18n } from "./reservI18n";

/* ───────────── انواع ───────────── */

export type ThreeDIngredient = {
  raw_material_id: number;
  name: string;
  image_url: string | null;
  is_removable: boolean;
  /** سهم این ماده از قیمت کالا (تومان) */
  price: number;
};

export type ThreeDLayer = {
  key: string;
  raw_material_id: number;
  name: string;
  image_url: string;
};

export type ThreeDData = {
  ingredients: ThreeDIngredient[];
  layers: ThreeDLayer[];
};

/* ───────────── رنگ و انیمیشن ───────────── */

const ACCENT = "#ff9f43";
const ACCENT_2 = "#ff5e62";
const ACCENT_GRADIENT = `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_2} 100%)`;
const GLASS = "rgba(255,255,255,0.07)";
const GLASS_BORDER = "rgba(255,255,255,0.14)";

const EASE_OUT = "cubic-bezier(0.2, 0.85, 0.25, 1)";
const EASE_SPRING = "cubic-bezier(0.34, 1.4, 0.5, 1)";

const KEYFRAMES = {
  "@keyframes td3Drop": {
    "0%": { opacity: 0, transform: "translateY(-70px) scale(0.92)" },
    "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
  },
  "@keyframes td3Float": {
    "0%": { transform: "translateY(0)" },
    "100%": { transform: "translateY(-7px)" },
  },
  "@keyframes td3Shadow": {
    "0%": { transform: "scaleX(1)", opacity: 0.55 },
    "100%": { transform: "scaleX(0.9)", opacity: 0.38 },
  },
  "@keyframes td3FromLeft": {
    "0%": { opacity: 0, transform: "translateX(-60px)" },
    "100%": { opacity: 1, transform: "translateX(0)" },
  },
  "@keyframes td3FromRight": {
    "0%": { opacity: 0, transform: "translateX(60px)" },
    "100%": { opacity: 1, transform: "translateX(0)" },
  },
  "@keyframes td3Rise": {
    "0%": { opacity: 0, transform: "translateY(18px)" },
    "100%": { opacity: 1, transform: "translateY(0)" },
  },
  "@keyframes td3Pop": {
    "0%": { transform: "scale(1.18)" },
    "100%": { transform: "scale(1)" },
  },
  "@keyframes td3Fade": {
    "0%": { opacity: 0 },
    "100%": { opacity: 1 },
  },
  "@keyframes td3Orbit": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
  "@media (prefers-reduced-motion: reduce)": {
    "*": { animation: "none !important", transition: "none !important" },
  },
} as const;

function hueFor(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) % 360;
  return hash;
}

/* ───────────── پشت‌صحنه ───────────── */

export function ThreeDBackdrop({ contained }: { contained?: boolean }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: contained ? "absolute" : "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
        background: "linear-gradient(180deg, #14101f 0%, #0a0912 55%, #07070d 100%)",
        ...KEYFRAMES,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: "80vmax",
          height: "80vmax",
          top: "-35vmax",
          insetInlineStart: "-25vmax",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,159,67,0.22) 0%, transparent 62%)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: "70vmax",
          height: "70vmax",
          bottom: "-30vmax",
          insetInlineEnd: "-20vmax",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,94,98,0.16) 0%, transparent 62%)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
    </Box>
  );
}

/* ───────────── پشتهٔ لایه‌ها ───────────── */

function EmptyStack({ compact }: { compact?: boolean }) {
  const { t } = useReservI18n();
  return (
    <Box
      sx={{
        width: "82%",
        aspectRatio: "1 / 1",
        mx: "auto",
        borderRadius: "50%",
        border: "2px dashed rgba(255,255,255,0.22)",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        color: "rgba(255,255,255,0.55)",
        p: 1,
      }}
    >
      <Box>
        <RestaurantMenuIcon sx={{ fontSize: compact ? 28 : 40, opacity: 0.8 }} />
        <Typography sx={{ fontSize: 10.5, lineHeight: 1.6, mt: 0.5 }}>{t("threedNoLayers")}</Typography>
      </Box>
    </Box>
  );
}

type StackLayer = ThreeDLayer & { gone: boolean; isExtra?: boolean };

/** لایه‌های قابل نمایش: حذف‌شده‌ها gone، موادِ اضافه‌شده یک لایهٔ تکراری می‌گیرند. */
function buildStackLayers(
  layers: ThreeDLayer[],
  removed: ReadonlySet<number>,
  extras: ReadonlySet<number>,
): StackLayer[] {
  const out: StackLayer[] = [];
  const duplicated = new Set<number>();
  for (const layer of layers) {
    const gone = removed.has(layer.raw_material_id);
    out.push({ ...layer, gone });
    if (!gone && extras.has(layer.raw_material_id) && !duplicated.has(layer.raw_material_id)) {
      duplicated.add(layer.raw_material_id);
      out.push({ ...layer, key: `${layer.key}-extra`, gone: false, isExtra: true });
    }
  }
  return out;
}

/**
 * لایه‌ها از بالا به پایین روی هم می‌نشینند؛ لایهٔ برداشته‌شده با انیمیشن
 * به کنار پرواز می‌کند و بقیه روی هم می‌نشینند.
 */
function LayerStack({
  layers,
  removed,
  extras,
  compact,
}: {
  layers: ThreeDLayer[];
  removed: ReadonlySet<number>;
  extras?: ReadonlySet<number>;
  compact?: boolean;
}) {
  const stack = useMemo(
    () => buildStackLayers(layers, removed, extras ?? new Set()),
    [layers, removed, extras],
  );
  if (layers.length === 0) return <EmptyStack compact={compact} />;
  const total = stack.length;
  return (
    <Box sx={{ width: "100%", position: "relative", transformStyle: "preserve-3d" }}>
      {stack.map((layer, index) => {
        const gone = layer.gone;
        const side = index % 2 === 0 ? -1 : 1;
        const depth = (total - index) * 5;
        return (
          <Box
            key={layer.key}
            sx={{
              display: "grid",
              gridTemplateRows: gone ? "0fr" : "1fr",
              marginTop: gone || index === 0 ? 0 : "-6.5%",
              position: "relative",
              zIndex: total - index,
              transformStyle: "preserve-3d",
              transition: `grid-template-rows 560ms ${EASE_OUT}, margin-top 560ms ${EASE_OUT}`,
              animation: `td3Drop 640ms ${EASE_SPRING} ${index * 70}ms both`,
            }}
          >
            <Box sx={{ minHeight: 0, transformStyle: "preserve-3d" }}>
              <Box
                component="img"
                src={layer.image_url}
                alt={layer.name}
                draggable={false}
                sx={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  userSelect: "none",
                  pointerEvents: "none",
                  filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.38))",
                  opacity: gone ? 0 : 1,
                  transform: gone
                    ? `translate3d(${side * 130}%, -26%, ${depth + 30}px) rotate(${side * 22}deg) scale(0.72)`
                    : `translate3d(0, 0, ${depth}px)`,
                  transition: `transform 620ms cubic-bezier(0.55, -0.15, 0.3, 1.1), opacity 420ms ease ${gone ? "80ms" : "0ms"}`,
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

/* ───────────── کارت گالری ───────────── */

function ThreeDCard({
  item,
  index,
  onOpen,
  compact,
}: {
  item: ReservMenuItem;
  index: number;
  onOpen: () => void;
  compact?: boolean;
}) {
  const { t, formatNumber } = useReservI18n();
  const data = item.threed as ThreeDData;
  const hue = hueFor(item.name);
  const none = useMemo(() => new Set<number>(), []);
  return (
    <ButtonBase
      onClick={onOpen}
      aria-label={item.name}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        textAlign: "start",
        fontFamily: APP_FONT_FAMILY,
        color: "#fff",
        borderRadius: "28px",
        overflow: "hidden",
        position: "relative",
        bgcolor: GLASS,
        border: `1px solid ${GLASS_BORDER}`,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
        animation: `td3Rise 520ms ${EASE_OUT} ${Math.min(index, 8) * 70}ms both`,
        transition: `transform 260ms ${EASE_OUT}, border-color 200ms ease`,
        "&:hover": { transform: "translateY(-4px)", borderColor: "rgba(255,159,67,0.55)" },
        "&:active": { transform: "scale(0.98)" },
        "&:hover .td3-card-stack": { transform: "rotateX(14deg) rotateY(-14deg) scale(1.05)" },
        opacity: item.outOfStock ? 0.6 : 1,
      }}
    >
      <Box
        sx={{
          position: "relative",
          pt: compact ? 2 : 2.5,
          pb: 1,
          px: compact ? 2 : 3,
          perspective: "700px",
          background: `radial-gradient(70% 60% at 50% 55%, hsla(${hue}, 90%, 58%, 0.30) 0%, transparent 70%)`,
        }}
      >
        <Box
          className="td3-card-stack"
          sx={{
            transform: "rotateX(10deg) rotateY(0deg)",
            transformStyle: "preserve-3d",
            transition: `transform 420ms ${EASE_OUT}`,
          }}
        >
          <LayerStack layers={data.layers} removed={none} compact />
        </Box>
        <Box
          aria-hidden
          sx={{
            mx: "auto",
            mt: 1.2,
            width: "62%",
            height: 10,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)",
          }}
        />
      </Box>
      <Box sx={{ px: 1.4, pb: 1.4, pt: 0.2 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 15, lineHeight: 1.45 }}>{item.name}</Typography>
        <Box sx={{ mt: 0.4, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 15,
              background: ACCENT_GRADIENT,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {formatNumber(item.price)}
            <Box component="span" sx={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginInlineStart: 0.5, WebkitTextFillColor: "rgba(255,255,255,0.65)" }}>
              {t("toman")}
            </Box>
          </Typography>
          {item.outOfStock ? (
            <Box
              sx={{
                fontSize: 10.5,
                fontWeight: 700,
                px: 1,
                py: 0.3,
                borderRadius: 999,
                bgcolor: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {t("outOfStock")}
            </Box>
          ) : (
            <Box
              aria-hidden
              sx={{
                width: 30,
                height: 30,
                borderRadius: "10px",
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.9)",
                border: `1px solid ${GLASS_BORDER}`,
              }}
            >
              <VisibilityRoundedIcon sx={{ fontSize: 17 }} />
            </Box>
          )}
        </Box>
      </Box>
    </ButtonBase>
  );
}

/* ───────────── ردیف ماده ───────────── */

function IngredientRow({
  ingredient,
  checked,
  extra,
  onToggle,
  onToggleExtra,
  index,
}: {
  ingredient: ThreeDIngredient;
  checked: boolean;
  extra: boolean;
  onToggle: () => void;
  onToggleExtra: () => void;
  index: number;
}) {
  const { t, formatNumber } = useReservI18n();
  const locked = !ingredient.is_removable;
  const qtyLabel = checked ? (extra ? "×۲" : "×۱") : "×۰";
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 0.45,
        p: 0.55,
        borderRadius: "14px",
        fontFamily: APP_FONT_FAMILY,
        color: "#fff",
        bgcolor: checked ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${checked ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
        transition: "background-color 220ms ease, border-color 220ms ease",
        animation: `td3Rise 420ms ${EASE_OUT} ${120 + index * 40}ms both`,
      }}
    >
      <ButtonBase
        role="checkbox"
        aria-checked={checked}
        aria-disabled={locked}
        disabled={locked}
        onClick={onToggle}
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 0.65,
          textAlign: "start",
          color: "#fff",
          borderRadius: "10px",
          py: 0.15,
          fontFamily: APP_FONT_FAMILY,
          "&.Mui-disabled": { color: "#fff", opacity: 0.95 },
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            flexShrink: 0,
            borderRadius: "10px",
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(255,255,255,0.08)",
            overflow: "hidden",
            filter: checked ? "none" : "grayscale(1)",
            opacity: checked ? 1 : 0.45,
            transition: "opacity 260ms ease, filter 260ms ease",
          }}
        >
          {ingredient.image_url ? (
            <Box component="img" src={ingredient.image_url} alt="" sx={{ width: "88%", height: "88%", objectFit: "contain" }} />
          ) : (
            <RestaurantMenuIcon sx={{ fontSize: 15, color: "rgba(255,255,255,0.6)" }} />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 12,
              lineHeight: 1.25,
              textDecoration: checked ? "none" : "line-through",
              opacity: checked ? 1 : 0.55,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {ingredient.name}
            <Box component="span" sx={{ marginInlineStart: 0.4, fontSize: 10, fontWeight: 700, color: extra ? ACCENT : "rgba(255,255,255,0.45)" }}>
              {qtyLabel}
            </Box>
          </Typography>
          <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.6)", opacity: checked ? 1 : 0.5 }}>
            {formatNumber(ingredient.price * (extra ? 2 : checked ? 1 : 0))} {t("toman")}
          </Typography>
        </Box>
        {locked ? (
          <Box
            title={t("threedFixed")}
            sx={{
              width: 22,
              height: 22,
              flexShrink: 0,
              borderRadius: "7px",
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(255,255,255,0.09)",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            <LockRoundedIcon sx={{ fontSize: 12 }} />
          </Box>
        ) : (
          <Box
            sx={{
              width: 22,
              height: 22,
              flexShrink: 0,
              borderRadius: "7px",
              display: "grid",
              placeItems: "center",
              color: "#1b1206",
              background: checked ? ACCENT_GRADIENT : "transparent",
              border: checked ? "1px solid transparent" : "2px solid rgba(255,255,255,0.3)",
              boxShadow: checked ? "0 4px 10px rgba(255,94,98,0.35)" : "none",
            }}
          >
            <CheckRoundedIcon sx={{ fontSize: 14, opacity: checked ? 1 : 0 }} />
          </Box>
        )}
      </ButtonBase>
      {checked ? (
        <IconButton
          size="small"
          aria-label={extra ? t("threedRemoveExtra") : t("threedAddExtra")}
          onClick={onToggleExtra}
          sx={{
            width: 28,
            height: 28,
            flexShrink: 0,
            color: extra ? "#1b1206" : "#fff",
            background: extra ? ACCENT_GRADIENT : "rgba(255,255,255,0.1)",
            border: `1px solid ${extra ? "transparent" : GLASS_BORDER}`,
            boxShadow: extra ? "0 4px 12px rgba(255,94,98,0.4)" : "none",
            "&:hover": { bgcolor: extra ? undefined : "rgba(255,255,255,0.18)" },
          }}
        >
          {extra ? <RemoveIcon sx={{ fontSize: 16 }} /> : <AddIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      ) : (
        <Box sx={{ width: 28, height: 28, flexShrink: 0 }} />
      )}
    </Box>
  );
}

/* ───────────── صفحهٔ تمام‌صفحهٔ جزئیات ───────────── */

function ThreeDDetail({
  list,
  index,
  removed,
  extras,
  onToggle,
  onToggleExtra,
  onClose,
  onGo,
  onAdd,
  compact,
}: {
  list: ReservMenuItem[];
  index: number;
  removed: ReadonlySet<number>;
  extras: ReadonlySet<number>;
  onToggle: (materialId: number) => void;
  onToggleExtra: (materialId: number) => void;
  onClose: () => void;
  onGo: (nextIndex: number, direction: "next" | "prev") => void;
  onAdd: (qty: number) => void;
  compact?: boolean;
}) {
  const { t, formatNumber } = useReservI18n();
  const item = list[index];
  const data = item.threed as ThreeDData;
  const hue = hueFor(item.name);
  const hasOthers = list.length > 1;
  const nextIndex = (index + 1) % list.length;
  const prevIndex = (index - 1 + list.length) % list.length;
  const nextItem = hasOthers ? list[nextIndex] : null;

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [tilt, setTilt] = useState({ x: 7, y: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const swipeStart = useRef<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQty(1);
    setAdded(false);
  }, [item.key]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  const removedPrice = data.ingredients.reduce(
    (sum, row) => (row.is_removable && removed.has(row.raw_material_id) ? sum + row.price : sum),
    0,
  );
  const extraPrice = data.ingredients.reduce(
    (sum, row) =>
      !removed.has(row.raw_material_id) && extras.has(row.raw_material_id) ? sum + row.price : sum,
    0,
  );
  const unitPrice = Math.max(0, item.price - removedPrice + extraPrice);
  const removedNames = data.ingredients
    .filter((row) => row.is_removable && removed.has(row.raw_material_id))
    .map((row) => row.name);
  const extraNames = data.ingredients
    .filter((row) => !removed.has(row.raw_material_id) && extras.has(row.raw_material_id))
    .map((row) => row.name);

  const go = useCallback(
    (to: number, dir: "next" | "prev") => {
      setDirection(dir);
      onGo(to, dir);
    },
    [onGo],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      // محصول بعدی سمت چپ است
      if (event.key === "ArrowLeft" && hasOthers) go(nextIndex, "next");
      if (event.key === "ArrowRight" && hasOthers) go(prevIndex, "prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, hasOthers, nextIndex, onClose, prevIndex]);

  useEffect(() => {
    if (compact) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [compact]);

  const onStagePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el || event.pointerType === "touch") return;
    const rect = el.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, (event.clientX - rect.left - rect.width / 2) / (rect.width / 2)));
    const ny = Math.max(-1, Math.min(1, (event.clientY - rect.top - rect.height / 2) / (rect.height / 2)));
    setTilt({ x: 7 - ny * 8, y: nx * 16 });
  };

  const onStagePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    swipeStart.current = event.clientX;
  };

  const onStagePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (start == null || !hasOthers) return;
    const dx = event.clientX - start;
    // کشیدن به راست، محصول چپ (بعدی) را به مرکز می‌آورد
    if (dx > 70) go(nextIndex, "next");
    else if (dx < -70) go(prevIndex, "prev");
  };

  const handleAdd = () => {
    if (item.outOfStock || added) return;
    onAdd(qty);
    setAdded(true);
    closeTimer.current = setTimeout(onClose, 750);
  };

  const stackWidth = compact ? "min(46%, 170px)" : "min(58vw, 36vh, 330px)";

  const detail = (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
      sx={{
        position: compact ? "absolute" : "fixed",
        inset: 0,
        zIndex: compact ? 40 : 1400,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        color: "#fff",
        fontFamily: APP_FONT_FAMILY,
        background: "linear-gradient(180deg, #15101f 0%, #09080f 60%, #06060b 100%)",
        animation: "td3Fade 260ms ease both",
        ...KEYFRAMES,
      }}
    >
      {/* درخشش رنگی هر محصول */}
      <Box
        key={`glow-${item.key}`}
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(60% 42% at 50% 34%, hsla(${hue}, 95%, 58%, 0.34) 0%, transparent 72%)`,
          animation: "td3Fade 700ms ease both",
        }}
      />

      {/* نوار بالا */}
      <Box
        sx={{
          position: "relative",
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          px: 1.25,
          pt: compact ? 1.2 : "max(12px, env(safe-area-inset-top))",
        }}
      >
        <ButtonBase
          onClick={onClose}
          aria-label={t("threedBackToMenu")}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            px: 1.2,
            py: 0.75,
            borderRadius: 999,
            fontFamily: APP_FONT_FAMILY,
            fontWeight: 800,
            fontSize: 13,
            color: "#fff",
            bgcolor: "rgba(255,255,255,0.12)",
            border: `1px solid ${GLASS_BORDER}`,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            "&:active": { transform: "scale(0.97)" },
          }}
        >
          <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
          {t("threedBackToMenu")}
        </ButtonBase>
        {hasOthers ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.55 }} aria-label={`${index + 1}/${list.length}`}>
            {list.slice(0, 9).map((entry, i) => (
              <Box
                key={entry.key}
                sx={{
                  height: 6,
                  width: i === index ? 22 : 6,
                  borderRadius: 99,
                  bgcolor: i === index ? ACCENT : "rgba(255,255,255,0.25)",
                  transition: `width 300ms ${EASE_OUT}, background-color 300ms ease`,
                }}
              />
            ))}
          </Box>
        ) : (
          <span />
        )}
        <Typography sx={{ minWidth: 40, textAlign: "end", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
          {hasOthers ? `${formatNumber(index + 1)} / ${formatNumber(list.length)}` : ""}
        </Typography>
      </Box>

      {/* صحنه */}
      <Box
        ref={stageRef}
        onPointerMove={onStagePointerMove}
        onPointerLeave={() => setTilt({ x: 7, y: 0 })}
        onPointerDown={onStagePointerDown}
        onPointerUp={onStagePointerUp}
        onPointerCancel={() => {
          swipeStart.current = null;
        }}
        sx={{
          position: "relative",
          zIndex: 2,
          flex: "1 1 0",
          minHeight: compact ? 190 : 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: "1100px",
          touchAction: "pan-y",
        }}
      >
        {/* محصول بعدی — سمت چپ */}
        {nextItem ? (
          <ButtonBase
            onClick={() => go(nextIndex, "next")}
            aria-label={`${t("threedNext")}: ${nextItem.name}`}
            sx={{
              position: "absolute",
              left: compact ? -26 : "clamp(-70px, -4vw, -10px)",
              top: "50%",
              width: compact ? 92 : "clamp(96px, 24vw, 210px)",
              transform: "translateY(-50%)",
              flexDirection: "column",
              fontFamily: APP_FONT_FAMILY,
              color: "#fff",
              zIndex: 4,
              opacity: 0.62,
              transition: `opacity 240ms ease, transform 320ms ${EASE_OUT}`,
              "&:hover": { opacity: 0.95, transform: "translateY(-50%) translateX(8px)" },
            }}
          >
            <Box
              key={`peek-${nextItem.key}`}
              sx={{
                width: "100%",
                perspective: "600px",
                animation: `td3FromLeft 520ms ${EASE_OUT} both`,
              }}
            >
              <Box
                sx={{
                  transform: "rotateX(8deg) rotateY(26deg) scale(0.92)",
                  transformStyle: "preserve-3d",
                  filter: "blur(0.6px)",
                  maskImage: "linear-gradient(to right, transparent 0%, #000 55%)",
                  WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 55%)",
                }}
              >
                <LayerStack layers={(nextItem.threed as ThreeDData).layers} removed={new Set<number>()} compact />
              </Box>
            </Box>
            <Box sx={{ mt: 0.6, display: "flex", alignItems: "center", gap: 0.3, fontSize: 11.5, fontWeight: 800 }}>
              <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
              <Box component="span" sx={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {nextItem.name}
              </Box>
            </Box>
          </ButtonBase>
        ) : null}

        {/* قبلی — دکمهٔ کوچک سمت راست */}
        {hasOthers ? (
          <IconButton
            onClick={() => go(prevIndex, "prev")}
            aria-label={t("threedPrev")}
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 4,
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.08)",
              border: `1px solid ${GLASS_BORDER}`,
              "&:hover": { bgcolor: "rgba(255,255,255,0.16)" },
            }}
          >
            <ChevronRightRoundedIcon />
          </IconButton>
        ) : null}

        {/* مرکز: ساندویچ لایه‌ای */}
        <Box
          key={`stage-${item.key}`}
          sx={{
            width: stackWidth,
            animation: `${direction === "next" ? "td3FromRight" : "td3FromLeft"} 520ms ${EASE_OUT} both`,
          }}
        >
          <Box sx={{ animation: "td3Float 3.2s ease-in-out infinite alternate" }}>
            <Box
              sx={{
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transformStyle: "preserve-3d",
                transition: "transform 240ms ease-out",
              }}
            >
              <LayerStack layers={data.layers} removed={removed} extras={extras} compact={compact} />
            </Box>
          </Box>
          <Box
            aria-hidden
            sx={{
              mx: "auto",
              mt: 1.6,
              width: "78%",
              height: 14,
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, transparent 72%)",
              animation: "td3Shadow 3.2s ease-in-out infinite alternate",
            }}
          />
        </Box>
      </Box>

      {/* پنل پایین */}
      <Box
        key={`sheet-${item.key}`}
        sx={{
          position: "relative",
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          maxHeight: compact ? 330 : "52%",
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          bgcolor: "rgba(22,18,34,0.82)",
          backdropFilter: "blur(22px) saturate(150%)",
          WebkitBackdropFilter: "blur(22px) saturate(150%)",
          borderTop: `1px solid ${GLASS_BORDER}`,
          boxShadow: "0 -20px 50px rgba(0,0,0,0.45)",
          animation: `td3Rise 520ms ${EASE_OUT} both`,
          pb: compact ? 1 : "max(14px, env(safe-area-inset-bottom))",
          maxWidth: 640,
          width: "100%",
          mx: "auto",
        }}
      >
        <Box sx={{ width: 40, height: 4, borderRadius: 99, bgcolor: "rgba(255,255,255,0.25)", mx: "auto", mt: 1 }} />
        <Box sx={{ px: 2, pt: 1.2, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h2" sx={{ fontWeight: 900, fontSize: compact ? 18 : 22, lineHeight: 1.35 }}>
              {item.name}
            </Typography>
            {item.description ? (
              <Typography
                sx={{
                  mt: 0.3,
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.65)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.description}
              </Typography>
            ) : null}
          </Box>
          <Box sx={{ textAlign: "end", flexShrink: 0 }}>
            {removedPrice > 0 ? (
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "line-through" }}>
                {formatNumber(item.price)}
              </Typography>
            ) : null}
            <Typography
              key={unitPrice}
              sx={{
                fontWeight: 900,
                fontSize: compact ? 19 : 24,
                lineHeight: 1.2,
                background: ACCENT_GRADIENT,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                animation: "td3Pop 360ms ease both",
              }}
            >
              {formatNumber(unitPrice)}
              <Box component="span" sx={{ fontSize: 11, fontWeight: 700, marginInlineStart: 0.5, WebkitTextFillColor: "rgba(255,255,255,0.65)" }}>
                {t("toman")}
              </Box>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 2, pt: 1.1, pb: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>
            {t("threedIngredients")}
          </Typography>
          {removedPrice > 0 ? (
            <Box
              sx={{
                fontSize: 11,
                fontWeight: 800,
                px: 1,
                py: 0.25,
                borderRadius: 999,
                color: "#1b1206",
                background: ACCENT_GRADIENT,
                animation: "td3Pop 320ms ease both",
              }}
            >
              {t("threedSaved", { amount: formatNumber(removedPrice) })}
            </Box>
          ) : null}
        </Box>

        <Box
          sx={{
            px: 1.25,
            pb: 1,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 0.65,
            overflowY: "auto",
            minHeight: 0,
            scrollbarWidth: "thin",
            overscrollBehavior: "contain",
          }}
        >
          {data.ingredients.map((ingredient, i) => (
            <IngredientRow
              key={ingredient.raw_material_id}
              ingredient={ingredient}
              index={i}
              checked={!removed.has(ingredient.raw_material_id)}
              extra={extras.has(ingredient.raw_material_id) && !removed.has(ingredient.raw_material_id)}
              onToggle={() => onToggle(ingredient.raw_material_id)}
              onToggleExtra={() => onToggleExtra(ingredient.raw_material_id)}
            />
          ))}
          <Typography sx={{ gridColumn: "1 / -1", fontSize: 11, color: "rgba(255,255,255,0.5)", px: 0.5, pt: 0.2 }}>
            {t("threedHint")}
          </Typography>
        </Box>

        <Box sx={{ px: 1.5, pt: 0.6, display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              p: "4px",
              gap: 0.4,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.09)",
              border: `1px solid ${GLASS_BORDER}`,
            }}
          >
            <IconButton
              size="small"
              aria-label={t("decreaseQty")}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              sx={{ width: 34, height: 34, color: "#fff" }}
            >
              <RemoveIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Typography sx={{ minWidth: 26, textAlign: "center", fontWeight: 900, fontSize: 15 }} aria-live="polite">
              {formatNumber(qty)}
            </Typography>
            <IconButton
              size="small"
              aria-label={t("increaseQty")}
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              sx={{ width: 34, height: 34, color: "#1b1206", background: ACCENT_GRADIENT }}
            >
              <AddIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
          <ButtonBase
            onClick={handleAdd}
            disabled={item.outOfStock}
            sx={{
              flex: 1,
              height: 50,
              borderRadius: "999px",
              fontFamily: APP_FONT_FAMILY,
              fontWeight: 900,
              fontSize: 14.5,
              color: "#1b1206",
              background: added ? "linear-gradient(135deg, #4ade80, #22c55e)" : ACCENT_GRADIENT,
              boxShadow: "0 12px 28px rgba(255,94,98,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              transition: `transform 160ms ease, background 260ms ease`,
              "&:active": { transform: "scale(0.97)" },
              "&.Mui-disabled": { color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.12)", boxShadow: "none" },
            }}
          >
            {item.outOfStock ? (
              t("outOfStock")
            ) : added ? (
              <CheckRoundedIcon />
            ) : (
              <>
                <span>{t("threedAddToOrder")}</span>
                <Box component="span" sx={{ opacity: 0.85, fontWeight: 800 }}>
                  · {formatNumber(unitPrice * qty)} {t("toman")}
                </Box>
              </>
            )}
          </ButtonBase>
        </Box>
        {removedNames.length > 0 || extraNames.length > 0 ? (
          <Typography sx={{ px: 2, pt: 0.8, fontSize: 11.5, color: ACCENT, fontWeight: 700 }}>
            {[
              removedNames.length ? t("threedWithout", { names: removedNames.join("، ") }) : "",
              extraNames.length ? t("threedWithExtra", { names: extraNames.join("، ") }) : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );

  // خارج از لایه‌های صفحهٔ منو رندر می‌شود تا دکمهٔ برگشت همیشه قابل لمس باشد
  if (compact || typeof document === "undefined") return detail;
  return createPortal(detail, document.body);
}

/* ───────────── چیدمان منو ───────────── */

export function ThreeDLayout(props: ReservMenuLayoutProps) {
  const { t } = useReservI18n();
  const { items, categories, selectedCategory, onSelectCategory, searchActive, compact, onAddCustom, onAdd } = props;
  const list = useMemo(
    () => items.filter((item) => item.threed && !item.outOfStock),
    [items],
  );
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [removedByKey, setRemovedByKey] = useState<Record<string, number[]>>({});
  const [extraByKey, setExtraByKey] = useState<Record<string, number[]>>({});

  const openIndex = openKey ? list.findIndex((item) => item.key === openKey) : -1;
  const removedSet = useMemo(
    () => new Set<number>(openKey ? removedByKey[openKey] || [] : []),
    [openKey, removedByKey],
  );
  const extraSet = useMemo(
    () => new Set<number>(openKey ? extraByKey[openKey] || [] : []),
    [openKey, extraByKey],
  );

  const toggle = useCallback(
    (materialId: number) => {
      if (!openKey) return;
      setRemovedByKey((prev) => {
        const current = prev[openKey] || [];
        const next = current.includes(materialId)
          ? current.filter((id) => id !== materialId)
          : [...current, materialId];
        return { ...prev, [openKey]: next };
      });
      // با برداشتن ماده، اضافهٔ آن هم پاک می‌شود
      setExtraByKey((prev) => ({
        ...prev,
        [openKey]: (prev[openKey] || []).filter((id) => id !== materialId),
      }));
    },
    [openKey],
  );

  const toggleExtra = useCallback(
    (materialId: number) => {
      if (!openKey) return;
      setExtraByKey((prev) => {
        const current = prev[openKey] || [];
        // حداکثر یک واحد اضافه
        const next = current.includes(materialId)
          ? current.filter((id) => id !== materialId)
          : [...current, materialId];
        return { ...prev, [openKey]: next };
      });
      // اگر ماده حذف شده بود، با زدن اضافه دوباره برمی‌گردد
      setRemovedByKey((prev) => ({
        ...prev,
        [openKey]: (prev[openKey] || []).filter((id) => id !== materialId),
      }));
    },
    [openKey],
  );

  const handleAdd = useCallback(
    (qty: number) => {
      if (!openKey) return;
      const item = list.find((entry) => entry.key === openKey);
      if (!item) return;
      const data = item.threed as ThreeDData;
      const removedIds = (removedByKey[openKey] || []).filter((id) =>
        data.ingredients.some((row) => row.raw_material_id === id && row.is_removable),
      );
      const extraIds = (extraByKey[openKey] || []).filter(
        (id) =>
          !removedIds.includes(id) &&
          data.ingredients.some((row) => row.raw_material_id === id),
      );
      if (onAddCustom) onAddCustom(openKey, removedIds, qty, extraIds);
      else for (let i = 0; i < qty; i += 1) onAdd(openKey);
    },
    [extraByKey, list, onAdd, onAddCustom, openKey, removedByKey],
  );

  const openCard = (key: string) => {
    // هر بار که کارت را باز می‌کنیم، با ترکیب کامل شروع می‌شود
    setRemovedByKey((prev) => ({ ...prev, [key]: [] }));
    setExtraByKey((prev) => ({ ...prev, [key]: [] }));
    setOpenKey(key);
  };

  const showBar = categories.length > 1;

  return (
    <Box sx={{ ...KEYFRAMES }}>
      {showBar ? (
        <Box
          role="tablist"
          sx={{
            display: "flex",
            gap: 0.8,
            overflowX: "auto",
            pb: 0.8,
            mb: 1.4,
            opacity: searchActive ? 0.45 : 1,
            pointerEvents: searchActive ? "none" : "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <ButtonBase
                key={cat.id}
                role="tab"
                aria-selected={active}
                onClick={() => onSelectCategory(cat.id)}
                sx={{
                  flexShrink: 0,
                  px: 1.8,
                  minHeight: 40,
                  borderRadius: 999,
                  fontFamily: APP_FONT_FAMILY,
                  fontSize: 13.5,
                  fontWeight: active ? 900 : 600,
                  color: active ? "#1b1206" : "#fff",
                  background: active ? ACCENT_GRADIENT : "rgba(255,255,255,0.08)",
                  border: `1px solid ${active ? "transparent" : GLASS_BORDER}`,
                  boxShadow: active ? "0 8px 20px rgba(255,94,98,0.35)" : "none",
                  transition: "background 200ms ease, color 200ms ease",
                }}
              >
                {cat.name}
              </ButtonBase>
            );
          })}
        </Box>
      ) : null}

      {list.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 6,
            px: 2,
            borderRadius: "28px",
            bgcolor: GLASS,
            border: `1px dashed ${GLASS_BORDER}`,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          <RestaurantMenuIcon sx={{ fontSize: 40, opacity: 0.7 }} />
          <Typography sx={{ mt: 1, fontSize: 13.5, lineHeight: 1.9 }}>{t("threedEmpty")}</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1.4,
            gridTemplateColumns: compact
              ? "repeat(2, minmax(0, 1fr))"
              : { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
          }}
        >
          {list.map((item, index) => (
            <ThreeDCard key={item.key} item={item} index={index} compact={compact} onOpen={() => openCard(item.key)} />
          ))}
        </Box>
      )}

      {openIndex >= 0 ? (
        <ThreeDDetail
          list={list}
          index={openIndex}
          removed={removedSet}
          extras={extraSet}
          compact={compact}
          onToggle={toggle}
          onToggleExtra={toggleExtra}
          onClose={() => setOpenKey(null)}
          onGo={(to) => setOpenKey(list[to]?.key ?? null)}
          onAdd={handleAdd}
        />
      ) : null}
    </Box>
  );
}

/* ───────────── نمونهٔ پیش‌نمایش (بدون عکس واقعی) ───────────── */

function svgUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SAMPLE_SVG = {
  bunTop: svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2b866"/><stop offset="1" stop-color="#d98f3a"/></linearGradient></defs><path d="M8 112 C8 26 78 6 150 6 C222 6 292 26 292 112 Z" fill="url(#g)"/><g fill="#fff3d6" opacity=".9"><ellipse cx="100" cy="44" rx="7" ry="3.5" transform="rotate(-20 100 44)"/><ellipse cx="150" cy="30" rx="7" ry="3.5"/><ellipse cx="200" cy="46" rx="7" ry="3.5" transform="rotate(22 200 46)"/><ellipse cx="128" cy="62" rx="7" ry="3.5" transform="rotate(8 128 62)"/><ellipse cx="176" cy="64" rx="7" ry="3.5" transform="rotate(-12 176 64)"/></g></svg>`,
  ),
  patty: svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 62"><rect x="4" y="6" width="292" height="50" rx="25" fill="#5b3420"/><rect x="4" y="6" width="292" height="20" rx="10" fill="#7a4a2d" opacity=".7"/><g fill="#3d2214" opacity=".7"><circle cx="60" cy="34" r="4"/><circle cx="120" cy="42" r="3.5"/><circle cx="190" cy="32" r="4"/><circle cx="244" cy="40" r="3.5"/></g></svg>`,
  ),
  pickle: svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 40"><path d="M10 12 Q40 2 70 12 T130 12 T190 12 T250 12 T290 10 L290 28 Q260 38 230 28 T170 28 T110 28 T50 28 T10 30 Z" fill="#6fa83a"/><path d="M14 14 Q44 6 72 14 T132 14 T192 14 T252 14 T286 12" stroke="#a6d96a" stroke-width="3" fill="none" opacity=".8"/></svg>`,
  ),
  cheese: svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 54"><path d="M6 8 H294 L284 22 L248 22 L232 48 L214 22 L96 22 L82 40 L66 22 L16 22 Z" fill="#ffc933"/><path d="M6 8 H294 V16 H6 Z" fill="#ffe27a" opacity=".8"/></svg>`,
  ),
  bunBottom: svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 66"><path d="M8 4 H292 V30 Q292 62 250 62 H50 Q8 62 8 30 Z" fill="#d8923f"/><path d="M8 4 H292 V14 H8 Z" fill="#f0b25c" opacity=".7"/></svg>`,
  ),
} as const;

function sampleBurger(
  key: string,
  name: string,
  price: number,
  order: Array<keyof typeof SAMPLE_SVG>,
): ReservMenuItem {
  const meta: Record<keyof typeof SAMPLE_SVG, { id: number; name: string; removable: boolean; price: number }> = {
    bunTop: { id: 1, name: "نان", removable: false, price: Math.round(price * 0.18) },
    bunBottom: { id: 1, name: "نان", removable: false, price: Math.round(price * 0.18) },
    patty: { id: 2, name: "برگر", removable: true, price: Math.round(price * 0.42) },
    pickle: { id: 3, name: "خیارشور", removable: true, price: Math.round(price * 0.08) },
    cheese: { id: 4, name: "پنیر", removable: true, price: Math.round(price * 0.14) },
  };
  const layers: ThreeDLayer[] = order.map((kind, i) => ({
    key: `${meta[kind].id}-${i}`,
    raw_material_id: meta[kind].id,
    name: meta[kind].name,
    image_url: SAMPLE_SVG[kind],
  }));
  const seen = new Set<number>();
  const ingredients: ThreeDIngredient[] = [];
  for (const kind of order) {
    const m = meta[kind];
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    ingredients.push({
      raw_material_id: m.id,
      name: m.name,
      image_url: SAMPLE_SVG[kind],
      is_removable: m.removable,
      price: kind === "bunTop" || kind === "bunBottom" ? m.price * 2 : m.price,
    });
  }
  return {
    key,
    name,
    description: "نمونهٔ منوی سه‌بعدی؛ مواد را تیک بزنید یا بردارید",
    price,
    image: "",
    categoryIds: [],
    outOfStock: false,
    threed: { ingredients, layers },
  };
}

export const THREED_SAMPLE_ITEMS: ReservMenuItem[] = [
  sampleBurger("t1", "همبرگر", 185000, ["bunTop", "patty", "pickle", "cheese", "bunBottom"]),
  sampleBurger("t2", "چیزبرگر مخصوص", 215000, ["bunTop", "cheese", "patty", "cheese", "pickle", "bunBottom"]),
];
