"use client";

import { useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogContent,
  Stack,
  TextField,
  Typography,
  type AvatarProps,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCameraFrontOutlined";
import { toast } from "react-toastify";
import { toLatinDigits } from "@/app/lib/repair/api";

const MAX_SELFIE_SIDE = 900;

/** عکس را کوچک و به JPEG تبدیل می‌کند تا آپلود سبک باشد. */
export function resizeImageToDataUrl(file: File, maxSide = MAX_SELFIE_SIDE): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

export function SelfieInput({
  value,
  onChange,
  required = false,
  busy = false,
}: {
  value: string | null;
  onChange: (dataUrl: string) => void;
  required?: boolean;
  busy?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("فقط عکس قابل انتخاب است.");
      return;
    }
    try {
      onChange(await resizeImageToDataUrl(file));
    } catch {
      toast.error("خواندن عکس ممکن نشد؛ دوباره امتحان کنید.");
    }
  };

  return (
    <Stack alignItems="center" spacing={1.25} sx={{ py: 1 }}>
      <ButtonBase onClick={() => inputRef.current?.click()} sx={{ borderRadius: "50%" }} disabled={busy}>
        <Avatar
          src={value || undefined}
          sx={{
            width: 112,
            height: 112,
            bgcolor: "action.hover",
            color: "text.secondary",
            border: "3px solid",
            borderColor: value ? "primary.main" : required ? "warning.main" : "divider",
          }}
        >
          <PhotoCameraIcon sx={{ fontSize: 44 }} />
        </Avatar>
      </ButtonBase>
      <Button variant={value ? "text" : "outlined"} size="small" onClick={() => inputRef.current?.click()} disabled={busy}>
        {value ? "گرفتن عکس دوباره" : `گرفتن عکس سلفی${required ? " (الزامی)" : ""}`}
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", lineHeight: 1.9 }}>
        عکس واضح از چهرهٔ خودتان، بدون عینک آفتابی و ماسک. این عکس برای امنیت به مشتری نمایش داده می‌شود.
      </Typography>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        capture="user"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </Stack>
  );
}

export const cardDigits = (value: string) => toLatinDigits(value).replace(/\D/g, "").slice(0, 16);
export const shebaDigits = (value: string) => toLatinDigits(value).replace(/\D/g, "").slice(0, 24);

const groupCard = (digits: string) => digits.replace(/(\d{4})(?=\d)/g, "$1-");

/** پیام خطا یا null اگر شماره کارت و شبا معتبر (یا خالی) باشند. */
export function bankFieldsError(card: string, sheba: string): string | null {
  const c = cardDigits(card);
  const s = shebaDigits(sheba);
  if (c && c.length !== 16) return "شماره کارت باید ۱۶ رقم باشد.";
  if (s && s.length !== 24) return "شماره شبا باید ۲۴ رقم (بعد از IR) باشد.";
  return null;
}

/** فیلدهای جدای شماره کارت و شبا برای تسویه با تعمیرکار. */
export function BankFields({
  card,
  sheba,
  onChange,
  size,
  optional = false,
}: {
  card: string;
  sheba: string;
  onChange: (next: { card: string; sheba: string }) => void;
  size?: "small" | "medium";
  optional?: boolean;
}) {
  const suffix = optional ? " (اختیاری)" : "";
  const c = cardDigits(card);
  const s = shebaDigits(sheba);

  return (
    <>
      <TextField
        label={`شماره کارت${suffix}`}
        value={groupCard(c)}
        onChange={(e) => onChange({ card: cardDigits(e.target.value), sheba: s })}
        fullWidth
        size={size}
        inputMode="numeric"
        error={c.length > 0 && c.length !== 16}
        helperText={c.length > 0 && c.length !== 16 ? `${c.length.toLocaleString("fa-IR")} از ۱۶ رقم` : " "}
        slotProps={{ htmlInput: { dir: "ltr", maxLength: 19 } }}
      />
      <TextField
        label={`شماره شبا${suffix}`}
        value={s}
        onChange={(e) => onChange({ card: c, sheba: shebaDigits(e.target.value) })}
        fullWidth
        size={size}
        inputMode="numeric"
        error={s.length > 0 && s.length !== 24}
        helperText={s.length > 0 && s.length !== 24 ? `${s.length.toLocaleString("fa-IR")} از ۲۴ رقم` : "۲۴ رقم بعد از IR"}
        slotProps={{
          htmlInput: { dir: "ltr", maxLength: 24 },
          input: {
            // در راست‌به‌چپ endAdornment سمت چپ می‌نشیند، یعنی قبل از رقم‌های شبا
            endAdornment: (
              <Typography component="span" dir="ltr" sx={{ fontWeight: 700, color: "text.secondary", marginInlineStart: "6px" }}>
                IR
              </Typography>
            ),
          },
        }}
      />
    </>
  );
}

/** عکس تعمیرکار؛ با کلیک بزرگ نمایش داده می‌شود. */
export function TechnicianPhoto({
  name,
  photoUrl,
  size = 48,
  sx,
}: {
  name?: string | null;
  photoUrl?: string | null;
  size?: number;
  sx?: AvatarProps["sx"];
}) {
  const [open, setOpen] = useState(false);
  const avatar = (
    <Avatar src={photoUrl || undefined} alt={name || ""} sx={{ width: size, height: size, bgcolor: "primary.main", ...sx }}>
      {(name || "؟").trim().charAt(0)}
    </Avatar>
  );
  if (!photoUrl) return avatar;

  return (
    <>
      <ButtonBase onClick={() => setOpen(true)} sx={{ borderRadius: "50%" }}>
        {avatar}
      </ButtonBase>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogContent sx={{ p: 1 }}>
          <Box component="img" src={photoUrl} alt={name || ""} sx={{ width: "100%", display: "block", borderRadius: 2 }} />
          {name && (
            <Typography fontWeight={800} sx={{ textAlign: "center", mt: 1 }}>
              {name}
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
