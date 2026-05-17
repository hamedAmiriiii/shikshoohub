"use client";
import { Box, Button, TextField, Typography, Container, Paper, InputAdornment, CircularProgress } from '@mui/material';
import React, { useState, useEffect, Suspense } from 'react';
import { apiRequestError } from '@/app/lib/apiRequestError';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter, useSearchParams } from 'next/navigation';
import PhoneIcon from '@mui/icons-material/Phone';
import LockIcon from '@mui/icons-material/Lock';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '';
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const customerToken = localStorage.getItem('customer_token');
    if (customerToken) {
      router.push(redirectUrl);
    }
  }, [router, redirectUrl]);

  const handleLogin = async () => {
    if (!phone || !password) {
      toast.error('لطفاً شماره تلفن و رمز عبور را وارد کنید');
      return;
    }
    if (phone.length !== 11 || !phone.startsWith('09')) {
      toast.error('شماره تلفن معتبر نیست');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiRequestError('Post', {}, { phone, password }, '/api/customer/login', false, false, '');
      setIsLoading(false);
      if (res.hasError) {
        const parsed = JSON.parse(res.errorText);
        toast.error(parsed.message || 'خطا در ورود');
        return;
      }
      if (res.token) {
        localStorage.setItem('customer_token', res.token);
        if (res.customer) localStorage.setItem('customer_data', JSON.stringify(res.customer));
        toast.success('ورود با موفقیت انجام شد');
        // Dispatch custom event برای به‌روزرسانی header
        window.dispatchEvent(new Event('customerLogin'));
        // کمی تاخیر برای اطمینان از ذخیره شدن در localStorage
        setTimeout(() => {
          router.push(redirectUrl);
        }, 100);
      } else {
        toast.error('خطا در ورود');
      }
    } catch (error) {
      setIsLoading(false);
      toast.error('خطا در ارتباط با سرور');
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '14px',
      backgroundColor: '#2b3143',
      color: '#fff',
      '& fieldset': { borderColor: '#505669' },
      '&:hover fieldset': { borderColor: '#78b568' },
      '&.Mui-focused fieldset': { borderColor: '#78b568' },
    },
    '& .MuiInputBase-input': { 
      padding: '14px 16px', 
      fontSize: '15px',
      color: '#fff',
      // حذف استایل autocomplete
      '&:-webkit-autofill': {
        WebkitBoxShadow: '0 0 0 100px #2b3143 inset !important',
        WebkitTextFillColor: '#fff !important',
        caretColor: '#fff',
        transition: 'background-color 5000s ease-in-out 0s',
      },
      '&:-webkit-autofill:hover': {
        WebkitBoxShadow: '0 0 0 100px #2b3143 inset !important',
        WebkitTextFillColor: '#fff !important',
      },
      '&:-webkit-autofill:focus': {
        WebkitBoxShadow: '0 0 0 100px #2b3143 inset !important',
        WebkitTextFillColor: '#fff !important',
      },
      '&:-webkit-autofill:active': {
        WebkitBoxShadow: '0 0 0 100px #2b3143 inset !important',
        WebkitTextFillColor: '#fff !important',
      },
    },
    '& .MuiInputBase-input::placeholder': {
      color: 'rgba(255,255,255,0.5)',
      opacity: 1,
    },
  } as const;

  const buttonEnabled = phone && password && !isLoading;

  return (
    <Paper
      elevation={0}
      sx={{
        padding: { xs: '24px', md: '28px' },
        borderRadius: '22px',
        backgroundColor: '#1a1d2e',
        border: '1px solid #505669',
        boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
      }}
    >
      <Typography
        variant="h6"
        sx={{ mb: 3, fontSize: '16px', color: '#fff', textAlign: 'center', fontWeight: 500 }}
      >
        لطفا برای ادامه شماره همراه خود را وارد کنید.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <TextField
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="شماره همراه"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '20px' }} />
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />

        <TextField
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="رمز عبور"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '20px' }} />
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />

        <Button
          variant="contained"
          onClick={handleLogin}
          disabled={!buttonEnabled}
          fullWidth
          sx={{
            mt: 1,
            py: '12px',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 600,
            textTransform: 'none',
            backgroundColor: buttonEnabled ? '#78b568' : '#505669',
            color: '#fff',
            boxShadow: 'none',
            '&:hover': { backgroundColor: buttonEnabled ? '#5a9a4a' : '#505669' },
            '&:disabled': {
              backgroundColor: '#505669',
              color: 'rgba(255,255,255,0.5)',
            },
          }}
        >
          {isLoading ? 'در حال ورود...' : 'ورود'}
        </Button>

        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Button
            variant="text"
            onClick={() => router.push('/register')}
            sx={{
              color: '#78b568',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
            }}
          >
            ثبت نام
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

function LoadingFallback() {
  return (
    <Paper
      elevation={0}
      sx={{
        padding: { xs: '24px', md: '28px' },
        borderRadius: '22px',
        backgroundColor: '#1a1d2e',
        border: '1px solid #505669',
        boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
      }}
    >
      <CircularProgress sx={{ color: '#78b568' }} />
    </Paper>
  );
}

export default function CustomerLoginPage() {
  const gradientBg = 'linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: gradientBg,
        padding: { xs: '16px', md: '24px' },
        direction: 'rtl',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="xs" sx={{ width: '100%' }}>
        <Suspense fallback={<LoadingFallback />}>
          <LoginForm />
        </Suspense>
      </Container>
      <ToastContainer position="top-center" rtl />
    </Box>
  );
}
