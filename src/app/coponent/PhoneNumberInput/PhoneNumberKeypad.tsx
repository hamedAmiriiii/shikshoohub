"use client";

import { Box, Button, Dialog, DialogContent, IconButton, Typography } from "@mui/material";
import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

type PhoneNumberKeypadProps = {
  open: boolean;
  value: string;
  onClose: () => void;
  onChange: (value: string) => void;
  onConfirm?: () => void;
};

function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "شماره تلفن را وارد کنید";
  const normalized = digits.startsWith("0") ? digits : `0${digits}`;
  if (normalized.length <= 4) return normalized;
  if (normalized.length <= 7) return `${normalized.slice(0, 4)} ${normalized.slice(4)}`;
  return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7, 11)}`;
}

export default function PhoneNumberKeypad({
  open,
  value,
  onClose,
  onChange,
  onConfirm,
}: PhoneNumberKeypadProps) {
  const appendDigit = (digit: string) => {
    let next = value.replace(/\D/g, "");
    if (next.startsWith("0")) next = next.slice(1);
    if (next.length >= 10) return;
    next = `${next}${digit}`.slice(0, 10);
    onChange(next);
  };

  const handleBackspace = () => {
    let next = value.replace(/\D/g, "");
    if (next.startsWith("0")) next = next.slice(1);
    onChange(next.slice(0, -1));
  };

  const handleClear = () => onChange("");

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: "16px",
          bgcolor: "var(--admin-surface, #fff)",
          backgroundImage: "none",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          pt: 1.5,
          pb: 0.5,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: "14px", color: "var(--admin-text, inherit)" }}>
          شماره تلفن
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="بستن">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 1, pb: 2 }}>
        <Box
          sx={{
            mb: 2,
            px: 1.5,
            py: 1.25,
            borderRadius: "12px",
            bgcolor: "var(--admin-surface-alt, #f5f5f5)",
            border: "1px solid var(--admin-border, rgba(0,0,0,0.12))",
            direction: "ltr",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: "22px", sm: "26px" },
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: value ? "var(--admin-accent, #ff9100)" : "var(--admin-text-muted, #999)",
              fontFamily: "monospace",
            }}
          >
            {formatPhoneDisplay(value)}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
          }}
        >
          {keys.map((key) => (
            <Button
              key={key}
              variant="outlined"
              onClick={() => appendDigit(key)}
              sx={{
                minHeight: 52,
                fontSize: "22px",
                fontWeight: 700,
                borderRadius: "12px",
                borderColor: "var(--admin-border, rgba(0,0,0,0.12))",
                color: "var(--admin-text, inherit)",
                bgcolor: "var(--admin-surface-alt, #fafafa)",
                "&:hover": {
                  bgcolor: "var(--admin-surface, #fff)",
                  borderColor: "var(--admin-accent, #ff9100)",
                },
              }}
            >
              {key}
            </Button>
          ))}

          <Button
            variant="outlined"
            onClick={handleBackspace}
            sx={{
              minHeight: 52,
              borderRadius: "12px",
              borderColor: "var(--admin-border, rgba(0,0,0,0.12))",
              color: "var(--admin-text-secondary, inherit)",
            }}
          >
            <BackspaceOutlinedIcon />
          </Button>

          <Button
            variant="outlined"
            onClick={() => appendDigit("0")}
            sx={{
              minHeight: 52,
              fontSize: "22px",
              fontWeight: 700,
              borderRadius: "12px",
              borderColor: "var(--admin-border, rgba(0,0,0,0.12))",
              color: "var(--admin-text, inherit)",
              bgcolor: "var(--admin-surface-alt, #fafafa)",
            }}
          >
            0
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            sx={{
              minHeight: 52,
              borderRadius: "12px",
              bgcolor: "var(--admin-accent, #ff9100)",
              "&:hover": { bgcolor: "var(--admin-accent-hover, #e68200)" },
            }}
          >
            <CheckIcon />
          </Button>
        </Box>

        <Button
          fullWidth
          size="small"
          onClick={handleClear}
          sx={{
            mt: 1.5,
            color: "var(--admin-text-muted, #888)",
            fontSize: "12px",
          }}
        >
          پاک کردن
        </Button>
      </DialogContent>
    </Dialog>
  );
}
