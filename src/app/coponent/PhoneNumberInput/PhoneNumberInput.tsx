"use client";

import React, { useEffect, useMemo, useState } from "react";
import { InputAdornment, Box, SxProps, Theme, IconButton, Tooltip } from "@mui/material";
import { StyledTextField } from "./style";
import KeyboardOutlinedIcon from "@mui/icons-material/KeyboardOutlined";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import DoneIcon from "@mui/icons-material/MobileFriendly";
import PhoneNumberKeypad from "./PhoneNumberKeypad";

interface PhoneNumberInputProps {
  name: string;
  defaultValue: string;
  onChange: (value: string) => void;
  size?: "small" | "medium";
  compact?: boolean;
  sx?: SxProps<Theme>;
}

function stripPhoneDigits(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  name,
  defaultValue,
  onChange,
  size = "medium",
  compact = false,
  sx,
}) => {
  const [loading, setLoading] = useState(false);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const digits = useMemo(() => stripPhoneDigits(defaultValue), [defaultValue]);

  useEffect(() => {
    setLoading(digits.length >= 10 && digits.startsWith("9"));
  }, [digits]);

  const emitChange = (nextDigits: string) => {
    const trimmed = stripPhoneDigits(nextDigits);
    setLoading(trimmed.length >= 10 && trimmed.startsWith("9"));
    onChange(trimmed);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    emitChange(e.target.value);
  };

  const openKeypad = () => setKeypadOpen(true);

  const keyboardButton = (
    <Tooltip title="صفحه‌کلید لمسی">
      <IconButton
        size="small"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          openKeypad();
        }}
        sx={{
          p: compact ? "2px" : "4px",
          color: "var(--admin-accent, #ff9100)",
        }}
        aria-label="صفحه‌کلید شماره تلفن"
      >
        <KeyboardOutlinedIcon sx={{ fontSize: compact ? 16 : 22 }} />
      </IconButton>
    </Tooltip>
  );

  const phoneIcon = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: loading ? "#1abf0b" : "var(--admin-text-muted, #888)",
        flexShrink: 0,
        ...(compact
          ? { width: 20, height: 20, mr: -0.25 }
          : { p: "4px" }),
      }}
      aria-hidden
    >
      {loading ? (
        <DoneIcon sx={{ fontSize: compact ? 15 : 24 }} />
      ) : (
        <SmartphoneIcon sx={{ fontSize: compact ? 15 : 24 }} />
      )}
    </Box>
  );

  return (
    <>
      <Box sx={{ display: "flex", width: "100%" }}>
        <StyledTextField
          placeholder={compact ? "09..." : "912..."}
          variant="outlined"
          focused
          size={size}
          onChange={handleInputChange}
          name={name}
          value={digits}
          fullWidth
          sx={sx}
          InputProps={{
            startAdornment: (
              <InputAdornment
                position="start"
                sx={{
                  ml: compact ? 0 : undefined,
                  mr: compact ? 0.25 : undefined,
                }}
              >
                {phoneIcon}
              </InputAdornment>
            ),
            endAdornment: compact ? (
              <InputAdornment position="end" sx={{ ml: 0.25 }}>
                {keyboardButton}
              </InputAdornment>
            ) : (
              <InputAdornment position="end">
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                  {keyboardButton}
                  <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                    <Box
                      component="span"
                      sx={{
                        height: "24px",
                        width: "2px",
                        backgroundColor: "#ff9100",
                      }}
                    />
                    <Box
                      component="span"
                      sx={{
                        direction: "ltr",
                        px: "12px",
                        color: "#ff9100",
                      }}
                    >
                      +98
                    </Box>
                  </Box>
                </Box>
              </InputAdornment>
            ),
            inputProps: {
              inputMode: "numeric",
              maxLength: 10,
              style: {
                direction: "ltr",
                textAlign: "left",
                paddingLeft: compact ? "2px" : "15px",
                paddingRight: compact ? "2px" : undefined,
                color: "var(--admin-text, #ff9100)",
                cursor: "text",
              },
            },
          }}
        />
      </Box>

      <PhoneNumberKeypad
        open={keypadOpen}
        value={digits}
        onClose={() => setKeypadOpen(false)}
        onChange={emitChange}
      />
    </>
  );
};

export default PhoneNumberInput;
