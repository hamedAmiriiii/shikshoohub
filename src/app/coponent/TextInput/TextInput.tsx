"use client"
import React, { useState } from 'react';
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
}

const TextInput: React.FC<TextInput> = ({ name, defaultValue, onChange, label, value, type, onKeyPress, onBlur }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value
      .replace(/,/g, "")
      .replace(/٬/g, "")
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

  const displayValue = isFocused
    ? value ?? ''
    : ((/^\d+\.?\d*$/.test(value || '')) ? formatNumber(value || '') : value ?? '');

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
