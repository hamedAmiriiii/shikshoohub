'use client';

import { TextField, FormControl, Select, styled } from '@mui/material';

export const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '15px',
    paddingLeft: '15px',
    color: '#ff9100',
  },
  '& input': {
    textAlign: 'left',
    direction: 'ltr',
  },
});

export const StyledFormControl = styled(FormControl)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '15px',
    paddingLeft: '15px',
    color: '#ff9100',
  },
  '& .MuiSelect-select': {
    textAlign: 'left',
    direction: 'ltr',
  },
});
