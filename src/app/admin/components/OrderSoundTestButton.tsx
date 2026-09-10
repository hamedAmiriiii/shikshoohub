"use client";

import { useState } from "react";
import { Button, CircularProgress, Typography, type ButtonProps } from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { toast } from "react-toastify";
import { testTableOrderAnnouncement } from "@/app/lib/speakPersianAnnouncement";

type Props = {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  fullWidth?: boolean;
  showHint?: boolean;
};

export default function OrderSoundTestButton({
  variant = "contained",
  size = "medium",
  fullWidth = false,
  showHint = false,
}: Props) {
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testTableOrderAnnouncement();
      const played = [
        result.tone ? "زنگ" : null,
        result.mp3 ? "فایل صوتی" : null,
        result.speech ? "گفتار" : null,
      ].filter(Boolean);
      const speechDetail =
        result.speech && result.speechVoice
          ? ` — ${result.speechVoice} (${result.speechDurationMs}ms)`
          : "";

      if (result.speech) {
        toast.success(`پخش شد: ${played.join("، ")} (${result.contextState})${speechDetail}`, {
          autoClose: 7000,
        });
      } else if (result.tone || result.mp3) {
        const detail = result.errors.length ? ` — ${result.errors.join("؛ ")}` : "";
        toast.warn(`زنگ/mp3 OK ولی گفتار شنیده نشد${detail}`, { autoClose: 9000 });
      } else {
        const detail = result.errors.length ? ` — ${result.errors.join("؛ ")}` : "";
        toast.error(
          `هیچ صدایی پخش نشد (${result.contextState})${detail}. تب مرورگر را فعال کنید و مطمئن شوید سایت بی‌صدا نیست.`,
          { autoClose: 8000 },
        );
      }
    } catch {
      toast.error("خطا در تست صدای سفارش");
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        startIcon={
          testing ? <CircularProgress size={18} color="inherit" /> : <VolumeUpIcon sx={{ fontSize: 20 }} />
        }
        onClick={() => void handleTest()}
        disabled={testing}
        sx={
          variant === "contained"
            ? {
                bgcolor: "var(--admin-accent)",
                color: "#fff",
                fontWeight: 700,
                "&:hover": { bgcolor: "var(--admin-accent)", opacity: 0.92 },
              }
            : {
                color: "var(--admin-text)",
                borderColor: "var(--admin-border)",
              }
        }
      >
        {testing ? "در حال پخش…" : "تست صدای سفارش"}
      </Button>
      {showHint ? (
        <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", lineHeight: 1.7, mt: 0.75 }}>
          زنگ + فایل /reserv/1.mp3 + اعلان «سفارش جدید، میز پنج» — پشت‌سرهم پخش می‌شود.
        </Typography>
      ) : null}
    </>
  );
}
