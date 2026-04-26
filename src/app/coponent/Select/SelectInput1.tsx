'use client';

import React from 'react';
import { Box, Typography, MenuItem, Select } from '@mui/material';
import { StyledFormControl } from './style';

interface SelectInputProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: { value: string | number; label: string }[];
}

const SelectInput: React.FC<SelectInputProps> = ({ name, value, onChange, label, options }) => {
  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    onChange(event.target.value as string);
  };

  return (
    <Box sx={{ marginTop: '10px',width:"90%" }}>
      <Typography textAlign="right">{label} :</Typography>
      <StyledFormControl fullWidth variant="filled" sx={{border:"1px #1976d2 solid" , borderRadius:"15px"}}>
        <Select
          sx={{color: '#ff9100'}}
          name={name}
          value={value}
          onChange={handleChange}
          displayEmpty
          defaultValue=""
          inputProps={{ style: { textAlign: 'left', direction: 'ltr', color: '#ff9100' ,  } }}
        >
          <MenuItem value="">
            <em>بدون انتخاب</em>
          </MenuItem>
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </StyledFormControl>
    </Box>
  );
};

export default SelectInput;
