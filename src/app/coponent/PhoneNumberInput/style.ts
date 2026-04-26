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
    '& .MuiInputBase-input': {
      // حذف استایل autocomplete
      '&:-webkit-autofill': {
        WebkitBoxShadow: '0 0 0 100px #2b3143 inset !important',
        WebkitTextFillColor: '#ff9100 !important',
        caretColor: '#ff9100',
        transition: 'background-color 5000s ease-in-out 0s',
      },
      '&:-webkit-autofill:hover': {
        WebkitBoxShadow: '0 0 0 100px #2b3143 inset !important',
        WebkitTextFillColor: '#ff9100 !important',
      },
      '&:-webkit-autofill:focus': {
        WebkitBoxShadow: '0 0 0 100px #2b3143 inset !important',
        WebkitTextFillColor: '#ff9100 !important',
      },
      '&:-webkit-autofill:active': {
        WebkitBoxShadow: '0 0 0 100px #2b3143 inset !important',
        WebkitTextFillColor: '#ff9100 !important',
      },
    },
  });
  
  export const styleModal = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #fff',
    boxShadow: 24,
    p: 4,
  };
  
  
  export const CustomButton = styled(Button)({
    backgroundColor: 'white',
    color: '#1B62FE',
    borderColor: '#1B62FE',
    border: '1px solid #fff',
    borderRadius: '15px', // اضافه کردن border-radius به دکمه
    '&:hover': {
      backgroundColor: '#f0f0f0',
    },
  });

