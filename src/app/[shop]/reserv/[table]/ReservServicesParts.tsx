"use client";

import { APP_FONT_FAMILY } from "@/app/lib/appFont";
import { shopServiceEmoji, type ShopService, type TableServiceRequest } from "@/app/lib/shopServices";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { ACCENT, ACCENT_DARK, ACCENT_SOFT, formatNumber, type ReservTheme } from "./ReservOrderingParts";

type SwitchProps = {
  mode: "menu" | "services";
  onChange: (mode: "menu" | "services") => void;
  theme: ReservTheme;
  pendingServiceCount?: number;
};

export function ReservMenuServiceSwitch({ mode, onChange, theme, pendingServiceCount = 0 }: SwitchProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 0.6,
        p: 0.5,
        mb: 1.5,
        borderRadius: "18px",
        bgcolor: theme.SURFACE,
        border: `1px solid ${theme.BORDER}`,
        boxShadow: "0 10px 30px rgba(26,23,18,0.06)",
      }}
    >
      {(
        [
          { id: "menu" as const, label: "منو", icon: <RestaurantMenuIcon sx={{ fontSize: 18 }} /> },
          { id: "services" as const, label: "خدمات", icon: <RoomServiceIcon sx={{ fontSize: 18 }} /> },
        ] as const
      ).map((item) => {
        const active = mode === item.id;
        return (
          <Box
            key={item.id}
            component="button"
            type="button"
            onClick={() => onChange(item.id)}
            sx={{
              appearance: "none",
              border: 0,
              cursor: "pointer",
              borderRadius: "14px",
              py: 1.15,
              px: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.7,
              fontFamily: APP_FONT_FAMILY,
              fontWeight: 800,
              fontSize: 14,
              bgcolor: active ? ACCENT : "transparent",
              color: active ? "#1a1712" : theme.TEXT,
              position: "relative",
            }}
          >
            {item.icon}
            {item.label}
            {item.id === "services" && pendingServiceCount > 0 ? (
              <Box
                sx={{
                  minWidth: 18,
                  height: 18,
                  px: 0.4,
                  borderRadius: "999px",
                  bgcolor: active ? "#1a1712" : ACCENT,
                  color: active ? ACCENT : "#1a1712",
                  fontSize: 10,
                  fontWeight: 800,
                  lineHeight: "18px",
                }}
              >
                {formatNumber(pendingServiceCount)}
              </Box>
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}

type GridProps = {
  services: ShopService[];
  theme: ReservTheme;
  requestingId: number | null;
  pendingServiceIds: number[];
  onRequest: (service: ShopService) => void;
};

export function ReservServiceGrid({ services, theme, requestingId, pendingServiceIds, onRequest }: GridProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr", md: "1fr 1fr" },
        gap: 1.1,
      }}
    >
      {services.map((service) => {
        const pending = pendingServiceIds.includes(service.id);
        const loading = requestingId === service.id;
        return (
          <Box
            key={service.id}
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "22px",
              p: 1.4,
              minHeight: 168,
              bgcolor: theme.SURFACE,
              border: pending ? `1.5px solid ${ACCENT}` : `1px solid ${theme.BORDER}`,
              boxShadow: pending ? "0 8px 24px rgba(201,162,39,0.18)" : "0 1px 3px rgba(26,23,18,0.04)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -18,
                left: -10,
                width: 72,
                height: 72,
                borderRadius: "50%",
                bgcolor: ACCENT_SOFT,
                opacity: 0.9,
              }}
            />
            <Typography sx={{ fontSize: 28, lineHeight: 1, mb: 1, position: "relative" }}>
              {shopServiceEmoji(service.icon_key)}
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: theme.TEXT, mb: 0.4, position: "relative" }}>
              {service.name}
            </Typography>
            <Typography sx={{ color: theme.MUTED, fontSize: 12, lineHeight: 1.7, flex: 1, position: "relative" }}>
              {service.description || "بدون هزینه — بعد از درخواست برای اتاقتان ارسال می‌شود."}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1.2, gap: 1 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: ACCENT_DARK }}>رایگان</Typography>
              <Button
                disabled={loading || pending}
                onClick={() => onRequest(service)}
                sx={{
                  minWidth: 0,
                  px: 1.4,
                  py: 0.55,
                  borderRadius: "12px",
                  bgcolor: pending ? ACCENT_SOFT : ACCENT,
                  color: "#1a1712",
                  fontWeight: 800,
                  fontSize: 12,
                  "&:hover": { bgcolor: pending ? ACCENT_SOFT : ACCENT_DARK },
                }}
              >
                {loading ? <CircularProgress size={14} sx={{ color: "#1a1712" }} /> : pending ? "ثبت شد" : "درخواست"}
              </Button>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

type ListProps = {
  requests: TableServiceRequest[];
  theme: ReservTheme;
  cancellingId: number | null;
  onCancel: (request: TableServiceRequest) => void;
};

export function ReservServiceRequestList({ requests, theme, cancellingId, onCancel }: ListProps) {
  if (requests.length === 0) return null;
  return (
    <Box sx={{ mb: 1.6 }}>
      <Typography sx={{ fontWeight: 800, fontSize: 14, color: theme.TEXT, mb: 0.8 }}>درخواست‌های جاری</Typography>
      {requests.map((row) => (
        <Box
          key={row.id}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1.1,
            mb: 0.8,
            borderRadius: "16px",
            bgcolor: theme.SURFACE,
            border: `1px solid ${theme.BORDER}`,
          }}
        >
          <Box sx={{ fontSize: 22 }}>{shopServiceEmoji(row.icon_key)}</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 13, color: theme.TEXT }}>{row.name}</Typography>
            <Typography sx={{ color: theme.MUTED, fontSize: 11 }}>
              {row.status_label || "در انتظار"} {row.note ? `· ${row.note}` : ""}
            </Typography>
          </Box>
          {row.status === "pending" ? (
            <Button
              onClick={() => onCancel(row)}
              disabled={cancellingId === row.id}
              sx={{ color: "#e57373", fontWeight: 700, fontSize: 12, minWidth: 0 }}
            >
              {cancellingId === row.id ? "..." : "لغو"}
            </Button>
          ) : null}
        </Box>
      ))}
    </Box>
  );
}
