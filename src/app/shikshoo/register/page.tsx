"use client";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  InputAdornment,
} from '@mui/material';
import React, { useState, useEffect, useRef } from 'react';
import { apiRequestError } from '@/app/lib/apiRequestError';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';
import PhoneIcon from '@mui/icons-material/Phone';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '']);
  const [timer, setTimer] = useState<number>(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const customerToken = localStorage.getItem('customer_token');
    if (customerToken) {
      router.push('/shikshoo');
    }
  }, [router]);

  useEffect(() => {
    if (step !== 'verify' || timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [step, timer]);

  const gradientBg = 'linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)';

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

  const isPhoneValid = phone.length === 11 && phone.startsWith('09');
  const isFormValid = password && confirmPassword && password === confirmPassword;
  const code = codeDigits.join('');
  const isCodeValid = code.length === 5;

  const focusInput = (idx: number) => {
    const el = inputsRef.current[idx];
    if (el) el.focus();
  };

  const handleSendCode = async () => {
    if (!isPhoneValid) {
      toast.error('شماره تلفن معتبر نیست');
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiRequestError('Post', {}, { phone }, '/api/customer-register/send-code', false, false, '');
      setIsLoading(false);
      if (res.hasError) {
        const parsed = JSON.parse(res.errorText);
        toast.error(parsed.message || 'خطا در ارسال کد');
        return;
      }
      toast.success('کد تایید ارسال شد');
      setStep('verify');
      setTimer(110); // حدوداً 1:49
      setCodeDigits(['', '', '', '', '']);
      focusInput(0);
    } catch (error) {
      setIsLoading(false);
      toast.error('خطا در ارتباط با سرور');
    }
  };

  const handleVerify = async () => {
    if (!isPhoneValid || !isCodeValid) {
      toast.error('لطفاً شماره و کد را تکمیل کنید');
      return;
    }
    if (!isFormValid) {
      toast.error('لطفاً رمز عبور را تکمیل و رمزها را یکسان کنید');
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiRequestError(
        'Post',
        {},
        { phone, code, password },
        '/api/customer-register/verify',
        false,
        false,
        '',
      );
      setIsLoading(false);
      if (res.hasError) {
        const parsed = JSON.parse(res.errorText);
        toast.error(parsed.message || 'خطا در ثبت نام');
        return;
      }
      // اگر response موفق بود (200) و token داشت، لاگین کن
      if (res.token) {
        localStorage.setItem('customer_token', res.token);
        if (res.customer) {
          localStorage.setItem('customer_data', JSON.stringify(res.customer));
        }
        toast.success('ثبت نام و ورود با موفقیت انجام شد');
        // Dispatch custom event برای به‌روزرسانی header
        window.dispatchEvent(new Event('customerLogin'));
        // کمی تاخیر برای اطمینان از ذخیره شدن در localStorage
        setTimeout(() => {
          router.push('/shikshoo');
        }, 100);
      } else {
        // اگر token نداشت اما خطا هم نبود، فقط ثبت نام انجام شد
        toast.success('ثبت نام با موفقیت انجام شد');
        setTimeout(() => {
          router.push('/shikshoo/login');
        }, 100);
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error in handleVerify:', error);
      toast.error('خطا در ارتباط با سرور');
    }
  };

  const handleCodeChange = (value: string, idx: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...codeDigits];
    next[idx] = value;
    setCodeDigits(next);
    if (value && idx < 4) focusInput(idx + 1);
  };

  const handleCodeKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !codeDigits[idx] && idx > 0) {
      focusInput(idx - 1);
    }
  };

  const renderPhoneStep = () => (
    <>
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

        <Button
          variant="contained"
          onClick={handleSendCode}
          disabled={!isPhoneValid || isLoading}
          fullWidth
          sx={{
            mt: 1,
            py: '12px',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 600,
            textTransform: 'none',
            backgroundColor: isPhoneValid ? '#78b568' : '#505669',
            color: '#fff',
            boxShadow: 'none',
            '&:hover': { backgroundColor: isPhoneValid ? '#5a9a4a' : '#505669' },
            '&:disabled': {
              backgroundColor: '#505669',
              color: 'rgba(255,255,255,0.5)',
            },
          }}
        >
          {isLoading ? 'در حال ارسال...' : 'دریافت کد یکبار مصرف'}
        </Button>

        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Button
            variant="text"
            onClick={() => router.push('/shikshoo/login')}
            sx={{
              color: '#78b568',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
            }}
          >
            ورود
          </Button>
        </Box>
      </Box>
    </>
  );

  const renderCodeInput = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: '10px', mt: 1, mb: 1, direction: 'ltr' }}>
      {codeDigits.map((d, idx) => (
        <TextField
          key={idx}
          inputRef={(el) => (inputsRef.current[idx] = el)}
          value={d}
          onChange={(e) => handleCodeChange(e.target.value, idx)}
          onKeyDown={(e: React.KeyboardEvent) => handleCodeKeyDown(e, idx)}
          inputProps={{ 
            maxLength: 1, 
            inputMode: 'numeric', 
            style: { 
              textAlign: 'center', 
              fontSize: '18px',
              direction: 'ltr'
            } 
          }}
          sx={{
            width: '50px',
            direction: 'ltr',
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: '#2b3143',
              color: '#fff',
              direction: 'ltr',
              '& fieldset': { borderColor: '#505669' },
              '&:hover fieldset': { borderColor: '#78b568' },
              '&.Mui-focused fieldset': { borderColor: '#78b568' },
            },
            '& .MuiInputBase-input': {
              color: '#fff',
              direction: 'ltr',
            },
          }}
        />
      ))}
    </Box>
  );

  const renderVerifyStep = () => (
    <>
      <Typography
        variant="h6"
        sx={{ mb: 2, fontSize: '16px', color: '#fff', textAlign: 'center', fontWeight: 500 }}
      >
        کد تایید ۵ رقمی ارسال شده به شماره زیر را وارد کنید.
      </Typography>
      <Typography sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', mb: 2 }}>{phone}</Typography>

      {renderCodeInput()}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 2 }}>
        <Button
          variant="text"
          disabled={timer > 0}
          onClick={handleSendCode}
          sx={{
            color: timer > 0 ? 'rgba(255,255,255,0.3)' : '#78b568',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '14px',
            '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
          }}
        >
          ارسال مجدد
        </Button>
        <Typography sx={{ color: '#78b568', fontWeight: 600 }}>
          {timer > 0 ? `0${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}` : ''}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px', mt: 1 }}>
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
        <TextField
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="تکرار رمز عبور"
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
      </Box>

      <Button
        variant="contained"
        onClick={handleVerify}
        disabled={!isCodeValid || !isFormValid || isLoading}
        fullWidth
        sx={{
          mt: 2,
          py: '12px',
          borderRadius: '14px',
          fontSize: '15px',
          fontWeight: 600,
          textTransform: 'none',
          backgroundColor: isCodeValid && isFormValid ? '#78b568' : '#505669',
          color: '#fff',
          boxShadow: 'none',
          '&:hover': { backgroundColor: isCodeValid && isFormValid ? '#5a9a4a' : '#505669' },
          '&:disabled': {
            backgroundColor: '#505669',
            color: 'rgba(255,255,255,0.5)',
          },
        }}
      >
        {isLoading ? 'در حال ثبت نام...' : 'ورود'}
      </Button>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Button
          variant="text"
          onClick={() => {
            setStep('phone');
            setTimer(0);
            setCodeDigits(['', '', '', '', '']);
          }}
          sx={{
            color: '#ff9800',
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 600,
            '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
          }}
        >
          ویرایش شماره
        </Button>
      </Box>
    </>
  );

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
          {step === 'phone' ? renderPhoneStep() : renderVerifyStep()}
        </Paper>
      </Container>
      <ToastContainer position="top-center" rtl />
    </Box>
  );
}

