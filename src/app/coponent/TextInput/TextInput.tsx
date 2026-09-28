"use client"
import React, { useLayoutEffect, useRef, useState } from 'react';
import { TextField, Box, Typography } from '@mui/material';
import { StyledTextField } from './style';

interface TextInput {
  name: string;
  defaultValue?: string;
  value?: string;
  onChange: (value: string) => void;
  label: string;
  type:string;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  /** جداکننده هزارگان هنگام تایپ هم نمایش داده شود (فقط برای type="number") */
  liveSeparator?: boolean;
}

const NUMERIC_CHAR = /[\d۰-۹٠-٩.٫]/;

const TextInput: React.FC<TextInput> = ({ name, defaultValue, onChange, label, value, type, onKeyPress, onBlur, liveSeparator }) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretChars = useRef<number | null>(null);
  const live = liveSeparator && type === "number";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (live) {
      const caret = e.target.selectionStart ?? e.target.value.length;
      pendingCaretChars.current = e.target.value
        .slice(0, caret)
        .split("")
        .filter((ch) => NUMERIC_CHAR.test(ch)).length;
    }
    const inputVal = e.target.value
      .replace(/,/g, "")
      .replace(/٬/g, "")
      .replace(/٫/g, ".")
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      .replace(/\s/g, "");
    if (type === "number") {
      if (/^\d*\.?\d*$/.test(inputVal) || inputVal === "") {
        onChange(inputVal);
      }
    } else if (/^\d*$/.test(inputVal) || inputVal === "") {
      onChange(inputVal);
    } else {
      onChange(e.target.value);
    }
  };

  const formatNumber = (val: string) => {
    if (type === "number") {
      const num = Number(val);
      return !isNaN(num) && val !== '' ? new Intl.NumberFormat("fa-IR").format(num) : val;
    }
    return val;
  };

  const formatLive = (val: string) => {
    const [intPart, fracPart] = val.split(".");
    const intFormatted = intPart ? new Intl.NumberFormat("fa-IR").format(Number(intPart)) : "";
    if (fracPart === undefined) return intFormatted;
    const fracFormatted = fracPart.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
    return `${intFormatted || "۰"}٫${fracFormatted}`;
  };

  const displayValue = isFocused
    ? (live && /^\d*\.?\d*$/.test(value || '') ? formatLive(value || '') : value ?? '')
    : ((/^\d+\.?\d*$/.test(value || '')) ? formatNumber(value || '') : value ?? '');

  useLayoutEffect(() => {
    const target = pendingCaretChars.current;
    const el = inputRef.current;
    if (target === null || !el) return;
    pendingCaretChars.current = null;
    let pos = 0;
    let seen = 0;
    while (pos < displayValue.length && seen < target) {
      if (NUMERIC_CHAR.test(displayValue[pos])) seen++;
      pos++;
    }
    el.setSelectionRange(pos, pos);
  }, [displayValue]);

  return (
    <Box sx={{ marginTop: "10px" }}>
      <Typography textAlign="right">{label} :</Typography>
      <Box sx={{ display: "flex" }}>
        <Box sx={{ width: "90%" }}>
          <StyledTextField
          
            placeholder={defaultValue}
            variant="outlined"
            focused
            value={displayValue}
            inputRef={inputRef}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            onKeyPress={onKeyPress}
            name={name}
            defaultValue={defaultValue}
            InputProps={{
              inputProps: {
                autoComplete: 'off',
                spellCheck: false,
                style: {
                  direction: 'ltr',
                  textAlign: 'left',
                  paddingLeft: "15px",
                  color: "#ff9100"
                }
              },
            }}
            fullWidth
          />
        </Box>
      </Box>
    </Box>
  );
};

export default TextInput;
