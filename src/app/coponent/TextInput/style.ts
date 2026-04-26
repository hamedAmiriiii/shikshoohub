'use client'

import { Box, Button, TextField, styled } from "@mui/material";

export const Container = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: '100vh',
    backgroundColor: '#f0f0f0',
    padding: '1rem',
    boxSizing: 'border-box',
  });
  
  export const Form = styled('form')({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    marginTop: '0',
  });
  
  export const StyledTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': {
      borderRadius: '15px',
    },
  });
  
 

