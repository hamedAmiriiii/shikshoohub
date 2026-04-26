"use client";
import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogContent,
  Chip,
  Autocomplete,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MarkunreadMailboxIcon from '@mui/icons-material/MarkunreadMailbox';
import InputAdornment from '@mui/material/InputAdornment';
import PaymentIcon from '@mui/icons-material/Payment';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { clearCart } from '../lib/cart';
import { getCart, removeFromCart, updateCartItemQuantity, syncCartWithServer, type CartItem } from '../lib/cart';
import { apiRequestError } from '@/app/lib/apiRequestError';
import { findColorByName, isLightColor } from '../lib/colors';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const steps = ['سبد خرید', 'تکمیل اطلاعات', 'پرداخت', 'تایید نهایی'];

interface StateOption {
  value: number;
  label: string;
}

interface CityOption {
  value: number;
  label: string;
}

interface ShippingInfo {
  name: string;
  last_name: string;
  phone: string;
  address: string;
  state_id: number | '';
  city_id: number | '';
  postal_code: string;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [loadingTotal, setLoadingTotal] = useState(false);
  
  // States for shipping info
  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: '',
    last_name: '',
    phone: '',
    address: '',
    state_id: '',
    city_id: '',
    postal_code: '',
  });
  const [submittingShipping, setSubmittingShipping] = useState(false);
  const [loadingDefaultAddress, setLoadingDefaultAddress] = useState(false);
  
  // Payment states
  const [useCredit, setUseCredit] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [completingOrder, setCompletingOrder] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [customerCredit, setCustomerCredit] = useState<number>(0);
  const [loadingCredit, setLoadingCredit] = useState(false);
  const [clearCartDialogOpen, setClearCartDialogOpen] = useState(false);

  useEffect(() => {
    // چک کردن لاگین بودن کاربر
    const token = localStorage.getItem('customer_token');
    if (!token) {
      toast.error('لطفاً ابتدا وارد حساب کاربری شوید');
      router.push('/shikshoo/login?redirect=/shikshoo/cart');
      return;
    }
    
    setCartItems(getCart());
    fetchCartFromServer();
    loadCustomerData();
  }, [router]);

  // Fetch default address when going to step 1
  useEffect(() => {
    if (activeStep === 1) {
      fetchDefaultAddress();
    }
  }, [activeStep]);

  // Fetch customer credit when going to step 2
  useEffect(() => {
    if (activeStep === 2) {
      fetchCustomerCredit();
    }
  }, [activeStep]);

  const fetchCustomerCredit = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) return;

    setLoadingCredit(true);
    try {
      const res = await apiRequestError(
        'Get',
        {},
        {},
        '/api/customer/credit',
        true,
        true,
        token
      );

      if (!res.hasError && res.credit !== undefined) {
        setCustomerCredit(res.credit);
      }
    } catch (error) {
      console.error('Error fetching customer credit:', error);
    } finally {
      setLoadingCredit(false);
    }
  };

  const fetchDefaultAddress = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) return;

    setLoadingDefaultAddress(true);
    try {
      const res = await apiRequestError(
        'Get',
        {},
        {},
        '/api/cart/default-address',
        true,
        true,
        token
      );

      if (!res.hasError && res) {
        setShippingInfo(prev => ({
          ...prev,
          name: res.name || prev.name || '',
          last_name: res.last_name || prev.last_name || '',
          phone: res.phone || prev.phone || '',
          address: res.address || prev.address || '',
          state_id: res.state_id || prev.state_id || '',
          city_id: res.city_id || prev.city_id || '',
          postal_code: res.postal_code || prev.postal_code || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching default address:', error);
    } finally {
      setLoadingDefaultAddress(false);
    }
  };

  // Load customer data for default values
  const loadCustomerData = () => {
    const customerData = localStorage.getItem('customer_data');
    if (customerData) {
      try {
        const customer = JSON.parse(customerData);
        setShippingInfo(prev => ({
          ...prev,
          name: customer.name || '',
          phone: customer.phone || '',
        }));
      } catch (e) {
        console.error('Error parsing customer data:', e);
      }
    }
  };

  // Fetch cart from server to get total
  const fetchCartFromServer = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) return;

    setLoadingTotal(true);
    try {
      // Sync cart with server and get total
      const cart = getCart();
      const products = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        ...(item.size && { size: item.size }),
        ...(item.color && { color: item.color }),
      }));

      const res = await apiRequestError(
        'Post',
        {},
        { products },
        '/api/cart',
        true,
        true,
        token
      );

      if (!res.hasError && res.total !== undefined) {
        setServerTotal(res.total);
      }
    } catch (error) {
      console.error('Error fetching cart from server:', error);
    } finally {
      setLoadingTotal(false);
    }
  };

  // Load states
  useEffect(() => {
    const fetchStates = async () => {
      setLoadingStates(true);
      try {
        const res = await apiRequestError('Get', {}, {}, '/api/geo/states', false, false, '');
        if (!res.hasError && Array.isArray(res)) {
          const stateOptions = res.map((s: any) => ({
            value: parseInt(s.id),
            label: s.name,
          }));
          setStates(stateOptions);
        }
      } catch (error) {
        console.error('Error fetching states:', error);
      } finally {
        setLoadingStates(false);
      }
    };
    fetchStates();
  }, []);

  // Load cities when state changes
  useEffect(() => {
    if (!shippingInfo.state_id) {
      setCities([]);
      return;
    }

    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const res = await apiRequestError(
          'Get',
          {},
          {},
          `/api/geo/cities?state_id=${Number(shippingInfo.state_id) - 1}`,
          false,
          false,
          ''
        );
        if (!res.hasError && Array.isArray(res)) {
          const cityOptions = res.map((c: any) => ({
            value: parseInt(c.id),
            label: c.name,
          }));
          setCities(cityOptions);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [shippingInfo.state_id]);

  const getProductImage = (item: CartItem): string => {
    if (item.images && item.images.length > 0) {
      const firstImage = item.images[0];
      if (firstImage.image_url) {
        if (firstImage.image_url.startsWith('http')) {
          return firstImage.image_url;
        } else if (firstImage.image_url.startsWith('/storage/')) {
          return `https://webinoplus.ir${firstImage.image_url}`;
        }
        return firstImage.image_url;
      }
    }
    if (item.image) {
      if (item.image.startsWith('http')) {
        return item.image;
      } else if (item.image.startsWith('/storage/')) {
        return `https://webinoplus.ir${item.image}`;
      }
      return item.image;
    }
    return '/pic/noImageShop.jpg';
  };

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('fa-IR').format(numPrice) + ' تومان';
  };

  const handleQuantityChange = async (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    updateCartItemQuantity(productId, newQuantity);
    setCartItems(getCart());
    window.dispatchEvent(new Event('cartUpdated'));
    await fetchCartFromServer();
  };

  const handleRemoveItem = async (productId: number) => {
    removeFromCart(productId);
    setCartItems(getCart());
    window.dispatchEvent(new Event('cartUpdated'));
    await fetchCartFromServer();
  };

  const calculateTotal = (): number => {
    return cartItems.reduce((total, item) => {
      const price = typeof item.sale_price === 'string' ? parseFloat(item.sale_price) : item.sale_price;
      return total + price * item.quantity;
    }, 0);
  };

  const handleShippingInfoChange = (field: keyof ShippingInfo, value: string | number) => {
    setShippingInfo(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'state_id' ? { city_id: '' } : {}),
    }));
  };

  const handleSubmitShippingInfo = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      toast.error('لطفاً ابتدا وارد شوید');
      router.push('/shikshoo/login');
      return;
    }

    // Validation
    if (!shippingInfo.name.trim()) {
      toast.error('لطفاً نام را وارد کنید');
      return;
    }
    if (!shippingInfo.last_name.trim()) {
      toast.error('لطفاً نام خانوادگی را وارد کنید');
      return;
    }
    if (!shippingInfo.phone || shippingInfo.phone.length !== 11) {
      toast.error('لطفاً شماره موبایل معتبر وارد کنید');
      return;
    }
    if (!shippingInfo.state_id) {
      toast.error('لطفاً استان را انتخاب کنید');
      return;
    }
    if (!shippingInfo.city_id) {
      toast.error('لطفاً شهر را انتخاب کنید');
      return;
    }
    if (!shippingInfo.address.trim()) {
      toast.error('لطفاً آدرس را وارد کنید');
      return;
    }
    if (!shippingInfo.postal_code || shippingInfo.postal_code.length !== 10) {
      toast.error('لطفاً کد پستی معتبر (10 رقمی) وارد کنید');
      return;
    }

    setSubmittingShipping(true);
    try {
      const res = await apiRequestError(
        'Put',
        {},
        {
          name: shippingInfo.name,
          last_name: shippingInfo.last_name,
          phone: shippingInfo.phone,
          address: shippingInfo.address,
          state_id: shippingInfo.state_id,
          city_id: shippingInfo.city_id,
          postal_code: shippingInfo.postal_code,
        },
        '/api/cart/shipping-info',
        true,
        true,
        token
      );

      if (res.hasError) {
        const parsed = JSON.parse(res.errorText || '{}');
        toast.error(parsed.message || 'خطا در ثبت اطلاعات ارسال');
        return;
      }

      // toast.success('اطلاعات ارسال با موفقیت ثبت شد');
      setActiveStep(2);
    } catch (error) {
      console.error('Error submitting shipping info:', error);
      toast.error('خطا در ثبت اطلاعات ارسال');
    } finally {
      setSubmittingShipping(false);
    }
  };

  // Simulate payment gateway
  const handlePayment = async () => {
    setPaymentProcessing(true);
    
    // شبیه‌سازی پرداخت با 3 ثانیه تاخیر
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // شبیه‌سازی موفقیت پرداخت
    setPaymentProcessing(false);
    setPaymentSuccess(true);
    
    // بعد از 1 ثانیه به مرحله تکمیل سفارش برو
    setTimeout(() => {
      setActiveStep(3);
      completeOrder();
    }, 1500);
  };

  // Complete order API call
  const completeOrder = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      setOrderError('لطفاً ابتدا وارد شوید');
      return;
    }

    setCompletingOrder(true);
    setOrderError('');
    
    try {
      // آماده‌سازی محصولات با سایز و رنگ
      const products = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        ...(item.size && { size: item.size }),
        ...(item.color && { color: item.color }),
      }));

      // آماده‌سازی داده‌ها برای API
      const requestData: any = {
        phone: shippingInfo.phone || '',
        products: products,
      };

      const res = await apiRequestError(
        'Post',
        {},
        requestData,
        '/api/cart/complete-order',
        true,
        true,
        token
      );

      if (res.hasError) {
        const parsed = JSON.parse(res.errorText || '{}');
        setOrderError(parsed.message || 'خطا در ثبت سفارش');
        return;
      }

      setOrderCompleted(true);
      clearCart();
      setCartItems([]);
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success('سفارش شما با موفقیت ثبت شد');
    } catch (error) {
      console.error('Error completing order:', error);
      setOrderError('خطا در ثبت سفارش');
    } finally {
      setCompletingOrder(false);
    }
  };

  if (cartItems.length === 0 && activeStep === 0) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          paddingTop: '80px',
          paddingBottom: '40px',
        }}
      >
        <ToastContainer rtl position="top-center" />
        <Container maxWidth="lg">
          <Paper
            sx={{
              padding: '40px',
              textAlign: 'center',
              borderRadius: '16px',
            }}
          >
            <Typography variant="h5" sx={{ marginBottom: '16px', color: '#666' }}>
              سبد خرید شما خالی است
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push('/shikshoo')}
              sx={{
                backgroundColor: '#78b568',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#5a9a4a',
                },
                padding: '10px 24px',
                borderRadius: '15px',
              }}
            >
              بازگشت به فروشگاه
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  const handleClearCart = () => {
    setClearCartDialogOpen(true);
  };

  const confirmClearCart = () => {
    clearCart();
    setCartItems([]);
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('سبد خرید پاک شد');
    setClearCartDialogOpen(false);
  };

  return (
    <Container maxWidth="lg" sx={{ paddingTop: '24px', paddingBottom: '40px' }}>
      <ToastContainer rtl position="top-center" />
      
      {/* Cart Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
          padding: { xs: '16px', md: '20px 24px' },
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.25)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Box
            sx={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingCartIcon sx={{ color: '#fff', fontSize: '26px' }} />
          </Box>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: '700', fontSize: { xs: '18px', md: '20px' } }}>
              سبد خرید
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              {cartItems.length} محصول
            </Typography>
          </Box>
        </Box>
        
        {activeStep === 0 && cartItems.length > 0 && (
          <Button
            variant="contained"
            onClick={handleClearCart}
            startIcon={<DeleteIcon />}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)',
              },
            }}
          >
            
          </Button>
        )}
      </Box>

      <Stepper 
        activeStep={activeStep} 
        sx={{ 
          marginBottom: '32px',
          '& .MuiStepLabel-root .Mui-completed': {
            color: '#4caf50',
          },
          '& .MuiStepLabel-root .Mui-active': {
            color: '#667eea',
          },
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step 0: Cart Items */}
      {activeStep === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {cartItems.map((item) => (
              <Card
                key={item.id}
                sx={{
                  marginBottom: { xs: '12px', sm: '16px' },
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <CardContent sx={{ padding: { xs: '12px', sm: '16px' }, '&:last-child': { paddingBottom: { xs: '12px', sm: '16px' } } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'row', sm: 'row' },
                      gap: { xs: '12px', sm: '16px' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: { xs: '70px', sm: '100px', md: '120px' },
                        height: { xs: '70px', sm: '100px', md: '120px' },
                        minWidth: { xs: '70px', sm: '100px', md: '120px' },
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#f5f5f5',
                      }}
                    >
                      <Image
                        src={getProductImage(item)}
                        alt={item.name}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: { xs: '13px', sm: '16px' },
                          fontWeight: '600',
                          marginBottom: { xs: '4px', sm: '8px' },
                          color: '#333',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {item.name}
                      </Typography>
                      {(item.size || item.color) && (
                        <Box sx={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          {item.size && (
                            <Chip
                              label={`سایز: ${item.size}`}
                              size="small"
                              sx={{
                                backgroundColor: '#f3e8ff',
                                color: '#7c3aed',
                                fontSize: '11px',
                                height: '24px',
                              }}
                            />
                          )}
                          {item.color && (() => {
                            const colorInfo = findColorByName(item.color);
                            const colorCode = colorInfo ? colorInfo.hex : null;
                            const textColor = colorCode ? (isLightColor(colorCode) ? '#000000' : '#ffffff') : '#ef4444';
                            
                            return (
                              <Chip
                                label={`رنگ: ${item.color}`}
                                size="small"
                                sx={{
                                  backgroundColor: colorCode || '#fef2f2',
                                  color: textColor,
                                  fontSize: '11px',
                                  height: '24px',
                                  border: colorCode ? `1px solid ${colorCode}` : 'none',
                                }}
                              />
                            );
                          })()}
                        </Box>
                      )}
                      <Typography
                        variant="body1"
                        sx={{
                          fontSize: { xs: '14px', sm: '18px' },
                          fontWeight: 'bold',
                          color: '#78b568',
                          marginBottom: { xs: '8px', sm: '0' },
                        }}
                      >
                        {formatPrice(item.sale_price)}
                      </Typography>

                      {/* Mobile controls */}
                      <Box
                        sx={{
                          display: { xs: 'flex', sm: 'none' },
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '8px',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            padding: '2px',
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            sx={{ padding: '2px' }}
                          >
                            <RemoveIcon sx={{ fontSize: '18px' }} />
                          </IconButton>
                          <Typography
                            sx={{
                              minWidth: '24px',
                              textAlign: 'center',
                              fontSize: '14px',
                              fontWeight: '600',
                            }}
                          >
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            sx={{ padding: '2px' }}
                          >
                            <AddIcon sx={{ fontSize: '18px' }} />
                          </IconButton>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveItem(item.id)}
                          sx={{ color: '#f44336', padding: '4px' }}
                        >
                          <DeleteIcon sx={{ fontSize: '20px' }} />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Desktop controls */}
                    <Box
                      sx={{
                        display: { xs: 'none', sm: 'flex' },
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '8px',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          padding: '4px',
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          sx={{ padding: '4px', '&:hover': { backgroundColor: 'rgba(120, 181, 104, 0.1)' } }}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={{ minWidth: '30px', textAlign: 'center', fontSize: '16px', fontWeight: '600' }}>
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          sx={{ padding: '4px', '&:hover': { backgroundColor: 'rgba(120, 181, 104, 0.1)' } }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <IconButton
                        onClick={() => handleRemoveItem(item.id)}
                        sx={{ color: '#f44336', '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' } }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                position: 'sticky',
                top: '100px',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
                خلاصه سفارش
              </Typography>
              <Divider sx={{ marginBottom: '16px' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Typography sx={{ color: '#666' }}>تعداد کالا:</Typography>
                <Typography sx={{ fontWeight: '600' }}>
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </Typography>
              </Box>
              <Divider sx={{ marginBottom: '16px', marginTop: '16px' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>
                  مجموع:
                </Typography>
                <Typography sx={{ fontWeight: 'bold', fontSize: '20px', color: '#78b568' }}>
                  {loadingTotal ? (
                    <CircularProgress size={20} />
                  ) : (
                    formatPrice(serverTotal !== null ? serverTotal : calculateTotal())
                  )}
                </Typography>
              </Box>
              <Button
                variant="contained"
                fullWidth
                onClick={() => setActiveStep(1)}
                disabled={loadingTotal || serverTotal === null}
                sx={{
                  backgroundColor: '#78b568',
                  color: '#fff',
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  borderRadius: '15px',
                  '&:hover': { backgroundColor: '#5a9a4a' },
                  '&:disabled': { backgroundColor: '#ccc', color: '#666' },
                }}
              >
                {loadingTotal ? <CircularProgress size={20} color="inherit" /> : 'ادامه سفارش'}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => router.back()}
                sx={{
                  borderColor: '#999',
                  color: '#666',
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '15px',
                  '&:hover': { borderColor: '#666', backgroundColor: 'rgba(0,0,0,0.04)' },
                }}
              >
                بازگشت
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Step 1: Shipping Info */}
      {activeStep === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ position: 'relative' }}>
              {loadingDefaultAddress && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    borderRadius: '16px',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <CircularProgress sx={{ color: '#78b568' }} />
                  <Typography sx={{ color: '#666', fontSize: '14px' }}>در حال بارگذاری اطلاعات...</Typography>
                </Box>
              )}

              {/* Personal Info Section */}
              <Paper
                sx={{
                  padding: { xs: '20px', sm: '28px' },
                  borderRadius: '16px',
                  marginBottom: '20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid #e8e8e8',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <Box
                    sx={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: '#e8f5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PersonIcon sx={{ color: '#78b568', fontSize: '24px' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: '700', fontSize: '18px', color: '#333' }}>
                      اطلاعات گیرنده
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: '#888' }}>
                      مشخصات فرد تحویل گیرنده را وارد کنید
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      variant="filled"
                      label="نام"
                      value={shippingInfo.name}
                      onChange={(e) => handleShippingInfoChange('name', e.target.value)}
                      disabled={loadingDefaultAddress}
                      inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: '#999', fontSize: '20px' }} />
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{ sx: { right: 32, left: 'auto', transformOrigin: 'top right' } }}
                      sx={{
                        direction: 'rtl',
                        '& .MuiFilledInput-root': {
                          borderRadius: '12px',
                          backgroundColor: '#fafafa',
                          paddingRight: '14px',
                          paddingLeft: '14px',
                          '&:hover': { backgroundColor: '#f5f5f5' },
                          '&.Mui-focused': { backgroundColor: '#fff' },
                          '& .MuiInputAdornment-root': {
                            marginRight: '0',
                            marginLeft: '12px',
                          },
                          '&:before': {
                            borderBottom: 'none',
                          },
                          '&:after': {
                            borderBottom: 'none',
                          },
                        },
                        '& .MuiInputLabel-root': { right: 32, left: 'auto', transformOrigin: 'top right' },
                        '& .MuiInputLabel-shrink': { right: 32, left: 'auto', transformOrigin: 'top right' },
                        '& .MuiInputBase-input': {
                          direction: 'rtl',
                          textAlign: 'right',
                          paddingRight: '14px !important',
                          paddingLeft: '0 !important',
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      variant="filled"
                      label="نام خانوادگی"
                      value={shippingInfo.last_name}
                      onChange={(e) => handleShippingInfoChange('last_name', e.target.value)}
                      disabled={loadingDefaultAddress}
                      inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: '#999', fontSize: '20px' }} />
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{ sx: { right: 32, left: 'auto', transformOrigin: 'top right' } }}
                      sx={{
                        direction: 'rtl',
                        '& .MuiFilledInput-root': {
                          borderRadius: '12px',
                          backgroundColor: '#fafafa',
                          paddingRight: '14px',
                          paddingLeft: '14px',
                          '&:hover': { backgroundColor: '#f5f5f5' },
                          '&.Mui-focused': { backgroundColor: '#fff' },
                          '& .MuiInputAdornment-root': {
                            marginRight: '0',
                            marginLeft: '12px',
                          },
                          '&:before': {
                            borderBottom: 'none',
                          },
                          '&:after': {
                            borderBottom: 'none',
                          },
                        },
                        '& .MuiInputLabel-root': { right: 32, left: 'auto', transformOrigin: 'top right' },
                        '& .MuiInputLabel-shrink': { right: 32, left: 'auto', transformOrigin: 'top right' },
                        '& .MuiInputBase-input': {
                          direction: 'rtl',
                          textAlign: 'right',
                          paddingRight: '14px !important',
                          paddingLeft: '0 !important',
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="شماره موبایل"
                      value={shippingInfo.phone}
                      onChange={(e) => handleShippingInfoChange('phone', e.target.value)}
                      inputProps={{ maxLength: 11, dir: 'ltr' }}
                      placeholder="09123456789"
                      disabled={loadingDefaultAddress}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon sx={{ color: '#999', fontSize: '20px' }} />
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{ sx: { right: 32, left: 'auto', transformOrigin: 'top right' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          backgroundColor: '#fafafa',
                          '&:hover': { backgroundColor: '#f5f5f5' },
                          '&.Mui-focused': { backgroundColor: '#fff' },
                        },
                        '& .MuiInputLabel-root': { right: 32, left: 'auto', transformOrigin: 'top right' },
                        '& .MuiInputLabel-shrink': { right: 32, left: 'auto', transformOrigin: 'top right' },
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Address Section */}
              <Paper
                sx={{
                  padding: { xs: '20px', sm: '28px' },
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid #e8e8e8',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <Box
                    sx={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: '#e3f2fd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LocalShippingIcon sx={{ color: '#1976d2', fontSize: '24px' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: '700', fontSize: '18px', color: '#333' }}>
                      آدرس ارسال
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: '#888' }}>
                      آدرس محل تحویل سفارش را وارد کنید
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      disabled={loadingStates || loadingDefaultAddress}
                      options={states}
                      getOptionLabel={(option) => option.label}
                      filterOptions={(options, params) => {
                        const { inputValue } = params;
                        if (!inputValue || inputValue.trim() === '') {
                          return options;
                        }
                        const normalizeString = (str: string) => {
                          return str
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, ' ') // حذف فاصله‌های اضافی
                            .replace(/[یي]/g, 'ی') // یکسان‌سازی ی
                            .replace(/[کك]/g, 'ک') // یکسان‌سازی ک
                            .replace(/[ةه]/g, 'ه'); // یکسان‌سازی ه
                        };
                        const searchTerm = normalizeString(inputValue);
                        const filtered = options.filter((option) => {
                          const normalizedLabel = normalizeString(option.label);
                          // جستجو در کل رشته
                          return normalizedLabel.includes(searchTerm) || 
                                 option.label.toLowerCase().includes(searchTerm) ||
                                 option.label.includes(inputValue.trim());
                        });
                        return filtered;
                      }}
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      value={states.find(state => state.value === shippingInfo.state_id) || null}
                      onChange={(event, newValue) => {
                        handleShippingInfoChange('state_id', newValue ? newValue.value : '');
                        if (!newValue) {
                          handleShippingInfoChange('city_id', '');
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="استان"
                          placeholder="جستجو یا انتخاب استان"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">
                                  {/* <LocationOnIcon sx={{ color: '#999', fontSize: '20px' }} /> */}
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                          InputLabelProps={{ sx: { right: 32, left: 'auto', transformOrigin: 'top right' } }}
                          inputProps={{
                            ...params.inputProps,
                            style: { 
                              ...params.inputProps?.style,
                              direction: 'rtl', 
                              textAlign: 'right' 
                            }
                          }}
                          sx={{
                            direction: 'rtl',
                            '& .MuiFilledInput-root': {
                              borderRadius: '12px',
                              backgroundColor: '#fafafa',
                              paddingRight: '14px',
                              paddingLeft: '14px',
                              '&:hover': { backgroundColor: '#f5f5f5' },
                              '&.Mui-focused': { backgroundColor: '#fff' },
                              '& .MuiInputAdornment-root': {
                                marginRight: '0',
                                marginLeft: '12px',
                              },
                              '&:before': {
                                borderBottom: 'none',
                              },
                              '&:after': {
                                borderBottom: 'none',
                              },
                            },
                            '& .MuiInputLabel-root': { right: 32, left: 'auto', transformOrigin: 'top right' },
                            '& .MuiInputLabel-shrink': { right: 32, left: 'auto', transformOrigin: 'top right' },
                            '& .MuiInputBase-input': {
                              direction: 'rtl',
                              textAlign: 'right',
                              paddingRight: '14px !important',
                              paddingLeft: '0 !important',
                            },
                            '& .MuiAutocomplete-input': {
                              direction: 'rtl',
                              textAlign: 'right',
                              paddingRight: '14px !important',
                              paddingLeft: '0 !important',
                            },
                          }}
                        />
                      )}
                      sx={{
                        direction: 'rtl',
                        '& .MuiAutocomplete-listbox': {
                          direction: 'rtl',
                        },
                        '& .MuiAutocomplete-option': {
                          direction: 'rtl',
                          textAlign: 'right',
                        },
                      }}
                      noOptionsText="استانی یافت نشد"
                      loadingText="در حال بارگذاری..."
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      disabled={!shippingInfo.state_id || loadingCities || loadingDefaultAddress}
                      options={cities}
                      getOptionLabel={(option) => option.label}
                      filterOptions={(options, params) => {
                        const { inputValue } = params;
                        if (!inputValue || inputValue.trim() === '') {
                          return options;
                        }
                        const normalizeString = (str: string) => {
                          return str
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, ' ') // حذف فاصله‌های اضافی
                            .replace(/[یي]/g, 'ی') // یکسان‌سازی ی
                            .replace(/[کك]/g, 'ک') // یکسان‌سازی ک
                            .replace(/[ةه]/g, 'ه'); // یکسان‌سازی ه
                        };
                        const searchTerm = normalizeString(inputValue);
                        const filtered = options.filter((option) => {
                          const normalizedLabel = normalizeString(option.label);
                          // جستجو در کل رشته
                          return normalizedLabel.includes(searchTerm) || 
                                 option.label.toLowerCase().includes(searchTerm) ||
                                 option.label.includes(inputValue.trim());
                        });
                        return filtered;
                      }}
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      value={cities.find(city => city.value === shippingInfo.city_id) || null}
                      onChange={(event, newValue) => {
                        handleShippingInfoChange('city_id', newValue ? newValue.value : '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="شهر"
                          placeholder="جستجو یا انتخاب شهر"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">
                                  <LocationOnIcon sx={{ color: '#999', fontSize: '20px' }} />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                      InputLabelProps={{ sx: { right: 32, left: 'auto', transformOrigin: 'top right' } }}
                      inputProps={{
                        ...params.inputProps,
                        style: { 
                          ...params.inputProps?.style,
                          direction: 'rtl', 
                          textAlign: 'right' 
                        }
                      }}
                      sx={{
                        direction: 'rtl',
                        '& .MuiFilledInput-root': {
                          borderRadius: '12px',
                          backgroundColor: '#fafafa',
                          paddingRight: '14px',
                          paddingLeft: '14px',
                          '&:hover': { backgroundColor: '#f5f5f5' },
                          '&.Mui-focused': { backgroundColor: '#fff' },
                          '& .MuiInputAdornment-root': {
                            marginRight: '0',
                            marginLeft: '12px',
                          },
                          '&:before': {
                            borderBottom: 'none',
                          },
                          '&:after': {
                            borderBottom: 'none',
                          },
                        },
                        '& .MuiInputLabel-root': { right: 32, left: 'auto', transformOrigin: 'top right' },
                        '& .MuiInputLabel-shrink': { right: 32, left: 'auto', transformOrigin: 'top right' },
                        '& .MuiInputBase-input': {
                          direction: 'rtl',
                          textAlign: 'right',
                          paddingRight: '14px !important',
                          paddingLeft: '0 !important',
                        },
                        '& .MuiAutocomplete-input': {
                          direction: 'rtl',
                          textAlign: 'right',
                          paddingRight: '14px !important',
                          paddingLeft: '0 !important',
                        },
                      }}
                    />
                  )}
                  sx={{
                    direction: 'rtl',
                    '& .MuiAutocomplete-listbox': {
                      direction: 'rtl',
                    },
                    '& .MuiAutocomplete-option': {
                      direction: 'rtl',
                      textAlign: 'right',
                    },
                  }}
                  noOptionsText="شهری یافت نشد"
                  loadingText="در حال بارگذاری..."
                />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="کد پستی"
                      value={shippingInfo.postal_code}
                      onChange={(e) => handleShippingInfoChange('postal_code', e.target.value)}
                      inputProps={{ maxLength: 10, dir: 'ltr' }}
                      placeholder="1234567890"
                      disabled={loadingDefaultAddress}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MarkunreadMailboxIcon sx={{ color: '#999', fontSize: '20px' }} />
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{ sx: { right: 32, left: 'auto', transformOrigin: 'top right' } }}
                      sx={{
                        direction: 'rtl',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          backgroundColor: '#fafafa',
                          '&:hover': { backgroundColor: '#f5f5f5' },
                          '&.Mui-focused': { backgroundColor: '#fff' },
                        },
                        '& .MuiInputLabel-root': { right: 32, left: 'auto', transformOrigin: 'top right' },
                        '& .MuiInputLabel-shrink': { right: 32, left: 'auto', transformOrigin: 'top right' },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      variant="filled"
                      label="آدرس کامل"
                      value={shippingInfo.address}
                      onChange={(e) => handleShippingInfoChange('address', e.target.value)}
                      multiline
                      rows={4}
                      placeholder="آدرس دقیق پستی خود را وارد کنید (خیابان، کوچه، پلاک، واحد)"
                      disabled={loadingDefaultAddress}
                      inputProps={{ style: { direction: 'rtl', textAlign: 'right' } }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignSelf: 'flex-start', marginTop: '14px' }}>
                            <LocationOnIcon sx={{ color: '#999', fontSize: '20px' }} />
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{ sx: { right: 32, left: 'auto', transformOrigin: 'top right' } }}
                      sx={{
                        direction: 'rtl',
                        '& .MuiFilledInput-root': {
                          borderRadius: '12px',
                          backgroundColor: '#fafafa',
                          paddingRight: '14px',
                          paddingLeft: '14px',
                          '&:hover': { backgroundColor: '#f5f5f5' },
                          '&.Mui-focused': { backgroundColor: '#fff' },
                          '& .MuiInputAdornment-root': {
                            marginRight: '0',
                            marginLeft: '12px',
                          },
                          '&:before': {
                            borderBottom: 'none',
                          },
                          '&:after': {
                            borderBottom: 'none',
                          },
                        },
                        '& .MuiInputLabel-root': { right: 32, left: 'auto', transformOrigin: 'top right' },
                        '& .MuiInputLabel-shrink': { right: 32, left: 'auto', transformOrigin: 'top right' },
                        '& .MuiInputBase-input': {
                          direction: 'rtl',
                          textAlign: 'right',
                          paddingRight: '14px !important',
                          paddingLeft: '0 !important',
                        },
                        '& textarea': {
                          direction: 'rtl',
                          textAlign: 'right',
                          paddingRight: '14px !important',
                          paddingLeft: '0 !important',
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                position: 'sticky',
                top: '100px',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
                خلاصه سفارش
              </Typography>
              <Divider sx={{ marginBottom: '16px' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Typography sx={{ color: '#666' }}>تعداد کالا:</Typography>
                <Typography sx={{ fontWeight: '600' }}>
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </Typography>
              </Box>
              <Divider sx={{ marginBottom: '16px', marginTop: '16px' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>
                  مجموع:
                </Typography>
                <Typography sx={{ fontWeight: 'bold', fontSize: '20px', color: '#78b568' }}>
                  {formatPrice(serverTotal !== null ? serverTotal : calculateTotal())}
                </Typography>
              </Box>
              <Button
                variant="contained"
                fullWidth
                onClick={handleSubmitShippingInfo}
                disabled={submittingShipping}
                sx={{
                  backgroundColor: '#78b568',
                  color: '#fff',
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  borderRadius: '15px',
                  '&:hover': { backgroundColor: '#5a9a4a' },
                }}
              >
                {submittingShipping ? <CircularProgress size={24} color="inherit" /> : 'ادامه به پرداخت'}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setActiveStep(0)}
                sx={{
                  borderColor: '#999',
                  color: '#666',
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '15px',
                  '&:hover': { borderColor: '#666', backgroundColor: 'rgba(0,0,0,0.04)' },
                }}
              >
                بازگشت به سبد خرید
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Step 2: Payment */}
      {activeStep === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                padding: { xs: '24px', md: '32px' },
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              {/* Payment Processing */}
              {paymentProcessing && (
                <Box sx={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Box
                    sx={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px',
                      animation: 'pulse 1.5s infinite',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)', opacity: 1 },
                        '50%': { transform: 'scale(1.1)', opacity: 0.8 },
                        '100%': { transform: 'scale(1)', opacity: 1 },
                      },
                    }}
                  >
                    <CreditCardIcon sx={{ color: '#fff', fontSize: '40px' }} />
                  </Box>
                  <Typography sx={{ fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                    در حال انتقال به درگاه بانکی...
                  </Typography>
                  <Typography sx={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
                    لطفاً صبر کنید و از بستن صفحه خودداری کنید
                  </Typography>
                  <CircularProgress sx={{ color: '#667eea' }} />
                </Box>
              )}

              {/* Payment Success */}
              {paymentSuccess && !paymentProcessing && (
                <Box sx={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Box
                    sx={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: '#4caf50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px',
                    }}
                  >
                    <CheckCircleIcon sx={{ color: '#fff', fontSize: '50px' }} />
                  </Box>
                  <Typography sx={{ fontSize: '20px', fontWeight: '600', color: '#4caf50', marginBottom: '8px' }}>
                    پرداخت با موفقیت انجام شد
                  </Typography>
                  <Typography sx={{ color: '#666', fontSize: '14px' }}>
                    در حال ثبت سفارش...
                  </Typography>
                </Box>
              )}

              {/* Payment Form */}
              {!paymentProcessing && !paymentSuccess && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <Box
                      sx={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PaymentIcon sx={{ color: '#fff', fontSize: '26px' }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: '700', fontSize: '18px', color: '#333' }}>
                        پرداخت آنلاین
                      </Typography>
                      <Typography sx={{ fontSize: '13px', color: '#888' }}>
                        پرداخت امن از طریق درگاه بانکی
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ marginBottom: '24px' }} />

                  {/* Credit Option - Only show if customer has credit */}
                  {loadingCredit ? (
                    <Paper
                      sx={{
                        padding: '20px',
                        borderRadius: '12px',
                        backgroundColor: '#f8f9ff',
                        border: '1px solid #e8ecff',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                      }}
                    >
                      <CircularProgress size={20} sx={{ color: '#667eea' }} />
                      <Typography sx={{ fontSize: '14px', color: '#666' }}>
                        در حال بررسی اعتبار...
                      </Typography>
                    </Paper>
                  ) : customerCredit > 0 ? (
                    <Paper
                      sx={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        backgroundColor: useCredit ? '#e8f5e9' : '#f8f9ff',
                        border: useCredit ? '2px solid #4caf50' : '1px solid #e8ecff',
                        marginBottom: '24px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={useCredit}
                              onChange={(e) => setUseCredit(e.target.checked)}
                              sx={{
                                color: '#667eea',
                                '&.Mui-checked': { color: '#4caf50' },
                              }}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <AccountBalanceWalletIcon sx={{ color: useCredit ? '#4caf50' : '#667eea', fontSize: '20px' }} />
                              <Typography sx={{ fontSize: '14px', color: '#333' }}>
                                استفاده از اعتبار حساب
                              </Typography>
                            </Box>
                          }
                        />
                        <Box
                          sx={{
                            backgroundColor: useCredit ? '#4caf50' : '#667eea',
                            color: '#fff',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '600',
                          }}
                        >
                          {new Intl.NumberFormat('fa-IR').format(customerCredit)} تومان
                        </Box>
                      </Box>
                      {useCredit && (
                        <Typography sx={{ fontSize: '12px', color: '#4caf50', marginTop: '8px', marginRight: '32px' }}>
                          این مبلغ از کل سفارش کسر خواهد شد
                        </Typography>
                      )}
                    </Paper>
                  ) : null}

                  {/* Bank Logos */}
                  <Box sx={{ marginBottom: '24px' }}>
                    <Typography sx={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>
                      درگاه‌های پرداخت امن:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {['ملت', 'ملی', 'صادرات', 'پارسیان'].map((bank) => (
                        <Paper
                          key={bank}
                          sx={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            backgroundColor: '#f5f5f5',
                            fontSize: '12px',
                            color: '#666',
                          }}
                        >
                          بانک {bank}
                        </Paper>
                      ))}
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handlePayment}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      padding: '14px',
                      fontSize: '16px',
                      fontWeight: '600',
                      borderRadius: '15px',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                      },
                    }}
                  >
                    پرداخت {serverTotal ? new Intl.NumberFormat('fa-IR').format(serverTotal) + ' تومان' : ''}
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setActiveStep(1)}
                    sx={{
                      marginTop: '12px',
                      borderColor: '#999',
                      color: '#666',
                      padding: '12px',
                      fontSize: '14px',
                      borderRadius: '15px',
                      '&:hover': { borderColor: '#666', backgroundColor: 'rgba(0,0,0,0.04)' },
                    }}
                  >
                    بازگشت به مرحله قبل
                  </Button>
                </>
              )}
            </Paper>
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              <Typography sx={{ fontWeight: '700', fontSize: '16px', marginBottom: '16px' }}>
                خلاصه سفارش
              </Typography>
              <Divider sx={{ marginBottom: '16px' }} />
              
              {cartItems.slice(0, 3).map((item) => (
                <Box key={item.id} sx={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <Box
                    sx={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      position: 'relative',
                      backgroundColor: '#f5f5f5',
                    }}
                  >
                    <Image
                      src={getProductImage(item)}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                      {item.name}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#888' }}>
                      تعداد: {item.quantity}
                    </Typography>
                  </Box>
                </Box>
              ))}
              
              {cartItems.length > 3 && (
                <Typography sx={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
                  و {cartItems.length - 3} محصول دیگر...
                </Typography>
              )}

              <Divider sx={{ marginY: '16px' }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Typography sx={{ color: '#666', fontSize: '14px' }}>مجموع:</Typography>
                <Typography sx={{ fontWeight: '700', fontSize: '16px', color: '#333' }}>
                  {serverTotal ? new Intl.NumberFormat('fa-IR').format(serverTotal) : '---'} تومان
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Step 3: Order Confirmation */}
      {activeStep === 3 && (
        <Paper
          sx={{
            padding: { xs: '32px 24px', md: '48px' },
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          {completingOrder && (
            <>
              <CircularProgress size={60} sx={{ color: '#667eea', marginBottom: '24px' }} />
              <Typography sx={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                در حال ثبت سفارش...
              </Typography>
              <Typography sx={{ color: '#666', fontSize: '14px' }}>
                لطفاً صبر کنید
              </Typography>
            </>
          )}

          {orderError && !completingOrder && (
            <>
              <Box
                sx={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#f44336',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                }}
              >
                <ErrorIcon sx={{ color: '#fff', fontSize: '50px' }} />
              </Box>
              <Typography sx={{ fontSize: '20px', fontWeight: '600', color: '#f44336', marginBottom: '8px' }}>
                خطا در ثبت سفارش
              </Typography>
              <Typography sx={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
                {orderError}
              </Typography>
              <Button
                variant="contained"
                onClick={completeOrder}
                sx={{
                  backgroundColor: '#667eea',
                  color: '#fff',
                  padding: '12px 32px',
                  borderRadius: '15px',
                  '&:hover': { backgroundColor: '#5a6fd6' },
                }}
              >
                تلاش مجدد
              </Button>
            </>
          )}

          {orderCompleted && !completingOrder && (
            <>
              <Box
                sx={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
                }}
              >
                <CheckCircleIcon sx={{ color: '#fff', fontSize: '60px' }} />
              </Box>
              <Typography sx={{ fontSize: '24px', fontWeight: '700', color: '#4caf50', marginBottom: '8px' }}>
                سفارش شما با موفقیت ثبت شد!
              </Typography>
              <Typography sx={{ color: '#666', fontSize: '15px', marginBottom: '32px', lineHeight: 1.8 }}>
                از خرید شما متشکریم. اطلاعات سفارش به شماره موبایل شما ارسال خواهد شد.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => router.push('/shikshoo')}
                  startIcon={<ShoppingBagIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '15px',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                    },
                  }}
                >
                  ادامه خرید
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/shikshoo/orders')}
                  sx={{
                    borderColor: '#667eea',
                    color: '#667eea',
                    padding: '12px 24px',
                    borderRadius: '15px',
                    '&:hover': {
                      borderColor: '#5a6fd6',
                      backgroundColor: 'rgba(102, 126, 234, 0.08)',
                    },
                  }}
                >
                  پیگیری سفارش
                </Button>
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* Clear Cart Confirmation Dialog */}
      <Dialog
        open={clearCartDialogOpen}
        onClose={() => setClearCartDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            padding: '8px',
            maxWidth: '400px',
            width: '90%',
            overflow: 'hidden',
          },
        }}
      >
        <DialogContent sx={{ padding: '32px 24px', textAlign: 'center' }}>
          {/* Warning Icon */}
          <Box
            sx={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 8px 24px rgba(238, 90, 90, 0.3)',
            }}
          >
            <RemoveShoppingCartIcon sx={{ color: '#fff', fontSize: '40px' }} />
          </Box>

          {/* Title */}
          <Typography
            sx={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#333',
              marginBottom: '12px',
            }}
          >
            پاک کردن سبد خرید
          </Typography>

          {/* Description */}
          <Typography
            sx={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '28px',
              lineHeight: 1.7,
            }}
          >
            آیا از حذف تمام محصولات سبد خرید مطمئن هستید؟
            <br />
          </Typography>

          {/* Buttons */}
          <Box sx={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => setClearCartDialogOpen(false)}
              sx={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                borderColor: '#ddd',
                color: '#666',
                '&:hover': {
                  borderColor: '#bbb',
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              انصراف
            </Button>
            <Button
              variant="contained"
              onClick={confirmClearCart}
              sx={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
                boxShadow: '0 4px 14px rgba(238, 90, 90, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ff5252 0%, #e04848 100%)',
                  boxShadow: '0 6px 20px rgba(238, 90, 90, 0.4)',
                },
              }}
            >
              بله، پاک شود
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
